/**
 * Advanced TypeScript interfaces for complete N8N workflow management
 * Based on audit requirements for full automation capabilities
 */

// ===== CORE TYPES =====
export interface Node {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, any>;
  credentials?: Record<string, string>;
  disabled?: boolean;
  notes?: string;
  color?: string;
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  onError?: 'stopWorkflow' | 'continueRegularOutput' | 'continueErrorOutput';
}

export interface Connection {
  sourceNodeId: string;
  sourceOutputIndex: number;
  targetNodeId: string;
  targetInputIndex: number;
  type?: 'main' | 'ai';
}

export interface NodeConnection {
  node: string;
  type: 'main' | 'ai';
  index: number;
}

export interface WorkflowConnections {
  [sourceNodeName: string]: {
    main?: NodeConnection[][];
    ai?: NodeConnection[][];
  };
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  nodesAccess?: Array<{
    nodeType: string;
    user: string;
  }>;
  sharedWith?: Array<{
    user: string;
    role: string;
  }>;
}

// ===== WORKFLOW MANAGEMENT =====
export interface WorkflowTemplate {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  nodes: Node[];
  connections: WorkflowConnections;
  settings?: WorkflowSettings;
  pinData?: Record<string, any>;
  versionId?: string;
}

export interface WorkflowSettings {
  executionOrder: 'v0' | 'v1';
  saveManualExecutions?: boolean;
  callerPolicy?: 'workflowsFromSameOwner' | 'workflowsFromAList' | 'any';
  callerIds?: string[];
  errorWorkflow?: string;
  timezone?: string;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  saveExecutionProgress?: boolean;
  executionTimeout?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'new' | 'running' | 'success' | 'error' | 'canceled' | 'crashed' | 'waiting';
  mode: 'manual' | 'trigger' | 'webhook' | 'internal' | 'cli' | 'error' | 'integrated';
  startedAt: string;
  stoppedAt?: string;
  finished: boolean;
  data?: {
    resultData?: {
      runData?: Record<string, any>;
      pinData?: Record<string, any>;
      lastNodeExecuted?: string;
      error?: {
        message: string;
        node?: {
          name: string;
          type: string;
        };
        stack?: string;
      };
    };
    executionData?: {
      contextData?: Record<string, any>;
      nodeExecutionStack?: any[];
      metadata?: Record<string, any>;
      waitingExecution?: Record<string, any>;
    };
  };
  workflowData?: {
    id: string;
    name: string;
    active: boolean;
    nodes: Node[];
    connections: WorkflowConnections;
    settings: WorkflowSettings;
  };
  retryOf?: string;
  retrySuccessId?: string;
}

// ===== TOOL INTERFACES =====
export interface CreateNodeArgs {
  workflowId: string;
  node: Omit<Node, 'id'>;
  position?: [number, number];
  autoConnect?: boolean;
  targetNodeId?: string;
}

export interface UpdateNodeArgs {
  workflowId: string;
  nodeId: string;
  updates: Partial<Node>;
}

export interface DeleteNodeArgs {
  workflowId: string;
  nodeId: string;
  cascadeDelete?: boolean;
}

export interface CreateConnectionArgs {
  workflowId: string;
  connection: Connection;
}

export interface DeleteConnectionArgs {
  workflowId: string;
  sourceNodeId: string;
  sourceOutputIndex: number;
  targetNodeId: string;
  targetInputIndex: number;
}

export interface UpdateWorkflowArgs {
  workflowId: string;
  updates: {
    name?: string;
    active?: boolean;
    nodes?: Node[];
    connections?: WorkflowConnections;
    settings?: Partial<WorkflowSettings>;
    tags?: string[];
    pinData?: Record<string, any>;
  };
}

export interface CreateWorkflowArgs {
  name: string;
  description?: string;
  tags?: string[];
  active?: boolean;
  settings?: Partial<WorkflowSettings>;
  fromTemplate?: string;
  nodes?: Node[];
  connections?: WorkflowConnections;
}

export interface CloneWorkflowArgs {
  sourceWorkflowId: string;
  newName: string;
  active?: boolean;
  modifications?: {
    nodeUpdates?: Record<string, Partial<Node>>;
    settingUpdates?: Partial<WorkflowSettings>;
  };
}

export interface ImportWorkflowArgs {
  workflowData: WorkflowTemplate;
  name?: string;
  active?: boolean;
  credentialMapping?: Record<string, string>;
}

export interface ExportWorkflowArgs {
  workflowId: string;
  includeCredentials?: boolean;
  format?: 'json' | 'yaml';
}

