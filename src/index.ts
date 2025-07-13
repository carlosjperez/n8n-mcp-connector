#!/usr/bin/env node

/**
 * N8N MCP Server
 * Model Context Protocol server for n8n workflow automation
 */

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

interface N8nConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: string;
  stoppedAt?: string;
  data?: any;
}

class N8nMCPServer {
  private server: Server;
  private n8nClient: AxiosInstance;
  private config: N8nConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'n8n-automation-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = this.loadConfig();
    this.n8nClient = this.createN8nClient();
    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private loadConfig(): N8nConfig {
    const config: N8nConfig = {
      baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
      apiKey: process.env.N8N_API_KEY,
      username: process.env.N8N_USERNAME,
      password: process.env.N8N_PASSWORD,
    };

    if (!config.apiKey && (!config.username || !config.password)) {
      throw new Error('N8N authentication required: Set N8N_API_KEY or N8N_USERNAME/N8N_PASSWORD');
    }

    return config;
  }

  private createN8nClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
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

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'execute_workflow',
            description: 'Execute an n8n workflow by ID or name',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID or name to execute',
                },
                data: {
                  type: 'object',
                  description: 'Input data for the workflow (optional)',
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
            description: 'List all available workflows',
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
              },
            },
          },
          {
            name: 'get_workflow',
            description: 'Get detailed information about a specific workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                },
              },
              required: ['workflowId'],
            },
          },
          {
            name: 'get_execution_status',
            description: 'Get the status and details of a workflow execution',
            inputSchema: {
              type: 'object',
              properties: {
                executionId: {
                  type: 'string',
                  description: 'The execution ID',
                },
              },
              required: ['executionId'],
            },
          },
          {
            name: 'list_executions',
            description: 'List recent workflow executions',
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
                  maximum: 100,
                },
              },
            },
          },
          {
            name: 'activate_workflow',
            description: 'Activate or deactivate a workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
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
            description: 'Create a webhook URL for a workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: {
                  type: 'string',
                  description: 'The workflow ID',
                },
                path: {
                  type: 'string',
                  description: 'Custom webhook path (optional)',
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
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_workflow':
            return await this.executeWorkflow(args);
          case 'list_workflows':
            return await this.listWorkflows(args);
          case 'get_workflow':
            return await this.getWorkflow(args);
          case 'get_execution_status':
            return await this.getExecutionStatus(args);
          case 'list_executions':
            return await this.listExecutions(args);
          case 'activate_workflow':
            return await this.activateWorkflow(args);
          case 'create_webhook':
            return await this.createWebhook(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        // Enhanced error handling with more context
        const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
        const statusCode = error?.response?.status;
        const errorDetails = {
          tool: name,
          error: errorMessage,
          statusCode,
          timestamp: new Date().toISOString()
        };
        
        // Log error for debugging
        console.error(`[N8N MCP] Error in ${name}:`, errorDetails);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: true,
                message: `Error executing ${name}: ${errorMessage}`,
                details: errorDetails
              }, null, 2),
            },
          ],
          isError: true
        };
      }
    });
  }

  private async executeWorkflow(args: any) {
    const { workflowId, data = {}, waitForCompletion = true } = args;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    // Start workflow execution
    const response = await this.n8nClient.post(`/api/v1/workflows/${workflowId}/execute`, {
      data,
    });

    const executionId = response.data.data.executionId;

    if (!waitForCompletion) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              executionId,
              workflowId,
              status: 'started',
              message: 'Workflow execution started (not waiting for completion)'
            }, null, 2),
          },
        ],
      };
    }

    // Wait for completion
    let execution: WorkflowExecution;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    do {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      const execResponse = await this.n8nClient.get(`/api/v1/executions/${executionId}`);
      execution = execResponse.data.data;
      attempts++;
    } while (execution.status === 'running' && attempts < maxAttempts);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            executionId,
            workflowId,
            status: execution.status,
            result: execution.data,
            duration: execution.stoppedAt 
              ? new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()
              : null,
            timedOut: attempts >= maxAttempts && execution.status === 'running'
          }, null, 2),
        },
      ],
    };
  }

  private async listWorkflows(args: any) {
    const { active, tags } = args;
    let url = '/api/v1/workflows';
    const params = new URLSearchParams();

    // Fix: Use proper query parameters instead of filter JSON
    if (typeof active === 'boolean') {
      params.append('active', active.toString());
    }

    if (tags && tags.length > 0) {
      params.append('tags', tags.join(','));
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.n8nClient.get(url);
    const workflows = response.data.data;
    
    // Return concise summary instead of full workflow data
    const summary = workflows.map((w: any) => ({
      id: w.id,
      name: w.name,
      active: w.active,
      isArchived: w.isArchived || false,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
      nodeCount: w.nodes?.length || 0
    }));
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total: workflows.length,
            workflows: summary
          }, null, 2),
        },
      ],
    };
  }

  private async getWorkflow(args: any) {
    const { workflowId } = args;
    const response = await this.n8nClient.get(`/api/v1/workflows/${workflowId}`);
    const workflow = response.data.data;
    
    // Return structured summary instead of raw data
    const summary = {
      id: workflow.id,
      name: workflow.name,
      active: workflow.active,
      isArchived: workflow.isArchived || false,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      nodeCount: workflow.nodes?.length || 0,
      connectionCount: workflow.connections ? Object.keys(workflow.connections).length : 0,
      tags: workflow.tags || [],
      nodes: workflow.nodes?.map((node: any) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        typeVersion: node.typeVersion
      })) || []
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async getExecutionStatus(args: any) {
    const { executionId } = args;
    const response = await this.n8nClient.get(`/api/v1/executions/${executionId}`);
    const execution = response.data.data;
    
    const duration = execution.stoppedAt && execution.startedAt 
      ? new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()
      : null;
    
    const summary = {
      id: execution.id,
      workflowId: execution.workflowId,
      status: execution.finished ? (execution.stoppedAt ? 'success' : 'error') : 'running',
      startedAt: execution.startedAt,
      stoppedAt: execution.stoppedAt,
      duration: duration ? `${duration}ms` : null,
      mode: execution.mode,
      retryOf: execution.retryOf,
      waitTill: execution.waitTill
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async listExecutions(args: any) {
    const { workflowId, status, limit = 10 } = args;
    let url = `/api/v1/executions?limit=${Math.min(limit, 50)}`; // Cap at 50
    
    if (workflowId) {
      url += `&workflowId=${workflowId}`;
    }
    
    if (status) {
      url += `&status=${status}`;
    }

    const response = await this.n8nClient.get(url);
    const executions = response.data.data;
    
    // Return enhanced summary with duration and status
    const summary = executions.map((exec: any) => {
      const duration = exec.stoppedAt && exec.startedAt 
        ? new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()
        : null;
      
      return {
        id: exec.id,
        workflowId: exec.workflowId,
        status: exec.finished ? (exec.stoppedAt ? 'success' : 'error') : 'running',
        startedAt: exec.startedAt,
        stoppedAt: exec.stoppedAt,
        duration: duration ? `${duration}ms` : null,
        mode: exec.mode
      };
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            total: executions.length,
            executions: summary
          }, null, 2),
        },
      ],
    };
  }

  private async activateWorkflow(args: any) {
    const { workflowId, active } = args;
    
    if (!workflowId) {
      throw new Error('workflowId is required');
    }
    
    if (typeof active !== 'boolean') {
      throw new Error('active must be a boolean value');
    }
    
    const response = await this.n8nClient.patch(`/api/v1/workflows/${workflowId}`, {
      active,
    });
    
    const result = {
      workflowId: response.data.data.id,
      name: response.data.data.name,
      active: response.data.data.active,
      message: `Workflow ${active ? 'activated' : 'deactivated'} successfully`
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async createWebhook(args: any) {
    const { workflowId, path, method = 'POST' } = args;
    
    if (!workflowId) {
      throw new Error('workflowId is required');
    }
    
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(method.toUpperCase())) {
      throw new Error(`Invalid method. Must be one of: ${validMethods.join(', ')}`);
    }
    
    // Generate webhook URL based on n8n's webhook structure
    const webhookPath = path || `workflow-${workflowId}`;
    const webhookUrl = `${this.config.baseUrl}/webhook/${webhookPath}`;
    
    const result = {
      webhookUrl,
      method: method.toUpperCase(),
      workflowId,
      path: webhookPath,
      instructions: [
        '1. Add a Webhook node to your workflow',
        '2. Set the webhook path to: ' + webhookPath,
        '3. Configure the HTTP method to: ' + method.toUpperCase(),
        '4. Activate the workflow to enable the webhook'
      ],
      testCommand: `curl -X ${method.toUpperCase()} "${webhookUrl}" -H "Content-Type: application/json" -d '{}'`
    };
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('Server error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('N8N MCP Server running on stdio');
  }
}

// Start the server
const server = new N8nMCPServer();
server.start().catch(console.error);
