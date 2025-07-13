/**
 * Modular Tool Handlers for N8N MCP Server
 * Implements best practices with validation, logging, and error handling
 */

import { n8nClient } from '../clients/n8n-client.js';
import { logger, LogContext } from '../utils/logger.js';
import { validator } from '../utils/validator.js';

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    timestamp: string;
    version: string;
  };
}

export interface ExecuteWorkflowArgs {
  workflowId: string;
  data?: any;
  waitForCompletion?: boolean;
}

export interface ListWorkflowsArgs {
  active?: boolean;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface GetWorkflowArgs {
  workflowId: string;
}

export interface GetExecutionStatusArgs {
  executionId: string;
}

export interface ListExecutionsArgs {
  workflowId?: string;
  status?: 'running' | 'success' | 'error' | 'waiting';
  limit?: number;
  offset?: number;
}

export interface ActivateWorkflowArgs {
  workflowId: string;
  active: boolean;
}

export interface CreateWebhookArgs {
  workflowId: string;
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

/**
 * Base class for tool handlers with common functionality
 */
abstract class BaseToolHandler {
  protected createResult(data: any, executionTime: number): ToolResult {
    return {
      success: true,
      data,
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
        version: '1.1.1'
      }
    };
  }

  protected createErrorResult(error: string | Error, executionTime: number): ToolResult {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      error: errorMessage,
      metadata: {
        executionTime,
        timestamp: new Date().toISOString(),
        version: '1.1.1'
      }
    };
  }

  protected async executeWithTiming<T>(
    operation: () => Promise<T>,
    context: LogContext
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const executionTime = Date.now() - startTime;
      
      logger.debug('Tool operation completed successfully', {
        ...context,
        executionTime
      });
      
      return { result, executionTime };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Tool operation failed', {
        ...context,
        executionTime,
        error: error.message
      });
      
      throw error;
    }
  }
}

/**
 * Execute Workflow Tool Handler
 * Executes a workflow with optional data and wait configuration
 */
export class ExecuteWorkflowHandler extends BaseToolHandler {
  /**
   * Execute a workflow by ID or name
   * @param args - Execution arguments
   * @returns Tool result with execution details
   */
  async handle(args: ExecuteWorkflowArgs): Promise<ToolResult> {
    const context: LogContext = {
      tool: 'execute_workflow',
      workflowId: args.workflowId,
      operation: 'execute'
    };

    logger.info('Executing workflow', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate arguments
        const workflowValidation = validator.validateWorkflowId(args.workflowId);
        if (!workflowValidation.isValid) {
          throw new Error(`Invalid workflow ID: ${workflowValidation.errors.join(', ')}`);
        }

        const dataValidation = validator.validateExecutionData(args.data);
        if (!dataValidation.isValid) {
          throw new Error(`Invalid execution data: ${dataValidation.errors.join(', ')}`);
        }

        // Execute workflow
        const execution = await n8nClient.getInstance().executeWorkflow(
          workflowValidation.sanitizedData!,
          dataValidation.sanitizedData,
          args.waitForCompletion ?? true
        );

        return {
          executionId: execution.executionId,
          status: execution.status || 'started',
          message: execution.status === 'success' 
            ? 'Workflow executed successfully'
            : execution.status === 'error'
            ? 'Workflow execution failed'
            : 'Workflow execution started',
          data: execution.data,
          waitedForCompletion: args.waitForCompletion ?? true
        };
      }, context);

      logger.info('Workflow execution completed', {
        ...context,
        executionId: result.executionId,
        status: result.status
      });

      return this.createResult(result, executionTime);
    } catch (error: any) {
      return this.createErrorResult(error, Date.now());
    }
  }
}

/**
 * List Workflows Tool Handler
 * Lists workflows with optional filtering
 */
export class ListWorkflowsHandler extends BaseToolHandler {
  /**
   * List all available workflows with optional filters
   * @param args - Filtering arguments
   * @returns Tool result with workflow list
   */
  async handle(args: ListWorkflowsArgs = {}): Promise<ToolResult> {
    const context: LogContext = {
      tool: 'list_workflows',
      operation: 'list'
    };

    logger.info('Listing workflows', { ...context, filters: args });

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate pagination
        const paginationValidation = validator.validatePagination(args.limit, args.offset);
        if (!paginationValidation.isValid) {
          throw new Error(`Invalid pagination: ${paginationValidation.errors.join(', ')}`);
        }

        // Get workflows
        const workflows = await n8nClient.getInstance().listWorkflows({
          active: args.active,
          tags: args.tags,
          limit: paginationValidation.sanitizedData?.limit,
          offset: paginationValidation.sanitizedData?.offset
        });

        return {
          workflows,
          count: workflows.length,
          filters: {
            active: args.active,
            tags: args.tags,
            limit: paginationValidation.sanitizedData?.limit || 50,
            offset: paginationValidation.sanitizedData?.offset || 0
          },
          summary: `Found ${workflows.length} workflow(s)${args.active !== undefined ? ` (active: ${args.active})` : ''}`
        };
      }, context);

      logger.info('Workflows listed successfully', {
        ...context,
        count: result.count
      });

      return this.createResult(result, executionTime);
    } catch (error: any) {
      return this.createErrorResult(error, Date.now());
    }
  }
}

