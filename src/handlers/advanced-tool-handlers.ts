/**
 * Advanced Tool Handlers for Complete N8N Workflow Management
 * Phase 1: Enhanced node management capabilities
 * Phase 2: Connection and workflow management  
 * Phase 3: Credential and validation tools
 * Phase 4: Advanced automation features
 */

import { n8nClient } from '../clients/n8n-client.js';
import { logger, LogContext } from '../utils/logger.js';
import { validator } from '../utils/validator.js';
import {
  AdvancedToolResult,
  CreateNodeArgs,
  UpdateNodeArgs,
  DeleteNodeArgs,
  CreateConnectionArgs,
  DeleteConnectionArgs,
  Node,
  Connection
} from '../types/advanced-types.js';

/**
 * Base class for advanced tool handlers
 */
abstract class AdvancedBaseToolHandler {
  protected createResult<T>(data: T, operation: string, executionTime: number, affectedResources?: string[]): AdvancedToolResult<T> {
    return {
      success: true,
      data,
      metadata: {
        operation,
        executionTime,
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        affectedResources
      }
    };
  }

  protected createErrorResult(error: string | Error, operation: string, executionTime: number): AdvancedToolResult {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      error: errorMessage,
      metadata: {
        operation,
        executionTime,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
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
      
      logger.debug('Advanced tool operation completed successfully', {
        ...context,
        executionTime
      });
      
      return { result, executionTime };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Advanced tool operation failed', {
        ...context,
        executionTime,
        error: error.message
      });
      
      throw error;
    }
  }
}

// ===== PHASE 1: NODE MANAGEMENT =====

/**
 * Create Node Handler - Add individual nodes to workflows
 */
export class CreateNodeHandler extends AdvancedBaseToolHandler {
  async handle(args: CreateNodeArgs): Promise<AdvancedToolResult<{ nodeId: string; workflow: any }>> {
    const context: LogContext = {
      tool: 'create_node',
      workflowId: args.workflowId,
      operation: 'create_node'
    };

    logger.info('Creating node in workflow', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Validate workflow ID
        const workflowValidation = validator.validateWorkflowId(args.workflowId);
        if (!workflowValidation.isValid) {
          throw new Error(`Invalid workflow ID: ${workflowValidation.errors.join(', ')}`);
        }

        // Get existing workflow
        const workflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        // Generate unique node ID
        const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create new node with proper structure
        const newNode: Node = {
          ...args.node,
          id: nodeId,
          name: args.node.name || `${args.node.type}_${nodeId.substr(-6)}`,
          type: args.node.type,
          typeVersion: args.node.typeVersion || 1,
          position: args.position || [Math.random() * 400, Math.random() * 400],
          parameters: args.node.parameters || {}
        };

        // Add node to workflow
        const updatedNodes = [...workflow.nodes as Node[], newNode];
        
        // Auto-connect if requested and target node exists
        const updatedConnections = workflow.connections;
        if (args.autoConnect && args.targetNodeId) {
          const targetNode = workflow.nodes.find(n => n.id === args.targetNodeId);
          if (targetNode) {
            if (!updatedConnections[args.targetNodeId]) {
              updatedConnections[args.targetNodeId] = {};
            }
            if (!updatedConnections[args.targetNodeId].main) {
              updatedConnections[args.targetNodeId].main = [];
            }
            updatedConnections[args.targetNodeId].main[0] = [{
              node: nodeId,
              type: 'main',
              index: 0
            }];
          }
        }

        // Update workflow via API
        await this.updateWorkflowNodes(args.workflowId, updatedNodes, updatedConnections);
        
        // Return updated workflow
        const updatedWorkflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        return {
          nodeId,
          workflow: updatedWorkflow
        };
      }, context);

      logger.info('Node created successfully', {
        ...context,
        nodeId: result.nodeId
      });

      return this.createResult(result, 'create_node', executionTime, [args.workflowId, result.nodeId]);
    } catch (error: any) {
      return this.createErrorResult(error, 'create_node', Date.now());
    }
  }

  private async updateWorkflowNodes(workflowId: string, nodes: Node[], connections: any): Promise<void> {
    // Use existing workflow update API - this is a simplified implementation
    // In real implementation, would use proper N8N API endpoints for node management
    const updatePayload = {
      nodes,
      connections
    };
    
    // Mock implementation - replace with actual N8N API call
    const client = (n8nClient.getInstance() as any).client;
    await client.request({
      method: 'PATCH',
      url: `/workflows/${workflowId}`,
      data: updatePayload
    });
  }
}

/**
 * Update Node Handler - Modify existing nodes
 */
