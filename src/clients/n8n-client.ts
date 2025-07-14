/**
 * Modular N8N Client with Resilience and Advanced Error Handling
 * Implements best practices for API communication with auto-repair capabilities
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger, LogContext } from '../utils/logger.js';
import { resilience } from '../utils/resilience.js';
import { validator } from '../utils/validator.js';
import { config, N8nConfig } from '../config/config.js';
import { workflowCache, executionCache } from '../utils/cache.js';
import { metrics } from '../utils/metrics.js';

export interface N8nApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  metadata?: {
    total?: number;
    count?: number;
    offset?: number;
    limit?: number;
  };
}

export interface WorkflowSummary {
  id: string;
  name: string;
  active: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  tags?: string[];
}

export interface ExecutionSummary {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: string;
  stoppedAt?: string;
  duration?: number;
  mode: string;
  errorMessage?: string;
}

export interface WorkflowDetails {
  id: string;
  name: string;
  active: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: [number, number];
    parameters?: Record<string, any>;
  }>;
  connections: Record<string, any>;
  settings?: Record<string, any>;
  tags?: string[];
  versionId?: string;
}

export class N8nClient {
  private client: AxiosInstance;
  private config: N8nConfig;
  private requestCounter = 0;
  private connectionPool = new Map<string, AxiosInstance>();

  constructor() {
    this.config = config.getN8nConfig();
    this.client = this.createAxiosClient();
    this.setupInterceptors();
  }

  private createAxiosClient(): AxiosInstance {
    const client = axios.create({
      baseURL: `${this.config.baseUrl}/api/v1`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `n8n-mcp-server/${config.getServerConfig().version}`,
      },
    });

    // Add authentication
    if (this.config.apiKey) {
      client.defaults.headers.common['X-N8N-API-KEY'] = this.config.apiKey;
    } else if (this.config.username && this.config.password) {
      const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      client.defaults.headers.common['Authorization'] = `Basic ${auth}`;
    }

    return client;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const requestId = `req_${++this.requestCounter}_${Date.now()}`;
        (config as any).metadata = { requestId, startTime: Date.now() };
        
        // Update metrics
        metrics.incrementCounter('n8n_requests_total', 1, {
          method: config.method?.toUpperCase() || 'UNKNOWN',
          endpoint: this.sanitizeEndpoint(config.url || '')
        });
        
        logger.debug('N8N API request started', {
          requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
          hasData: !!config.data
        });
        
        return config;
      },
      (error) => {
        metrics.incrementCounter('n8n_request_errors_total', 1, { type: 'setup' });
        logger.error('N8N API request setup failed', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const requestId = (response.config as any).metadata?.requestId;
        const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
        
        // Record metrics
        metrics.recordHistogram('n8n_request_duration_seconds', duration / 1000, {
          method: response.config.method?.toUpperCase() || 'UNKNOWN',
          status: response.status.toString(),
          endpoint: this.sanitizeEndpoint(response.config.url || '')
        });
        
        logger.debug('N8N API request completed', {
          requestId,
          status: response.status,
          duration,
          url: response.config.url
        });
        
        return response;
      },
      (error) => {
        const requestId = error.config?.metadata?.requestId;
        const duration = Date.now() - (error.config?.metadata?.startTime || 0);
        
        // Record error metrics
        metrics.incrementCounter('n8n_request_errors_total', 1, {
          type: 'response',
          status: error.response?.status?.toString() || 'unknown'
        });
        
        metrics.recordHistogram('n8n_request_duration_seconds', duration / 1000, {
          method: error.config?.method?.toUpperCase() || 'UNKNOWN',
          status: error.response?.status?.toString() || 'error',
          endpoint: this.sanitizeEndpoint(error.config?.url || '')
        });
        
        logger.warn('N8N API request failed', {
          requestId,
          status: error.response?.status,
          duration,
          error: error.message,
          url: error.config?.url
        });
        
        return Promise.reject(this.enhanceError(error));
      }
    );
  }

  private sanitizeEndpoint(url: string): string {
    // Remove IDs and sensitive data from URL for metrics
    return url
      .replace(/\/[a-f0-9-]{36}\//g, '/{id}/')
      .replace(/\/\d+\//g, '/{id}/')
      .replace(/\?.*$/, '');
  }

  private enhanceError(error: any): Error {
    const enhanced = new Error();
    enhanced.name = 'N8nApiError';
    
    if (error.response) {
      enhanced.message = `N8N API error (${error.response.status}): ${error.response.data?.message || error.message}`;
      (enhanced as any).status = error.response.status;
      (enhanced as any).data = error.response.data;
    } else if (error.request) {
      enhanced.message = `N8N API connection error: ${error.message}`;
      (enhanced as any).code = error.code;
    } else {
      enhanced.message = `N8N API request setup error: ${error.message}`;
    }
    
    (enhanced as any).originalError = error;
    return enhanced;
  }

  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    options: AxiosRequestConfig = {},
    context?: LogContext
  ): Promise<T> {
    const operation = async (): Promise<T> => {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url: endpoint,
        data,
        ...options
      });
      return response.data;
    };

    if (this.config.enableCircuitBreaker) {
      return resilience.withResilience(
        `n8n-api-${method.toLowerCase()}-${endpoint.replace(/\//g, '-')}`,
        operation,
        {
          maxAttempts: this.config.maxRetries,
          retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '502', '503', '504']
        },
        undefined,
        context
      );
    } else {
      return resilience.withRetry(
        operation,
        {
          maxAttempts: this.config.maxRetries,
          retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '502', '503', '504']
        },
        context
      );
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    data?: any,
    waitForCompletion = true
  ): Promise<{ executionId: string; status?: string; data?: any }> {
    const context: LogContext = { operation: 'executeWorkflow', workflowId };
    
    // Validate inputs
    const workflowValidation = validator.validateWorkflowId(workflowId);
    if (!workflowValidation.isValid) {
      throw new Error(`Invalid workflow ID: ${workflowValidation.errors.join(', ')}`);
    }

    const dataValidation = validator.validateExecutionData(data);
    if (!dataValidation.isValid) {
      throw new Error(`Invalid execution data: ${dataValidation.errors.join(', ')}`);
    }

    logger.info('Executing workflow', context);

    const payload: any = {};
    if (dataValidation.sanitizedData) {
      payload.data = dataValidation.sanitizedData;
    }

    const response = await this.makeRequest<any>(
      'POST',
      `/workflows/${workflowValidation.sanitizedData}/execute`,
      payload,
      {},
      context
    );

    const executionId = response.data?.executionId || response.data?.id;
    if (!executionId) {
      throw new Error('No execution ID returned from workflow execution');
    }

    logger.info('Workflow execution started', { ...context, executionId });

    if (waitForCompletion) {
      return this.waitForExecution(executionId, context);
    }

    return { executionId };
  }

  /**
   * Wait for execution completion with timeout
   */
  private async waitForExecution(
    executionId: string,
    context: LogContext,
    maxWaitTime = 300000 // 5 minutes
  ): Promise<{ executionId: string; status: string; data?: any }> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const execution = await this.getExecutionStatus(executionId);
        
        if (execution.status === 'success' || execution.status === 'error') {
          logger.info('Workflow execution completed', {
            ...context,
            executionId,
            status: execution.status,
            duration: Date.now() - startTime
          });
          
          return {
            executionId,
            status: execution.status,
            data: execution
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        logger.warn('Error checking execution status', {
          ...context,
          executionId,
          error: error.message
        });
        
        // Continue polling unless it's a critical error
        if (error.status === 404) {
          throw new Error(`Execution ${executionId} not found`);
        }
      }
    }

    throw new Error(`Workflow execution timed out after ${maxWaitTime}ms`);
  }

  /**
   * List workflows with filtering
   */
  async listWorkflows(filters: {
    active?: boolean;
    tags?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<WorkflowSummary[]> {
    const context: LogContext = { operation: 'listWorkflows' };
    
    // Create cache key based on filters
    const cacheKey = `workflows:list:${JSON.stringify(filters)}`;
    
    // Try to get from cache first
    const cached = workflowCache.get(cacheKey) as WorkflowSummary[] | undefined;
    if (cached) {
      metrics.incrementCounter('cache_hits_total', 1, { cache: 'workflows', operation: 'list' });
      logger.debug('Workflows retrieved from cache', { ...context, cacheKey });
      return cached;
    }
    
    metrics.incrementCounter('cache_misses_total', 1, { cache: 'workflows', operation: 'list' });
    
    // Validate pagination
    const paginationValidation = validator.validatePagination(filters.limit, filters.offset);
    if (!paginationValidation.isValid) {
      throw new Error(`Invalid pagination: ${paginationValidation.errors.join(', ')}`);
    }

    logger.debug('Listing workflows', { ...context, filters });

    const params: Record<string, any> = {};
    if (filters.active !== undefined) params.active = filters.active;
    if (paginationValidation.sanitizedData?.limit) params.limit = paginationValidation.sanitizedData.limit;
    if (paginationValidation.sanitizedData?.offset) params.offset = paginationValidation.sanitizedData.offset;

    const response = await this.makeRequest<any>(
      'GET',
      '/workflows',
      undefined,
      { params },
      context
    );

    const workflows = response.data || [];
    
    const result = workflows.map((workflow: any) => ({
      id: workflow.id || '',
      name: workflow.name || 'Unnamed Workflow',
      active: workflow.active || false,
      isArchived: workflow.isArchived || false,
      createdAt: workflow.createdAt || new Date().toISOString(),
      updatedAt: workflow.updatedAt || new Date().toISOString(),
      nodeCount: workflow.nodes?.length || 0,
      tags: workflow.tags || []
    }));

    // Cache the result with shorter TTL for list operations
    workflowCache.set(cacheKey, result, 300000); // 5 minutes

    return result;
  }

  /**
   * Get workflow details
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDetails> {
    const context: LogContext = { operation: 'getWorkflow', workflowId };
    
    // Check cache first
    const cacheKey = `workflow:${workflowId}`;
    const cached = workflowCache.get(cacheKey) as WorkflowDetails | undefined;
    if (cached) {
      metrics.incrementCounter('cache_hits_total', 1, { cache: 'workflows', operation: 'get' });
      logger.debug('Workflow retrieved from cache', { ...context, cacheKey });
      return cached;
    }
    
    metrics.incrementCounter('cache_misses_total', 1, { cache: 'workflows', operation: 'get' });
    
    // Validate workflow ID
    const validation = validator.validateWorkflowId(workflowId);
    if (!validation.isValid) {
      throw new Error(`Invalid workflow ID: ${validation.errors.join(', ')}`);
    }

    logger.debug('Getting workflow details', context);

    const response = await this.makeRequest<any>(
      'GET',
      `/workflows/${validation.sanitizedData}`,
      undefined,
      {},
      context
    );

    const workflow = response.data?.data || response.data;
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const result = {
      id: workflow.id || workflowId,
      name: workflow.name || 'Unnamed Workflow',
      active: workflow.active || false,
      isArchived: workflow.isArchived || false,
      createdAt: workflow.createdAt || new Date().toISOString(),
      updatedAt: workflow.updatedAt || new Date().toISOString(),
      nodes: (workflow.nodes || []).map((node: any) => ({
        id: node.id || '',
        name: node.name || '',
        type: node.type || '',
        position: node.position || [0, 0],
        parameters: node.parameters || {}
      })),
      connections: workflow.connections || {},
      settings: workflow.settings || {},
      tags: workflow.tags || [],
      versionId: workflow.versionId
    };

    // Cache the workflow details with longer TTL
    workflowCache.set(cacheKey, result, 600000); // 10 minutes

    return result;
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionSummary> {
    const context: LogContext = { operation: 'getExecutionStatus', executionId };
    
    // For completed executions, check cache
    const cacheKey = `execution:${executionId}`;
    const cached = executionCache.get(cacheKey) as ExecutionSummary | undefined;
    if (cached && ['success', 'error'].includes(cached.status)) {
      metrics.incrementCounter('cache_hits_total', 1, { cache: 'executions', operation: 'get' });
      logger.debug('Execution status retrieved from cache', { ...context, cacheKey });
      return cached;
    }
    
    if (!cached) {
      metrics.incrementCounter('cache_misses_total', 1, { cache: 'executions', operation: 'get' });
    }
    
    logger.debug('Getting execution status', context);

    const response = await this.makeRequest<any>(
      'GET',
      `/executions/${executionId}`,
      undefined,
      {},
      context
    );

    const execution = response.data?.data || response.data;
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const startedAt = execution.startedAt || new Date().toISOString();
    const stoppedAt = execution.stoppedAt;
    const duration = stoppedAt ? new Date(stoppedAt).getTime() - new Date(startedAt).getTime() : undefined;

    const status = execution.finished ? (execution.data?.resultData?.error ? 'error' : 'success') : 'running';
    
    const result: ExecutionSummary = {
      id: execution.id || executionId,
      workflowId: execution.workflowId || '',
      status: status as 'running' | 'success' | 'error' | 'waiting',
      startedAt,
      stoppedAt,
      duration,
      mode: execution.mode || 'manual',
      errorMessage: execution.data?.resultData?.error?.message
    };

    // Cache completed executions for longer, running ones for shorter time
    const ttl = ['success', 'error'].includes(result.status) ? 1800000 : 30000; // 30 min vs 30 sec
    executionCache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * List executions with filtering
   */
  async listExecutions(filters: {
    workflowId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ExecutionSummary[]> {
    const context: LogContext = { operation: 'listExecutions', workflowId: filters.workflowId };
    
    // Validate pagination
    const paginationValidation = validator.validatePagination(filters.limit, filters.offset);
    if (!paginationValidation.isValid) {
      throw new Error(`Invalid pagination: ${paginationValidation.errors.join(', ')}`);
    }

    logger.debug('Listing executions', { ...context, filters });

    const params: Record<string, any> = {};
    if (filters.workflowId) params.workflowId = filters.workflowId;
    if (filters.status) params.status = filters.status;
    if (paginationValidation.sanitizedData?.limit) params.limit = Math.min(paginationValidation.sanitizedData.limit, 100);
    if (paginationValidation.sanitizedData?.offset) params.offset = paginationValidation.sanitizedData.offset;

    const response = await this.makeRequest<any>(
      'GET',
      '/executions',
      undefined,
      { params },
      context
    );

    const executions = response.data?.data || response.data || [];
    
    return executions.map((execution: any) => {
      const startedAt = execution.startedAt || new Date().toISOString();
      const stoppedAt = execution.stoppedAt;
      const duration = stoppedAt ? new Date(stoppedAt).getTime() - new Date(startedAt).getTime() : undefined;

      return {
        id: execution.id || '',
        workflowId: execution.workflowId || '',
        status: execution.finished ? (execution.data?.resultData?.error ? 'error' : 'success') : 'running',
        startedAt,
        stoppedAt,
        duration,
        mode: execution.mode || 'manual',
        errorMessage: execution.data?.resultData?.error?.message
      };
    });
  }

  /**
   * Activate or deactivate workflow
   */
  async activateWorkflow(workflowId: string, active: boolean): Promise<{ success: boolean; message: string }> {
    const context: LogContext = { operation: 'activateWorkflow', workflowId };
    
    // Validate workflow ID
    const validation = validator.validateWorkflowId(workflowId);
    if (!validation.isValid) {
      throw new Error(`Invalid workflow ID: ${validation.errors.join(', ')}`);
    }

    logger.info(`${active ? 'Activating' : 'Deactivating'} workflow`, context);

    await this.makeRequest<any>(
      'PATCH',
      `/workflows/${validation.sanitizedData}`,
      { active },
      {},
      context
    );

    const message = `Workflow ${active ? 'activated' : 'deactivated'} successfully`;
    logger.info(message, context);

    return { success: true, message };
  }

  /**
   * Create webhook for workflow
   */
  async createWebhook(workflowId: string, config: any = {}): Promise<{ webhookUrl: string; webhookId: string }> {
    const context: LogContext = { operation: 'createWebhook', workflowId };
    
    // Validate inputs
    const workflowValidation = validator.validateWorkflowId(workflowId);
    if (!workflowValidation.isValid) {
      throw new Error(`Invalid workflow ID: ${workflowValidation.errors.join(', ')}`);
    }

    const webhookValidation = validator.validateWebhookConfig(config);
    if (!webhookValidation.isValid) {
      throw new Error(`Invalid webhook config: ${webhookValidation.errors.join(', ')}`);
    }

    logger.info('Creating webhook', context);

    const response = await this.makeRequest<any>(
      'POST',
      `/workflows/${workflowValidation.sanitizedData}/webhooks`,
      webhookValidation.sanitizedData,
      {},
      context
    );

    const webhook = response.data;
    const webhookUrl = `${this.config.baseUrl}/webhook/${webhook.path || webhook.id}`;
    
    logger.info('Webhook created successfully', { ...context, webhookUrl });

    return {
      webhookUrl,
      webhookId: webhook.id || webhook.path
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const response = await this.makeRequest<any>('GET', '/health', undefined, { timeout: 5000 });
      return {
        status: 'healthy',
        details: response
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance (lazy initialization)
let n8nClientInstance: N8nClient | null = null;

export const n8nClient = {
  getInstance(): N8nClient {
    if (!n8nClientInstance) {
      n8nClientInstance = new N8nClient();
    }
    return n8nClientInstance;
  },
  
  // Proxy methods for convenience
  executeWorkflow: (workflowId: string, data?: any) => n8nClient.getInstance().executeWorkflow(workflowId, data),
  listWorkflows: (filters?: any) => n8nClient.getInstance().listWorkflows(filters),
  getWorkflow: (workflowId: string) => n8nClient.getInstance().getWorkflow(workflowId),
  getExecutionStatus: (executionId: string) => n8nClient.getInstance().getExecutionStatus(executionId),
  listExecutions: (filters?: any) => n8nClient.getInstance().listExecutions(filters),
  activateWorkflow: (workflowId: string, active: boolean) => n8nClient.getInstance().activateWorkflow(workflowId, active),
  createWebhook: (workflowId: string, config?: any) => n8nClient.getInstance().createWebhook(workflowId, config),
  healthCheck: () => n8nClient.getInstance().healthCheck()
};

// Class already exported at the top of the file