// ===== CREDENTIAL MANAGEMENT =====
export interface CreateCredentialArgs {
  name: string;
  type: string;
  data: Record<string, any>;
  nodesAccess?: Array<{
    nodeType: string;
    user: string;
  }>;
}

export interface UpdateCredentialArgs {
  credentialId: string;
  updates: {
    name?: string;
    data?: Record<string, any>;
    nodesAccess?: Array<{
      nodeType: string;
      user: string;
    }>;
  };
}

export interface TestCredentialArgs {
  credentialId: string;
  nodeType: string;
  nodeParameters?: Record<string, any>;
}

// ===== ADVANCED EXECUTION =====
export interface AdvancedExecuteArgs {
  workflowId: string;
  options: {
    data?: Record<string, any>;
    runData?: Record<string, any>;
    pinData?: Record<string, any>;
    startNodes?: string[];
    destinationNode?: string;
    runOnlyForItems?: number[];
    loadedWorkflowData?: WorkflowTemplate;
    loadedRunData?: Record<string, any>;
  };
  mode?: 'manual' | 'trigger' | 'webhook' | 'internal';
  waitForCompletion?: boolean;
  timeout?: number;
}

export interface BulkOperationArgs {
  workflowIds: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'export' | 'duplicate';
  options?: Record<string, any>;
}

// ===== MONITORING & ANALYTICS =====
export interface ExecutionFilters {
  workflowId?: string;
  status?: string[];
  mode?: string[];
  startedAfter?: string;
  startedBefore?: string;
  tags?: string[];
  includeData?: boolean;
  limit?: number;
  offset?: number;
}

export interface WorkflowAnalytics {
  workflowId: string;
  period: 'day' | 'week' | 'month' | 'year';
  metrics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    errorRate: number;
    mostFailedNodes: Array<{
      nodeId: string;
      nodeName: string;
      failureCount: number;
    }>;
    executionTrends: Array<{
      date: string;
      executions: number;
      success: number;
      errors: number;
    }>;
  };
}

// ===== VALIDATION & UTILITIES =====
export interface WorkflowValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  nodeValidations: Record<string, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

export interface NodeTypeInfo {
  name: string;
  displayName: string;
  description: string;
  group: string[];
  version: number;
  defaults: Record<string, any>;
  inputs: string[];
  outputs: string[];
  properties: Array<{
    displayName: string;
    name: string;
    type: string;
    required?: boolean;
    default?: any;
    description?: string;
    options?: any[];
  }>;
  credentials?: Array<{
    name: string;
    required?: boolean;
    displayOptions?: Record<string, any>;
  }>;
  requestDefaults?: Record<string, any>;
  supportsCORS?: boolean;
  maxNodes?: number;
}

// ===== RESPONSE TYPES =====
export interface AdvancedToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata: {
    operation: string;
    executionTime: number;
    timestamp: string;
    version: string;
    affectedResources?: string[];
    performance?: {
      operationsPerSecond?: number;
      memoryUsage?: number;
      processingTime?: number;
    };
  };
}

// ===== WEBHOOK & TRIGGERS =====
export interface AdvancedWebhookArgs {
  workflowId: string;
  config: {
    path?: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    isFullPath?: boolean;
    responseMode?: 'onReceived' | 'lastNode' | 'responseNode';
    responseData?: 'allEntries' | 'firstEntryJson' | 'firstEntryBinary';
    authentication?: 'none' | 'basicAuth' | 'headerAuth' | 'queryAuth';
    authenticationOptions?: Record<string, any>;
    options?: {
      noResponseBody?: boolean;
      ignoreBots?: boolean;
      allowedOrigins?: string;
    };
  };
}

export interface TriggerInfo {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  isActive: boolean;
  configuration: Record<string, any>;
  lastExecution?: string;
  nextExecution?: string;
  status: 'active' | 'inactive' | 'error';
}

// ===== ENVIRONMENT & VARIABLES =====
export interface EnvironmentVariable {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isSecret?: boolean;
}

export interface WorkflowEnvironment {
  workflowId: string;
  variables: EnvironmentVariable[];
  globalVariables?: EnvironmentVariable[];
}

// ===== BACKUP & RECOVERY =====
export interface BackupArgs {
  includeWorkflows?: boolean;
  includeCredentials?: boolean;
  includeSettings?: boolean;
  includeExecutions?: boolean;
  workflowIds?: string[];
  format?: 'json' | 'zip';
}

export interface RestoreArgs {
  backupData: any;
  options: {
    overwriteExisting?: boolean;
    mergeCredentials?: boolean;
    activateWorkflows?: boolean;
    credentialMapping?: Record<string, string>;
  };
}