export class UpdateNodeHandler extends AdvancedBaseToolHandler {
  async handle(args: UpdateNodeArgs): Promise<AdvancedToolResult<{ node: Node; workflow: any }>> {
    const context: LogContext = {
      tool: 'update_node',
      workflowId: args.workflowId,
      nodeId: args.nodeId,
      operation: 'update_node'
    };

    logger.info('Updating node in workflow', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Get existing workflow
        const workflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        // Find and update the node
        const nodeIndex = workflow.nodes.findIndex(n => n.id === args.nodeId);
        if (nodeIndex === -1) {
          throw new Error(`Node ${args.nodeId} not found in workflow ${args.workflowId}`);
        }

        const updatedNode: Node = {
          ...(workflow.nodes[nodeIndex] as Node),
          ...args.updates,
          typeVersion: (workflow.nodes[nodeIndex] as Node).typeVersion || 1
        };

        const updatedNodes = [...workflow.nodes as Node[]];
        updatedNodes[nodeIndex] = updatedNode;

        // Update workflow
        await this.updateWorkflowNodes(args.workflowId, updatedNodes, workflow.connections);
        
        // Return updated workflow
        const updatedWorkflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        return {
          node: updatedNode,
          workflow: updatedWorkflow
        };
      }, context);

      logger.info('Node updated successfully', context);

      return this.createResult(result, 'update_node', executionTime, [args.workflowId, args.nodeId]);
    } catch (error: any) {
      return this.createErrorResult(error, 'update_node', Date.now());
    }
  }

  private async updateWorkflowNodes(workflowId: string, nodes: Node[], connections: any): Promise<void> {
    const updatePayload = { nodes, connections };
    const client = (n8nClient.getInstance() as any).client;
    await client.request({
      method: 'PATCH',
      url: `/workflows/${workflowId}`,
      data: updatePayload
    });
  }
}

/**
 * Delete Node Handler - Remove nodes from workflows
 */
export class DeleteNodeHandler extends AdvancedBaseToolHandler {
  async handle(args: DeleteNodeArgs): Promise<AdvancedToolResult<{ deletedNodeId: string; workflow: any }>> {
    const context: LogContext = {
      tool: 'delete_node',
      workflowId: args.workflowId,
      nodeId: args.nodeId,
      operation: 'delete_node'
    };

    logger.info('Deleting node from workflow', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Get existing workflow
        const workflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        // Check if node exists
        const nodeExists = workflow.nodes.find(n => n.id === args.nodeId);
        if (!nodeExists) {
          throw new Error(`Node ${args.nodeId} not found in workflow ${args.workflowId}`);
        }

        // Remove the node
        const updatedNodes = (workflow.nodes as Node[]).filter(n => n.id !== args.nodeId);
        
        // Remove connections involving this node
        const updatedConnections = { ...workflow.connections };
        
        // Remove outgoing connections
        delete updatedConnections[args.nodeId];
        
        // Remove incoming connections
        for (const sourceNodeId of Object.keys(updatedConnections)) {
          if (updatedConnections[sourceNodeId].main) {
            updatedConnections[sourceNodeId].main = updatedConnections[sourceNodeId].main.map(
              (connections: any[]) => connections.filter(conn => conn.node !== args.nodeId)
            ).filter((connections: any[]) => connections.length > 0);
            
            if (updatedConnections[sourceNodeId].main.length === 0) {
              delete updatedConnections[sourceNodeId].main;
            }
          }
        }

        // Clean up empty connection objects
        Object.keys(updatedConnections).forEach(nodeId => {
          if (Object.keys(updatedConnections[nodeId]).length === 0) {
            delete updatedConnections[nodeId];
          }
        });

        // Update workflow
        await this.updateWorkflowNodes(args.workflowId, updatedNodes, updatedConnections);
        
        // Return updated workflow
        const updatedWorkflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        return {
          deletedNodeId: args.nodeId,
          workflow: updatedWorkflow
        };
      }, context);

      logger.info('Node deleted successfully', context);

      return this.createResult(result, 'delete_node', executionTime, [args.workflowId]);
    } catch (error: any) {
      return this.createErrorResult(error, 'delete_node', Date.now());
    }
  }

  private async updateWorkflowNodes(workflowId: string, nodes: Node[], connections: any): Promise<void> {
    const updatePayload = { nodes, connections };
    const client = (n8nClient.getInstance() as any).client;
    await client.request({
      method: 'PATCH',
      url: `/workflows/${workflowId}`,
      data: updatePayload
    });
  }
}

// ===== PHASE 2: CONNECTION MANAGEMENT =====

/**
 * Create Connection Handler - Connect nodes in workflows
 */