/**
 * Get Workflow Tool Handler
 * Retrieves detailed information about a specific workflow
 */
export class GetWorkflowHandler extends BaseToolHandler {
  /**
   * Get detailed information about a specific workflow
   * @param args - Workflow identification arguments
   * @returns Tool result with workflow details
   */
  async handle(args: GetWorkflowArgs): Promise<ToolResult> {
    const context: LogContext = {
      tool: 'get_workflow',
      workflowId: args.workflowId,
      operation: 'get'
    };

    logger.info('Getting workflow details', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate workflow ID
        const validation = validator.validateWorkflowId(args.workflowId);
        if (!validation.isValid) {
          throw new Error(`Invalid workflow ID: ${validation.errors.join(', ')}`);
        }

        // Get workflow details
        const workflow = await n8nClient.getInstance().getWorkflow(validation.sanitizedData!);

        return {
          workflow,
          summary: {
            id: workflow.id,
            name: workflow.name,
            active: workflow.active,
            nodeCount: workflow.nodes.length,
            hasConnections: Object.keys(workflow.connections).length > 0,
            lastUpdated: workflow.updatedAt,
            tags: workflow.tags
          },
          message: `Workflow '${workflow.name}' retrieved successfully`
        };
      }, context);

      logger.info('Workflow details retrieved', {
        ...context,
        workflowName: result.workflow.name,
        nodeCount: result.workflow.nodes.length
      });

      return this.createResult(result, executionTime);
    } catch (error: any) {
      return this.createErrorResult(error, Date.now());
    }
  }
}

/**
 * Get Execution Status Tool Handler
 * Retrieves the status and details of a workflow execution
 */
export class GetExecutionStatusHandler extends BaseToolHandler {
  /**
   * Get the status and details of a workflow execution
   * @param args - Execution identification arguments
   * @returns Tool result with execution status
   */
  async handle(args: GetExecutionStatusArgs): Promise<ToolResult> {
    const context: LogContext = {
      tool: 'get_execution_status',
      executionId: args.executionId,
      operation: 'get_status'
    };

    logger.info('Getting execution status', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate execution ID
        if (!args.executionId || typeof args.executionId !== 'string' || args.executionId.trim().length === 0) {
          throw new Error('Execution ID is required and must be a non-empty string');
        }

        // Get execution status
        const execution = await n8nClient.getInstance().getExecutionStatus(args.executionId.trim());

        return {
          execution,
          summary: {
            id: execution.id,
            workflowId: execution.workflowId,
            status: execution.status,
            duration: execution.duration,
            isCompleted: ['success', 'error'].includes(execution.status),
            hasError: execution.status === 'error'
          },
          message: `Execution ${execution.status}${execution.duration ? ` (${execution.duration}ms)` : ''}`
        };
      }, context);

      logger.info('Execution status retrieved', {
        ...context,
        status: result.execution.status,
        duration: result.execution.duration
      });

      return this.createResult(result, executionTime);
    } catch (error: any) {
      return this.createErrorResult(error, Date.now());
    }
  }
}

/**
 * List Executions Tool Handler
 * Lists recent workflow executions with optional filtering
 */
