/**
 * Configuration Management for N8N MCP Server
 * Implements secure configuration loading with validation and defaults
 */

import { logger } from '../utils/logger.js';

export interface N8nConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  timeout: number;
  maxRetries: number;
  enableCircuitBreaker: boolean;
  webhookAuth: {
    enabled: boolean;
    username?: string;
    password?: string;
  };
}

export interface ServerConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  logLevel: string;
  enableConsoleOutput: boolean;
  maxConcurrentRequests: number;
  requestTimeout: number;
}

export interface SecurityConfig {
  enableRateLimit: boolean;
  maxRequestsPerMinute: number;
  enableInputSanitization: boolean;
  maxPayloadSize: number;
  allowedOrigins: string[];
  enableAuditLog: boolean;
}

export interface AppConfig {
  n8n: N8nConfig;
  server: ServerConfig;
  security: SecurityConfig;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private isLoaded = false;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfiguration(): AppConfig {
    logger.info('Loading configuration from environment variables');

    const config: AppConfig = {
      n8n: this.loadN8nConfig(),
      server: this.loadServerConfig(),
      security: this.loadSecurityConfig()
    };

    this.validateConfiguration(config);
    this.isLoaded = true;
    
    logger.info('Configuration loaded successfully', {
      environment: config.server.environment,
      n8nUrl: this.maskUrl(config.n8n.baseUrl),
      hasApiKey: !!config.n8n.apiKey,
      hasBasicAuth: !!(config.n8n.username && config.n8n.password)
    });

    return config;
  }

  private loadN8nConfig(): N8nConfig {
    const baseUrl = process.env.N8N_BASE_URL || process.env.N8N_API_URL || 'http://localhost:5678';
    
    // Clean up URL format
    const cleanUrl = baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    
    return {
      baseUrl: cleanUrl,
      apiKey: process.env.N8N_API_KEY,
      username: process.env.N8N_USERNAME,
      password: process.env.N8N_PASSWORD,
      timeout: parseInt(process.env.N8N_TIMEOUT || '30000', 10),
      maxRetries: parseInt(process.env.N8N_MAX_RETRIES || '3', 10),
      enableCircuitBreaker: process.env.N8N_ENABLE_CIRCUIT_BREAKER !== 'false',
      webhookAuth: {
        enabled: process.env.N8N_WEBHOOK_AUTH_ENABLED === 'true',
        username: process.env.N8N_WEBHOOK_USERNAME,
        password: process.env.N8N_WEBHOOK_PASSWORD
      }
    };
  }

  private loadServerConfig(): ServerConfig {
    return {
      name: process.env.SERVER_NAME || 'n8n-mcp-server',
      version: process.env.npm_package_version || '1.1.1',
      environment: (process.env.NODE_ENV as any) || 'development',
      logLevel: process.env.LOG_LEVEL || 'INFO',
      enableConsoleOutput: process.env.DISABLE_CONSOLE_OUTPUT !== 'true',
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10', 10),
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10)
    };
  }

  private loadSecurityConfig(): SecurityConfig {
    return {
      enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
      maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60', 10),
      enableInputSanitization: process.env.ENABLE_INPUT_SANITIZATION !== 'false',
      maxPayloadSize: parseInt(process.env.MAX_PAYLOAD_SIZE || '1048576', 10), // 1MB
      allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(',').map(o => o.trim()),
      enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true'
    };
  }

  private validateConfiguration(config: AppConfig): void {
    const errors: string[] = [];
    const isTestMode = process.env.NODE_ENV === 'test';

    // Validate N8N configuration
    if (!config.n8n.baseUrl) {
      errors.push('N8N base URL is required');
    } else {
      try {
        new URL(config.n8n.baseUrl);
      } catch {
        errors.push('N8N base URL must be a valid URL');
      }
    }

    // Validate authentication (skip in test mode)
    if (!isTestMode && !config.n8n.apiKey && (!config.n8n.username || !config.n8n.password)) {
      errors.push('N8N authentication required: Set N8N_API_KEY or N8N_USERNAME/N8N_PASSWORD');
    }

    // Validate numeric values
    if (config.n8n.timeout < 1000 || config.n8n.timeout > 300000) {
      errors.push('N8N timeout must be between 1000ms and 300000ms');
    }

    if (config.n8n.maxRetries < 0 || config.n8n.maxRetries > 10) {
      errors.push('N8N max retries must be between 0 and 10');
    }

    if (config.server.maxConcurrentRequests < 1 || config.server.maxConcurrentRequests > 100) {
      errors.push('Max concurrent requests must be between 1 and 100');
    }

    if (config.security.maxPayloadSize < 1024 || config.security.maxPayloadSize > 10485760) {
      errors.push('Max payload size must be between 1KB and 10MB');
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed', { errors });
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }

  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80')}`;
    } catch {
      return '[invalid-url]';
    }
  }

  getConfig(): AppConfig {
    if (!this.isLoaded) {
      throw new Error('Configuration not loaded');
    }
    return this.config;
  }

  getN8nConfig(): N8nConfig {
    return this.getConfig().n8n;
  }

  getServerConfig(): ServerConfig {
    return this.getConfig().server;
  }

  getSecurityConfig(): SecurityConfig {
    return this.getConfig().security;
  }

  /**
   * Reload configuration (useful for testing or dynamic updates)
   */
  reload(): void {
    logger.info('Reloading configuration');
    this.config = this.loadConfiguration();
  }

  /**
   * Get configuration summary for debugging
   */
  getSummary(): Record<string, any> {
    const config = this.getConfig();
    return {
      server: {
        name: config.server.name,
        version: config.server.version,
        environment: config.server.environment,
        logLevel: config.server.logLevel
      },
      n8n: {
        baseUrl: this.maskUrl(config.n8n.baseUrl),
        hasApiKey: !!config.n8n.apiKey,
        hasBasicAuth: !!(config.n8n.username && config.n8n.password),
        timeout: config.n8n.timeout,
        maxRetries: config.n8n.maxRetries,
        circuitBreakerEnabled: config.n8n.enableCircuitBreaker
      },
      security: {
        rateLimitEnabled: config.security.enableRateLimit,
        inputSanitizationEnabled: config.security.enableInputSanitization,
        auditLogEnabled: config.security.enableAuditLog,
        maxPayloadSize: config.security.maxPayloadSize
      }
    };
  }
}

// Export singleton instance (lazy initialization)
let configInstance: ConfigManager | null = null;

export const config = {
  getInstance(): ConfigManager {
    if (!configInstance) {
      configInstance = ConfigManager.getInstance();
    }
    return configInstance;
  },
  
  // Proxy methods for convenience
  getConfig: () => config.getInstance().getConfig(),
  getN8nConfig: () => config.getInstance().getN8nConfig(),
  getServerConfig: () => config.getInstance().getServerConfig(),
  getSecurityConfig: () => config.getInstance().getSecurityConfig(),
  getSummary: () => config.getInstance().getSummary(),
  reload: () => config.getInstance().reload()
};