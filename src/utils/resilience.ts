/**
 * Auto-Repair and Resilience System for N8N MCP Server
 * Implements retry logic, circuit breaker, and graceful degradation
 */

import { logger, LogContext } from './logger.js';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: CircuitBreakerConfig) {
    this.name = name;
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>, context?: LogContext): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.name} transitioning to HALF_OPEN`, context);
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN - operation blocked`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(context);
      return result;
    } catch (error) {
      this.onFailure(error, context);
      throw error;
    }
  }

  private onSuccess(context?: LogContext): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitState.CLOSED;
        logger.info(`Circuit breaker ${this.name} transitioning to CLOSED`, context);
      }
    }
  }

  private onFailure(error: any, context?: LogContext): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker ${this.name} transitioning to OPEN from HALF_OPEN`, {
        ...context,
        error: error.message
      });
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn(`Circuit breaker ${this.name} transitioning to OPEN`, {
        ...context,
        failureCount: this.failureCount,
        error: error.message
      });
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats(): { state: CircuitState; failureCount: number; successCount: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount
    };
  }
}

export class ResilienceManager {
  private static instance: ResilienceManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN']
  };
  private defaultCircuitConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  };

  private constructor() {}

  static getInstance(): ResilienceManager {
    if (!ResilienceManager.instance) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }

  /**
   * Execute operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: LogContext
  ): Promise<T> {
    const finalConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: any;
    
    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const timer = logger.startTimer(`Retry attempt ${attempt}`, context);
        const result = await operation();
        timer();
        
        if (attempt > 1) {
          logger.info(`Operation succeeded on attempt ${attempt}`, context);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        const isRetryable = this.isRetryableError(error, finalConfig.retryableErrors);
        const isLastAttempt = attempt === finalConfig.maxAttempts;
        
        logger.warn(`Operation failed on attempt ${attempt}`, {
          ...context,
          error: error.message,
          isRetryable,
          isLastAttempt
        });
        
        if (isLastAttempt || !isRetryable) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        );
        
        logger.debug(`Retrying in ${delay}ms`, context);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Get or create circuit breaker
   */
  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      const finalConfig = { ...this.defaultCircuitConfig, ...config };
      this.circuitBreakers.set(name, new CircuitBreaker(name, finalConfig));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async withCircuitBreaker<T>(
    name: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
    context?: LogContext
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(name, config);
    return circuitBreaker.execute(operation, context);
  }

  /**
   * Execute operation with both retry and circuit breaker
   */
  async withResilience<T>(
    name: string,
    operation: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>,
    circuitConfig?: Partial<CircuitBreakerConfig>,
    context?: LogContext
  ): Promise<T> {
    return this.withCircuitBreaker(
      name,
      () => this.withRetry(operation, retryConfig, context),
      circuitConfig,
      context
    );
  }

  /**
   * Execute operation with fallback
   */
  async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    try {
      return await primary();
    } catch (error: any) {
      logger.warn('Primary operation failed, executing fallback', {
        ...context,
        error: error.message
      });
      
      try {
        const result = await fallback();
        logger.info('Fallback operation succeeded', context);
        return result;
      } catch (fallbackError: any) {
        logger.error('Fallback operation also failed', {
          ...context,
          primaryError: error.message,
          fallbackError: fallbackError.message
        });
        throw fallbackError;
      }
    }
  }

  /**
   * Execute operation with timeout
   */
  async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    context?: LogContext
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error: any) {
      if (error.message.includes('timed out')) {
        logger.warn(`Operation timed out after ${timeoutMs}ms`, context);
      }
      throw error;
    }
  }

  /**
   * Get health status of all circuit breakers
   */
  getHealthStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [name, breaker] of this.circuitBreakers) {
      status[name] = breaker.getStats();
    }
    
    return status;
  }

  private isRetryableError(error: any, retryableErrors?: string[]): boolean {
    if (!retryableErrors) return true;
    
    const errorCode = error.code || error.errno || '';
    const errorMessage = error.message || '';
    
    return retryableErrors.some(retryableError => 
      errorCode.includes(retryableError) || errorMessage.includes(retryableError)
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const resilience = ResilienceManager.getInstance();