#!/usr/bin/env node

/**
 * N8N MCP Server
 * Model Context Protocol server for n8n workflow automation
 */

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
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async executeWorkflow(args: any) {
    const { workflowId, data = {}, waitForCompletion = true } = args;

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
            text: `Workflow execution started. Execution ID: ${executionId}`,
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
            status: execution.status,
            result: execution.data,
            duration: execution.stoppedAt 
              ? new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()
              : null,
          }, null, 2),
        },
      ],
    };
  }

  private async listWorkflows(args: any) {
    const { active, tags } = args;
    let url = '/api/v1/workflows';
    const params = new URLSearchParams();

    if (typeof active === 'boolean') {
      params.append('filter', JSON.stringify({ active }));
    }

    if (tags && tags.length > 0) {
      params.append('filter', JSON.stringify({ tags }));
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.n8nClient.get(url);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.data, null, 2),
        },
      ],
    };
  }

  private async getWorkflow(args: any) {
    const { workflowId } = args;
    const response = await this.n8nClient.get(`/api/v1/workflows/${workflowId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.data, null, 2),
        },
      ],
    };
  }

  private async getExecutionStatus(args: any) {
    const { executionId } = args;
    const response = await this.n8nClient.get(`/api/v1/executions/${executionId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.data, null, 2),
        },
      ],
    };
  }

  private async listExecutions(args: any) {
    const { workflowId, status, limit = 10 } = args;
    let url = `/api/v1/executions?limit=${limit}`;
    
    if (workflowId) {
      url += `&workflowId=${workflowId}`;
    }
    
    if (status) {
      url += `&status=${status}`;
    }

    const response = await this.n8nClient.get(url);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data.data, null, 2),
        },
      ],
    };
  }

  private async activateWorkflow(args: any) {
    const { workflowId, active } = args;
    
    const response = await this.n8nClient.patch(`/api/v1/workflows/${workflowId}`, {
      active,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Workflow ${workflowId} ${active ? 'activated' : 'deactivated'} successfully.`,
        },
      ],
    };
  }

  private async createWebhook(args: any) {
    const { workflowId, path, method = 'POST' } = args;
    
    // Note: This is a simplified implementation
    // In practice, you'd need to modify the workflow to add a webhook node
    const webhookUrl = `${this.config.baseUrl}/webhook/${path || workflowId}`;
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            webhookUrl,
            method,
            workflowId,
            note: 'Ensure your workflow has a Webhook node configured for this path',
          }, null, 2),
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
