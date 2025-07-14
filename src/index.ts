#!/usr/bin/env node

/**
 * N8N MCP Server - Advanced Automation Hub
 * Optimized with modular architecture, resilience, and best practices
 * Version: 1.1.1
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import modular components
import { appConfig, serverConfig, monitoringConfig } from './config/index.js';
import { logger, LogContext } from './utils/logger.js';
import { resilience } from './utils/resilience.js';
import { metrics, healthChecker, performanceMonitor } from './utils/metrics.js';
import { n8nClient } from './clients/n8n-client.js';
import { toolHandlers } from './handlers/tool-handlers.js';
import { advancedToolHandlers } from './handlers/advanced-tool-handlers.js';

// Initialize configuration and logging
logger.info('Starting N8N MCP Server', {
  version: '2.0.0',
  environment: serverConfig.environment,
  n8nUrl: appConfig.n8n.baseUrl,
  cacheEnabled: true,
  monitoringEnabled: monitoringConfig.enabled
});

/**
 * Advanced N8N MCP Server with Modular Architecture
 * Implements best practices for automation, resilience, and maintainability
 */
class N8nMcpServer {
  private server: Server;
  private startTime: number;
  private requestCounter = 0;
  private healthCheckInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.startTime = Date.now();
    
    // Initialize MCP Server with enhanced configuration
    this.server = new Server(
      {
        name: 'n8n-mcp-server',
        version: '2.0.0',
        description: 'Advanced N8N MCP Server with caching, metrics, and resilience'
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
    this.setupHealthChecks();
    this.setupMonitoring();
    
    logger.info('N8N MCP Server initialized successfully', {
      serverName: 'n8n-mcp-server',
      version: '2.0.0',
      capabilities: ['workflows', 'executions', 'webhooks', 'monitoring', 'caching', 'metrics']
    });
  }

  /**
   * Setup health monitoring and periodic checks
   */
  private setupHealthChecks(): void {
    // Health checks enabled by default in production
    if (serverConfig.environment === 'production') {
      this.healthCheckInterval = setInterval(async () => {
        try {
          const health = await n8nClient.getInstance().healthCheck();
          if (health.status === 'unhealthy') {
            logger.warn('N8N health check failed', { details: health.details });
          }
        } catch (error: any) {
          logger.error('Health check error', { error: error.message });
        }
      }, monitoringConfig.healthCheckInterval);
    }
  }

  /**
   * Setup monitoring and metrics collection
   */
  private setupMonitoring(): void {
    if (monitoringConfig.enabled) {
      // Start metrics collection
      setInterval(() => {
        const stats = metrics.getAllMetrics();
        logger.debug('Metrics collected', stats);
      }, monitoringConfig.metricsInterval);

      // Start performance monitoring
      performanceMonitor.start();
      
      logger.info('Monitoring and metrics enabled', {
        metricsInterval: monitoringConfig.metricsInterval,
        healthCheckInterval: monitoringConfig.healthCheckInterval,
        performanceThreshold: monitoringConfig.performanceThreshold
      });
    }
  }

  /**
   * Setup tool handlers with enhanced schemas and validation
   */
  private setupToolHandlers(): void {
    // List tools handler with comprehensive tool definitions
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const context: LogContext = { operation: 'list_tools' };
      logger.debug('Listing available tools', context);
      
      return {
        tools: [
          {
            name: 'execute_workflow',
            description: 'Execute an n8n workflow by ID or name with advanced options and monitoring',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID or name to execute',
                  minLength: 1
                },
                data: {
                  type: 'object',
                  description: 'Input data for the workflow (optional)',
                  additionalProperties: true
                },
                waitForCompletion: {
                  type: 'boolean',
                  description: 'Wait for workflow completion before returning',
                  default: true,
                },
              },
              required: ['workflowId'],
            },
          },
          {
            name: 'list_workflows',
            description: 'List all available workflows with filtering and pagination',
            inputSchema: {
              type: 'object',
              properties: {
                active: {
                  type: 'boolean',
                  description: 'Filter by active status (optional)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by tags (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of workflows to return',
                  default: 50,
                  minimum: 1,
                  maximum: 200
                },
                offset: {
                  type: 'number',
                  description: 'Number of workflows to skip',
                  default: 0,
                  minimum: 0
                }
              },
            },
          },
          {
            name: 'get_workflow',
            description: 'Get detailed information about a specific workflow including nodes and connections',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
              },
              required: ['workflowId'],
            },
          },
          {
            name: 'get_execution_status',
            description: 'Get the status and details of a workflow execution with performance metrics',
            inputSchema: {
              type: 'object',
              properties: {
                executionId: {
                  type: 'string',
                  description: 'The execution ID',
                  minLength: 1
                },
              },
              required: ['executionId'],
            },
          },
          {
            name: 'list_executions',
            description: 'List recent workflow executions with filtering, pagination, and statistics',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'Filter by specific workflow ID (optional)',
                },
                status: {
                  type: 'string',
                  enum: ['running', 'success', 'error', 'waiting'],
                  description: 'Filter by execution status (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of executions to return',
                  default: 10,
                  minimum: 1,
                  maximum: 100,
                },
                offset: {
                  type: 'number',
                  description: 'Number of executions to skip',
                  default: 0,
                  minimum: 0
                }
              },
            },
          },
          {
            name: 'activate_workflow',
            description: 'Activate or deactivate a workflow with validation and confirmation',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
                active: {
                  type: 'boolean',
                  description: 'Set workflow active status',
                },
              },
              required: ['workflowId', 'active'],
            },
          },
          {
            name: 'create_webhook',
            description: 'Create a webhook URL for a workflow with custom configuration',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
                path: {
                  type: 'string',
                  description: 'Custom webhook path (optional)',
                  pattern: '^[a-zA-Z0-9_-]+$'
                },
                method: {
                  type: 'string',
                  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                  description: 'HTTP method for the webhook',
                  default: 'POST',
                },
              },
              required: ['workflowId'],
            },
          },
          // === ADVANCED WORKFLOW MANAGEMENT TOOLS ===
          {
            name: 'create_node',
            description: 'Create a new node in a workflow with advanced configuration options',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
                node: {
                  type: 'object',
                  description: 'Node configuration',
                  properties: {
                    name: { type: 'string', description: 'Node name' },
                    type: { type: 'string', description: 'Node type (e.g., "n8n-nodes-base.httpRequest")' },
                    typeVersion: { type: 'number', description: 'Node type version', default: 1 },
                    parameters: { type: 'object', description: 'Node parameters', additionalProperties: true },
                    credentials: { type: 'object', description: 'Node credentials mapping', additionalProperties: true },
                    disabled: { type: 'boolean', description: 'Whether node is disabled', default: false }
                  },
                  required: ['name', 'type']
                },
                position: {
                  type: 'array',
                  description: 'Node position [x, y]',
                  items: { type: 'number' },
                  minItems: 2,
                  maxItems: 2
                },
                autoConnect: {
                  type: 'boolean',
                  description: 'Automatically connect to target node',
                  default: false
                },
                targetNodeId: {
                  type: 'string',
                  description: 'Target node ID for auto-connection'
                }
              },
              required: ['workflowId', 'node']
            }
          },
          {
            name: 'update_node',
            description: 'Update an existing node in a workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
                nodeId: {
                  type: 'string',
                  description: 'The node ID to update',
                  minLength: 1
                },
                updates: {
                  type: 'object',
                  description: 'Node updates to apply',
                  properties: {
                    name: { type: 'string', description: 'New node name' },
                    parameters: { type: 'object', description: 'Updated node parameters', additionalProperties: true },
                    credentials: { type: 'object', description: 'Updated credentials mapping', additionalProperties: true },
                    disabled: { type: 'boolean', description: 'Update disabled status' },
                    position: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 }
                  },
                  additionalProperties: true
                }
              },
              required: ['workflowId', 'nodeId', 'updates']
            }
          },
          {
            name: 'delete_node',
            description: 'Delete a node from a workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
                nodeId: {
                  type: 'string',
                  description: 'The node ID to delete',
                  minLength: 1
                },
                cascadeDelete: {
                  type: 'boolean',
                  description: 'Delete all connections to/from this node',
                  default: true
                }
              },
              required: ['workflowId', 'nodeId']
            }
          },
          {
            name: 'create_connection',
            description: 'Create a connection between two nodes in a workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
                connection: {
                  type: 'object',
                  description: 'Connection configuration',
                  properties: {
                    sourceNodeId: { type: 'string', description: 'Source node ID' },
                    sourceOutputIndex: { type: 'number', description: 'Source output index', default: 0 },
                    targetNodeId: { type: 'string', description: 'Target node ID' },
                    targetInputIndex: { type: 'number', description: 'Target input index', default: 0 },
                    type: { type: 'string', enum: ['main', 'ai'], description: 'Connection type', default: 'main' }
                  },
                  required: ['sourceNodeId', 'targetNodeId']
                }
              },
              required: ['workflowId', 'connection']
            }
          },
          {
            name: 'delete_connection',
            description: 'Delete a connection between two nodes in a workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                  minLength: 1
                },
                sourceNodeId: {
                  type: 'string',
                  description: 'Source node ID',
                  minLength: 1
                },
                sourceOutputIndex: {
                  type: 'number',
                  description: 'Source output index',
                  default: 0,
                  minimum: 0
                },
                targetNodeId: {
                  type: 'string',
                  description: 'Target node ID',
                  minLength: 1
                },
                targetInputIndex: {
                  type: 'number',
                  description: 'Target input index',
                  default: 0,
                  minimum: 0
                }
              },
              required: ['workflowId', 'sourceNodeId', 'targetNodeId']
            }
          }
        ],
      };
    });

    // Call tool handler with enhanced error handling and metrics
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const requestId = ++this.requestCounter;
      const startTime = Date.now();
      
      const context: LogContext = {
        tool: name,
        requestId,
        operation: 'tool_call'
      };

      logger.info('Tool call started', { ...context, args: this.sanitizeArgs(args) });

      try {
        let result;
        
        switch (name) {
          case 'execute_workflow':
            result = await toolHandlers.executeWorkflow.handle(args as any);
            break;
          case 'list_workflows':
            result = await toolHandlers.listWorkflows.handle(args || {});
            break;
          case 'get_workflow':
            result = await toolHandlers.getWorkflow.handle(args as any);
            break;
          case 'get_execution_status':
            result = await toolHandlers.getExecutionStatus.handle(args as any);
            break;
          case 'list_executions':
            result = await toolHandlers.listExecutions.handle(args || {});
            break;
          case 'activate_workflow':
            result = await toolHandlers.activateWorkflow.handle(args as any);
            break;
          case 'create_webhook':
            result = await toolHandlers.createWebhook.handle(args as any);
            break;
          // Advanced workflow management tools
          case 'create_node':
            result = await advancedToolHandlers.createNode.handle(args as any);
            break;
          case 'update_node':
            result = await advancedToolHandlers.updateNode.handle(args as any);
            break;
          case 'delete_node':
            result = await advancedToolHandlers.deleteNode.handle(args as any);
            break;
          case 'create_connection':
            result = await advancedToolHandlers.createConnection.handle(args as any);
            break;
          case 'delete_connection':
            result = await advancedToolHandlers.deleteConnection.handle(args as any);
            break;
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}. Available tools: execute_workflow, list_workflows, get_workflow, get_execution_status, list_executions, activate_workflow, create_webhook, create_node, update_node, delete_node, create_connection, delete_connection`
            );
        }

        const executionTime = Date.now() - startTime;
        
        logger.info('Tool call completed successfully', {
          ...context,
          executionTime,
          success: result.success
        });

        // Return standardized response
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
        
      } catch (error: any) {
        const executionTime = Date.now() - startTime;
        
        logger.error('Tool call failed', {
          ...context,
          executionTime,
          error: error.message,
          stack: error.stack
        });

        if (error instanceof McpError) {
          throw error;
        }
        
        // Enhanced error response with context
        throw new McpError(
          ErrorCode.InternalError,
          `Tool '${name}' execution failed: ${error.message}`,
          {
            tool: name,
            requestId,
            executionTime,
            timestamp: new Date().toISOString()
          }
        );
      }
    });
  }



  /**
   * Sanitize arguments for logging (remove sensitive data)
   */
  private sanitizeArgs(args: any): any {
    if (!args || typeof args !== 'object') return args;
    
    const sanitized = { ...args };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Setup enhanced error handling with logging and graceful shutdown
   */
  private setupErrorHandling(): void {
    // MCP Server error handler
    this.server.onerror = (error) => {
      logger.error('MCP Server error', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    };

    // Process error handlers
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', {
        error: error.message,
        stack: error.stack
      });
      this.gracefulShutdown(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', {
        reason: String(reason),
        promise: String(promise)
      });
    });

    // Graceful shutdown handlers
    process.on('SIGINT', () => this.gracefulShutdown(0));
    process.on('SIGTERM', () => this.gracefulShutdown(0));
  }

  /**
   * Perform graceful shutdown with cleanup
   */
  private async gracefulShutdown(exitCode: number): Promise<void> {
    logger.info('Initiating graceful shutdown', {
      exitCode,
      uptime: Date.now() - this.startTime,
      requestsProcessed: this.requestCounter
    });

    try {
      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      // Close MCP server
      await this.server.close();
      
      logger.info('Graceful shutdown completed');
    } catch (error: any) {
      logger.error('Error during shutdown', { error: error.message });
    } finally {
      process.exit(exitCode);
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info('N8N MCP Server started successfully', {
        transport: 'stdio',
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      });
      
      // Log server capabilities
      logger.info('Server capabilities initialized', {
        tools: ['execute_workflow', 'list_workflows', 'get_workflow', 'get_execution_status', 'list_executions', 'activate_workflow', 'create_webhook'],
        features: ['resilience', 'validation', 'logging', 'health_checks', 'metrics']
      });
      
    } catch (error: any) {
      logger.error('Failed to start N8N MCP Server', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }
}

/**
 * Initialize and start the N8N MCP Server
 */
async function main(): Promise<void> {
  try {
    logger.info('Initializing N8N MCP Server', {
      version: '2.0.0',
      timestamp: new Date().toISOString()
    });

    const server = new N8nMcpServer();
    await server.start();
    
  } catch (error: any) {
    logger.error('Failed to initialize N8N MCP Server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for testing and external use
export { N8nMcpServer };
export default N8nMcpServer;
// Test error - invalid syntax for testing automation