export class ListExecutionsHandler extends BaseToolHandler {
  /**
   * List recent workflow executions
   * @param args - Filtering arguments
   * @returns Tool result with execution list
   */
  async handle(args: ListExecutionsArgs = {}): Promise<ToolResult> {
    const context: LogContext = {
      tool: 'list_executions',
      workflowId: args.workflowId,
      operation: 'list'
    };

    logger.info('Listing executions', { ...context, filters: args });

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate pagination
        const paginationValidation = validator.validatePagination(args.limit, args.offset);
        if (!paginationValidation.isValid) {
          throw new Error(`Invalid pagination: ${paginationValidation.errors.join(', ')}`);
        }

        // Validate workflow ID if provided
        if (args.workflowId) {
          const workflowValidation = validator.validateWorkflowId(args.workflowId);
          if (!workflowValidation.isValid) {
            throw new Error(`Invalid workflow ID: ${workflowValidation.errors.join(', ')}`);
          }
        }

        // Get executions
        const executions = await n8nClient.getInstance().listExecutions({
          workflowId: args.workflowId,
          status: args.status,
          limit: paginationValidation.sanitizedData?.limit,
          offset: paginationValidation.sanitizedData?.offset
        });

        // Calculate statistics
        const stats = {
          total: executions.length,
          byStatus: executions.reduce((acc, exec) => {
            acc[exec.status] = (acc[exec.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          avgDuration: executions
            .filter(e => e.duration)
            .reduce((sum, e, _, arr) => sum + (e.duration! / arr.length), 0)
        };

        return {
          executions,
          statistics: stats,
          filters: {
            workflowId: args.workflowId,
            status: args.status,
            limit: paginationValidation.sanitizedData?.limit || 10,
            offset: paginationValidation.sanitizedData?.offset || 0
          },
          summary: `Found ${executions.length} execution(s)${args.workflowId ? ` for workflow ${args.workflowId}` : ''}${args.status ? ` with status ${args.status}` : ''}`
        };
      }, context);

      logger.info('Executions listed successfully', {
        ...context,
        count: result.executions.length,
        statistics: result.statistics
      });

      return this.createResult(result, executionTime);
    } catch (error: any) {
      return this.createErrorResult(error, Date.now());
    }
  }
}

/**
 * Activate Workflow Tool Handler
 * Activates or deactivates a workflow
 */
export class ActivateWorkflowHandler extends BaseToolHandler {
  /**
   * Activate or deactivate a workflow
   * @param args - Activation arguments
   * @returns Tool result with activation status
   */
  async handle(args: ActivateWorkflowArgs): Promise<ToolResult> {
    const context: LogContext = {
      tool: 'activate_workflow',
      workflowId: args.workflowId,
      operation: args.active ? 'activate' : 'deactivate'
    };

    logger.info(`${args.active ? 'Activating' : 'Deactivating'} workflow`, context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate workflow ID
        const validation = validator.validateWorkflowId(args.workflowId);
        if (!validation.isValid) {
          throw new Error(`Invalid workflow ID: ${validation.errors.join(', ')}`);
        }

        // Validate active flag
        if (typeof args.active !== 'boolean') {
          throw new Error('Active flag must be a boolean value');
        }

        // Activate/deactivate workflow
        const response = await n8nClient.getInstance().activateWorkflow(validation.sanitizedData!, args.active);

        return {
          workflowId: args.workflowId,
          active: args.active,
          success: response.success,
          message: response.message,
          action: args.active ? 'activated' : 'deactivated'
        };
      }, context);

      logger.info(`Workflow ${result.action} successfully`, {
        ...context,
        success: result.success
      });

      return this.createResult(result, executionTime);
    } catch (error: any) {
      return this.createErrorResult(error, Date.now());
    }
  }
}

/**
 * Create Webhook Tool Handler
 * Creates a webhook URL for a workflow
 */
export class CreateWebhookHandler extends BaseToolHandler {
  /**
   * Create a webhook URL for a workflow
   * @param args - Webhook creation arguments
   * @returns Tool result with webhook details
   */
  async handle(args: CreateWebhookArgs): Promise<ToolResult> {
    const context: LogContext = {
      tool: 'create_webhook',
      workflowId: args.workflowId,
      operation: 'create_webhook'
    };

    logger.info('Creating webhook', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate workflow ID
        const workflowValidation = validator.validateWorkflowId(args.workflowId);
        if (!workflowValidation.isValid) {
          throw new Error(`Invalid workflow ID: ${workflowValidation.errors.join(', ')}`);
        }

        // Prepare webhook config
        const webhookConfig: any = {};
        if (args.path) {
          webhookConfig.path = args.path;
        }
        if (args.method) {
          webhookConfig.method = args.method;
        }

        // Validate webhook config
        const configValidation = validator.validateWebhookConfig(webhookConfig);
        if (!configValidation.isValid) {
          throw new Error(`Invalid webhook config: ${configValidation.errors.join(', ')}`);
        }

        // Create webhook
        const webhook = await n8nClient.getInstance().createWebhook(
          workflowValidation.sanitizedData!,
          configValidation.sanitizedData
        );

        return {
          workflowId: args.workflowId,
          webhookUrl: webhook.webhookUrl,
          webhookId: webhook.webhookId,
          method: args.method || 'POST',
          path: args.path,
          message: 'Webhook created successfully',
          usage: {
            curl: `curl -X ${args.method || 'POST'} "${webhook.webhookUrl}" -H "Content-Type: application/json" -d '{"key": "value"}'`,
            description: 'Use this URL to trigger the workflow via HTTP requests'
          }
        };
      }, context);

      logger.info('Webhook created successfully', {
        ...context,
        webhookUrl: result.webhookUrl,
        webhookId: result.webhookId
      });

      return this.createResult(result, executionTime);
    } catch (error: any) {
      return this.createErrorResult(error, Date.now());
    }
  }
}

// Export handler instances
export const toolHandlers = {
  executeWorkflow: new ExecuteWorkflowHandler(),
  listWorkflows: new ListWorkflowsHandler(),
  getWorkflow: new GetWorkflowHandler(),
  getExecutionStatus: new GetExecutionStatusHandler(),
  listExecutions: new ListExecutionsHandler(),
  activateWorkflow: new ActivateWorkflowHandler(),
  createWebhook: new CreateWebhookHandler()
};