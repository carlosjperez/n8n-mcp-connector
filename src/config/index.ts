import { config } from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables
config();

/**
 * Configuration interface for the N8N MCP Connector
 */
export interface Config {
  // N8N Configuration
  n8n: {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    retries: number;
    retryDelay: number;
  };
  
  // Server Configuration
  server: {
    port: number;
    host: string;
    environment: 'development' | 'production' | 'test';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  // Cache Configuration
  cache: {
    defaultTtl: number;
    maxSize: number;
    checkPeriod: number;
    workflows: {
      listTtl: number;
      detailsTtl: number;
    };
    executions: {
      completedTtl: number;
      runningTtl: number;
    };
    nodes: {
      ttl: number;
    };
  };
  
  // Performance Configuration
  performance: {
    connectionPoolSize: number;
    requestTimeout: number;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
  
  // Monitoring Configuration
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
    performanceThreshold: number;
  };
}

/**
 * Default configuration values
 */
const defaultConfig: Config = {
  n8n: {
    baseUrl: 'http://localhost:5678',
    apiKey: '',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  },
  
  server: {
    port: 3000,
    host: 'localhost',
    environment: 'development',
    logLevel: 'info',
  },
  
  cache: {
    defaultTtl: 600000, // 10 minutes
    maxSize: 1000,
    checkPeriod: 60000, // 1 minute
    workflows: {
      listTtl: 300000, // 5 minutes
      detailsTtl: 600000, // 10 minutes
    },
    executions: {
      completedTtl: 1800000, // 30 minutes
      runningTtl: 30000, // 30 seconds
    },
    nodes: {
      ttl: 900000, // 15 minutes
    },
  },
  
  performance: {
    connectionPoolSize: 10,
    requestTimeout: 30000,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 60000,
    rateLimitRequests: 100,
    rateLimitWindow: 60000,
  },
  
  monitoring: {
    enabled: true,
    metricsInterval: 30000, // 30 seconds
    healthCheckInterval: 60000, // 1 minute
    performanceThreshold: 5000, // 5 seconds
  },
};

/**
 * Parse environment variable as number with fallback
 */
function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Parse environment variable as boolean with fallback
 */
function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

/**
 * Validate required configuration values
 */
function validateConfig(config: Config): void {
  const errors: string[] = [];
  
  // Validate N8N configuration
  if (!config.n8n.baseUrl) {
    errors.push('N8N_BASE_URL is required');
  }
  
  if (!config.n8n.apiKey) {
    errors.push('N8N_API_KEY is required');
  }
  
  // Validate URL format
  try {
    new URL(config.n8n.baseUrl);
  } catch {
    errors.push('N8N_BASE_URL must be a valid URL');
  }
  
  // Validate numeric values
  if (config.n8n.timeout <= 0) {
    errors.push('N8N_TIMEOUT must be greater than 0');
  }
  
  if (config.server.port <= 0 || config.server.port > 65535) {
    errors.push('SERVER_PORT must be between 1 and 65535');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Load and validate configuration from environment variables
 */
function loadConfig(): Config {
  const config: Config = {
    n8n: {
      baseUrl: process.env.N8N_BASE_URL || defaultConfig.n8n.baseUrl,
      apiKey: process.env.N8N_API_KEY || defaultConfig.n8n.apiKey,
      timeout: parseNumber(process.env.N8N_TIMEOUT, defaultConfig.n8n.timeout),
      retries: parseNumber(process.env.N8N_RETRIES, defaultConfig.n8n.retries),
      retryDelay: parseNumber(process.env.N8N_RETRY_DELAY, defaultConfig.n8n.retryDelay),
    },
    
    server: {
      port: parseNumber(process.env.SERVER_PORT || process.env.PORT, defaultConfig.server.port),
      host: process.env.SERVER_HOST || defaultConfig.server.host,
      environment: (process.env.NODE_ENV as any) || defaultConfig.server.environment,
      logLevel: (process.env.LOG_LEVEL as any) || defaultConfig.server.logLevel,
    },
    
    cache: {
      defaultTtl: parseNumber(process.env.CACHE_DEFAULT_TTL, defaultConfig.cache.defaultTtl),
      maxSize: parseNumber(process.env.CACHE_MAX_SIZE, defaultConfig.cache.maxSize),
      checkPeriod: parseNumber(process.env.CACHE_CHECK_PERIOD, defaultConfig.cache.checkPeriod),
      workflows: {
        listTtl: parseNumber(process.env.CACHE_WORKFLOWS_LIST_TTL, defaultConfig.cache.workflows.listTtl),
        detailsTtl: parseNumber(process.env.CACHE_WORKFLOWS_DETAILS_TTL, defaultConfig.cache.workflows.detailsTtl),
      },
      executions: {
        completedTtl: parseNumber(process.env.CACHE_EXECUTIONS_COMPLETED_TTL, defaultConfig.cache.executions.completedTtl),
        runningTtl: parseNumber(process.env.CACHE_EXECUTIONS_RUNNING_TTL, defaultConfig.cache.executions.runningTtl),
      },
      nodes: {
        ttl: parseNumber(process.env.CACHE_NODES_TTL, defaultConfig.cache.nodes.ttl),
      },
    },
    
    performance: {
      connectionPoolSize: parseNumber(process.env.CONNECTION_POOL_SIZE, defaultConfig.performance.connectionPoolSize),
      requestTimeout: parseNumber(process.env.REQUEST_TIMEOUT, defaultConfig.performance.requestTimeout),
      circuitBreakerThreshold: parseNumber(process.env.CIRCUIT_BREAKER_THRESHOLD, defaultConfig.performance.circuitBreakerThreshold),
      circuitBreakerTimeout: parseNumber(process.env.CIRCUIT_BREAKER_TIMEOUT, defaultConfig.performance.circuitBreakerTimeout),
      rateLimitRequests: parseNumber(process.env.RATE_LIMIT_REQUESTS, defaultConfig.performance.rateLimitRequests),
      rateLimitWindow: parseNumber(process.env.RATE_LIMIT_WINDOW, defaultConfig.performance.rateLimitWindow),
    },
    
    monitoring: {
      enabled: parseBoolean(process.env.MONITORING_ENABLED, defaultConfig.monitoring.enabled),
      metricsInterval: parseNumber(process.env.METRICS_INTERVAL, defaultConfig.monitoring.metricsInterval),
      healthCheckInterval: parseNumber(process.env.HEALTH_CHECK_INTERVAL, defaultConfig.monitoring.healthCheckInterval),
      performanceThreshold: parseNumber(process.env.PERFORMANCE_THRESHOLD, defaultConfig.monitoring.performanceThreshold),
    },
  };
  
  // Validate configuration
  validateConfig(config);
  
  logger.info('Configuration loaded successfully', {
    environment: config.server.environment,
    n8nBaseUrl: config.n8n.baseUrl,
    cacheEnabled: true,
    monitoringEnabled: config.monitoring.enabled
  });
  
  return config;
}

// Export the loaded configuration
export const appConfig = loadConfig();

// Export individual config sections for convenience
export const n8nConfig = appConfig.n8n;
export const serverConfig = appConfig.server;
export const cacheConfig = appConfig.cache;
export const performanceConfig = appConfig.performance;
export const monitoringConfig = appConfig.monitoring;

// Export validation function for testing
export { validateConfig };