export class CreateConnectionHandler extends AdvancedBaseToolHandler {
  async handle(args: CreateConnectionArgs): Promise<AdvancedToolResult<{ connection: Connection; workflow: any }>> {
    const context: LogContext = {
      tool: 'create_connection',
      workflowId: args.workflowId,
      operation: 'create_connection'
    };

    logger.info('Creating connection in workflow', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Get existing workflow
        const workflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        // Validate nodes exist
        const sourceNode = workflow.nodes.find(n => n.id === args.connection.sourceNodeId);
        const targetNode = workflow.nodes.find(n => n.id === args.connection.targetNodeId);
        
        if (!sourceNode) {
          throw new Error(`Source node ${args.connection.sourceNodeId} not found`);
        }
        if (!targetNode) {
          throw new Error(`Target node ${args.connection.targetNodeId} not found`);
        }

        // Update connections
        const updatedConnections = { ...workflow.connections };
        
        if (!updatedConnections[args.connection.sourceNodeId]) {
          updatedConnections[args.connection.sourceNodeId] = {};
        }
        
        const connectionType = args.connection.type || 'main';
        if (!updatedConnections[args.connection.sourceNodeId][connectionType]) {
          updatedConnections[args.connection.sourceNodeId][connectionType] = [];
        }
        
        // Ensure output index array exists
        while (updatedConnections[args.connection.sourceNodeId][connectionType].length <= args.connection.sourceOutputIndex) {
          updatedConnections[args.connection.sourceNodeId][connectionType].push([]);
        }
        
        // Add the connection
        updatedConnections[args.connection.sourceNodeId][connectionType][args.connection.sourceOutputIndex].push({
          node: args.connection.targetNodeId,
          type: connectionType,
          index: args.connection.targetInputIndex
        });

        // Update workflow
        await this.updateWorkflowConnections(args.workflowId, workflow.nodes as Node[], updatedConnections);
        
        // Return updated workflow
        const updatedWorkflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        return {
          connection: args.connection,
          workflow: updatedWorkflow
        };
      }, context);

      logger.info('Connection created successfully', context);

      return this.createResult(result, 'create_connection', executionTime, [args.workflowId]);
    } catch (error: any) {
      return this.createErrorResult(error, 'create_connection', Date.now());
    }
  }

  private async updateWorkflowConnections(workflowId: string, nodes: Node[], connections: any): Promise<void> {
    const updatePayload = { nodes, connections };
    const client = (n8nClient.getInstance() as any).client;
    await client.request({
      method: 'PATCH',
      url: `/workflows/${workflowId}`,
      data: updatePayload
    });
  }
}

/**
 * Delete Connection Handler - Remove connections between nodes
 */
export class DeleteConnectionHandler extends AdvancedBaseToolHandler {
  async handle(args: DeleteConnectionArgs): Promise<AdvancedToolResult<{ deletedConnection: any; workflow: any }>> {
    const context: LogContext = {
      tool: 'delete_connection',
      workflowId: args.workflowId,
      operation: 'delete_connection'
    };

    logger.info('Deleting connection in workflow', context);

    try {
      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Get existing workflow
        const workflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        // Update connections - remove specific connection
        const updatedConnections = { ...workflow.connections };
        
        if (updatedConnections[args.sourceNodeId] && 
            updatedConnections[args.sourceNodeId].main &&
            updatedConnections[args.sourceNodeId].main[args.sourceOutputIndex]) {
          
          updatedConnections[args.sourceNodeId].main[args.sourceOutputIndex] = 
            updatedConnections[args.sourceNodeId].main[args.sourceOutputIndex].filter(
              (conn: any) => !(conn.node === args.targetNodeId && conn.index === args.targetInputIndex)
            );
          
          // Clean up empty arrays
          if (updatedConnections[args.sourceNodeId].main[args.sourceOutputIndex].length === 0) {
            updatedConnections[args.sourceNodeId].main[args.sourceOutputIndex] = [];
          }
        }

        // Update workflow
        await this.updateWorkflowConnections(args.workflowId, workflow.nodes as Node[], updatedConnections);
        
        // Return updated workflow
        const updatedWorkflow = await n8nClient.getInstance().getWorkflow(args.workflowId);
        
        return {
          deletedConnection: {
            sourceNodeId: args.sourceNodeId,
            sourceOutputIndex: args.sourceOutputIndex,
            targetNodeId: args.targetNodeId,
            targetInputIndex: args.targetInputIndex
          },
          workflow: updatedWorkflow
        };
      }, context);

      logger.info('Connection deleted successfully', context);

      return this.createResult(result, 'delete_connection', executionTime, [args.workflowId]);
    } catch (error: any) {
      return this.createErrorResult(error, 'delete_connection', Date.now());
    }
  }

  private async updateWorkflowConnections(workflowId: string, nodes: Node[], connections: any): Promise<void> {
    const updatePayload = { nodes, connections };
    const client = (n8nClient.getInstance() as any).client;
    await client.request({
      method: 'PATCH',
      url: `/workflows/${workflowId}`,
      data: updatePayload
    });
  }
}

// Export handler instances
export const advancedToolHandlers = {
  // Node management
  createNode: new CreateNodeHandler(),
  updateNode: new UpdateNodeHandler(),
  deleteNode: new DeleteNodeHandler(),
  
  // Connection management  
  createConnection: new CreateConnectionHandler(),
  deleteConnection: new DeleteConnectionHandler()
};