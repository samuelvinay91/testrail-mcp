/**
 * MCP (Model Context Protocol) specific types for TestRail MCP Server
 */

import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// MCP Tool Schemas
export interface TestRailMCPTool extends Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// Common MCP Response Structure
export interface TestRailMCPResponse extends CallToolResult {
  content: Array<{
    type: 'text';
    text: string;
  } | {
    type: 'image';
    data: string;
    mimeType: string;
  } | {
    type: 'resource';
    resource: {
      uri: string;
      text: string;
    } | {
      uri: string;
      blob: string;
    };
  }>;
  isError?: boolean;
}

// Tool Input Types
export interface ConnectTestRailInput {
  baseUrl: string;
  username: string;
  apiKey: string;
  timeout?: number;
}

export interface GetProjectsInput {
  isCompleted?: boolean;
}

export interface GetProjectInput {
  projectId: number;
}

export interface CreateProjectInput {
  name: string;
  announcement?: string;
  showAnnouncement?: boolean;
  suiteMode?: number;
}

export interface GetSuitesInput {
  projectId: number;
}

export interface CreateSuiteInput {
  projectId: number;
  name: string;
  description?: string;
}

export interface GetSectionsInput {
  projectId: number;
  suiteId?: number;
}

export interface CreateSectionInput {
  projectId: number;
  name: string;
  description?: string;
  suiteId?: number;
  parentId?: number;
}

export interface GetCasesInput {
  projectId: number;
  suiteId?: number;
  sectionId?: number;
  limit?: number;
  offset?: number;
  filter?: {
    priority_id?: number[];
    type_id?: number[];
    created_by?: number[];
    milestone_id?: number[];
    template_id?: number[];
  };
}

export interface CreateCaseInput {
  sectionId: number;
  title: string;
  templateId?: number;
  typeId?: number;
  priorityId?: number;
  milestoneId?: number;
  refs?: string;
  estimate?: string;
  preconditions?: string;
  steps?: string;
  expectedResult?: string;
  stepsDetailed?: Array<{
    content: string;
    expected: string;
  }>;
  customFields?: Record<string, any>;
}

export interface UpdateCaseInput {
  caseId: number;
  title?: string;
  templateId?: number;
  typeId?: number;
  priorityId?: number;
  milestoneId?: number;
  refs?: string;
  estimate?: string;
  preconditions?: string;
  steps?: string;
  expectedResult?: string;
  stepsDetailed?: Array<{
    content: string;
    expected: string;
  }>;
  customFields?: Record<string, any>;
}

export interface DeleteCaseInput {
  caseId: number;
}

export interface GetRunsInput {
  projectId: number;
  suiteId?: number;
  limit?: number;
  offset?: number;
  isCompleted?: boolean;
  milestoneId?: number;
}

export interface CreateRunInput {
  projectId: number;
  name: string;
  description?: string;
  suiteId?: number;
  milestoneId?: number;
  assignedToId?: number;
  includeAll?: boolean;
  caseIds?: number[];
  configIds?: number[];
}

export interface UpdateRunInput {
  runId: number;
  name?: string;
  description?: string;
  milestoneId?: number;
  assignedToId?: number;
}

export interface CloseRunInput {
  runId: number;
}

export interface DeleteRunInput {
  runId: number;
}

export interface GetTestsInput {
  runId: number;
  statusId?: number;
  limit?: number;
  offset?: number;
}

export interface AddResultInput {
  testId?: number;
  runId?: number;
  caseId?: number;
  statusId: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  assignedToId?: number;
  stepResults?: Array<{
    content: string;
    expected: string;
    actual: string;
    statusId: number;
  }>;
  customFields?: Record<string, any>;
}

export interface AddBulkResultsInput {
  runId: number;
  results: Array<{
    testId?: number;
    caseId?: number;
    statusId: number;
    comment?: string;
    version?: string;
    elapsed?: string;
    defects?: string;
    assignedToId?: number;
    stepResults?: Array<{
      content: string;
      expected: string;
      actual: string;
      statusId: number;
    }>;
    customFields?: Record<string, any>;
  }>;
}

export interface GetResultsInput {
  testId?: number;
  runId?: number;
  caseId?: number;
  limit?: number;
  offset?: number;
}

export interface GetPlansInput {
  projectId: number;
  isCompleted?: boolean;
  milestoneId?: number;
  limit?: number;
  offset?: number;
}

export interface CreatePlanInput {
  projectId: number;
  name: string;
  description?: string;
  milestoneId?: number;
  entries?: Array<{
    name: string;
    description?: string;
    suiteId: number;
    assignedToId?: number;
    includeAll?: boolean;
    caseIds?: number[];
    configIds?: number[];
  }>;
}

export interface UpdatePlanInput {
  planId: number;
  name?: string;
  description?: string;
  milestoneId?: number;
}

export interface ClosePlanInput {
  planId: number;
}

export interface DeletePlanInput {
  planId: number;
}

export interface GetMilestonesInput {
  projectId: number;
  isCompleted?: boolean;
  isStarted?: boolean;
}

export interface CreateMilestoneInput {
  projectId: number;
  name: string;
  description?: string;
  dueOn?: string;
  parentId?: number;
  refs?: string;
}

export interface UpdateMilestoneInput {
  milestoneId: number;
  name?: string;
  description?: string;
  dueOn?: string;
  isCompleted?: boolean;
  isStarted?: boolean;
  refs?: string;
}

export interface DeleteMilestoneInput {
  milestoneId: number;
}

export interface GetUsersInput {
  projectId?: number;
}

export interface GetReportInput {
  projectId: number;
  suiteId?: number;
  runId?: number;
  planId?: number;
  milestoneId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  format?: 'summary' | 'detailed' | 'csv' | 'json';
}

export interface GenerateTestsFromAutomationInput {
  runId: number;
  automationResults: Array<{
    caseId?: number;
    testName: string;
    status: 'passed' | 'failed' | 'skipped' | 'blocked';
    duration?: string;
    errorMessage?: string;
    stackTrace?: string;
    screenshots?: string[];
    logs?: string[];
  }>;
  version?: string;
  assignedToId?: number;
}

export interface SyncWithCIInput {
  projectId: number;
  runName: string;
  suiteId?: number;
  ciProvider: 'jenkins' | 'github' | 'gitlab' | 'azure' | 'custom';
  buildNumber?: string;
  buildUrl?: string;
  branch?: string;
  commit?: string;
  testResults: Array<{
    testName: string;
    className?: string;
    status: 'passed' | 'failed' | 'skipped';
    duration?: number;
    errorMessage?: string;
    stackTrace?: string;
  }>;
}

export interface SearchInput {
  projectId: number;
  query: string;
  entityType?: 'cases' | 'runs' | 'results' | 'plans' | 'milestones';
  limit?: number;
  offset?: number;
}

// Test Plan Entry Management
export interface AddPlanEntryInput {
  planId: number;
  suiteId: number;
  name?: string;
  description?: string;
  assignedToId?: number;
  includeAll?: boolean;
  caseIds?: number[];
  configIds?: number[];
  runs?: Array<{
    includeAll?: boolean;
    caseIds?: number[];
    configIds?: number[];
    assignedToId?: number;
  }>;
}

export interface UpdatePlanEntryInput {
  planId: number;
  entryId: string;
  name?: string;
  description?: string;
  assignedToId?: number;
  includeAll?: boolean;
  caseIds?: number[];
}

export interface DeletePlanEntryInput {
  planId: number;
  entryId: string;
}

export interface GetPlanEntriesInput {
  planId: number;
}

export interface ClosePlanEntryInput {
  planId: number;
  entryId: string;
}

export interface ReopenPlanInput {
  planId: number;
}

// Extended Milestone Management
export interface GetMilestoneInput {
  milestoneId: number;
}

export interface GetMilestoneDependenciesInput {
  milestoneId: number;
}

export interface UpdateMilestoneDependenciesInput {
  milestoneId: number;
  dependencies: number[];
}

// Templates & Configurations
export interface GetTemplatesInput {
  projectId: number;
}

export interface GetConfigurationsInput {
  projectId: number;
}

export interface GetConfigGroupsInput {
  projectId: number;
}

// Project Administration
export interface UpdateProjectInput {
  projectId: number;
  name?: string;
  announcement?: string;
  showAnnouncement?: boolean;
  suiteMode?: number;
  isCompleted?: boolean;
}

export interface DeleteProjectInput {
  projectId: number;
}

export interface GetProjectPermissionsInput {
  projectId: number;
  userId?: number;
}

export interface UpdateProjectPermissionsInput {
  projectId: number;
  userId: number;
  permissions: Record<string, boolean>;
}

// Enhanced Reporting
export interface ExportCasesInput {
  projectId: number;
  suiteId?: number;
  sectionId?: number;
  format: 'csv' | 'xml' | 'excel';
  filter?: {
    priority_id?: number[];
    type_id?: number[];
    created_by?: number[];
    milestone_id?: number[];
  };
}

export interface ExportRunsInput {
  projectId: number;
  runId?: number;
  format: 'csv' | 'xml' | 'excel' | 'pdf';
  includeResults?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface GetReportsInput {
  projectId: number;
  type: 'summary' | 'progress' | 'activity' | 'comparison';
  suiteId?: number;
  runId?: number;
  planId?: number;
  milestoneId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Attachments
export interface AddAttachmentInput {
  entityType: 'case' | 'result' | 'plan' | 'run' | 'test';
  entityId: number;
  filePath: string;
  fileName?: string;
}

export interface GetAttachmentsInput {
  entityType: 'case' | 'result' | 'plan' | 'run' | 'test';
  entityId: number;
}

export interface DeleteAttachmentInput {
  attachmentId: number;
}

// User Management
export interface CreateUserInput {
  name: string;
  email: string;
  roleId?: number;
  isActive?: boolean;
}

export interface UpdateUserInput {
  userId: number;
  name?: string;
  email?: string;
  roleId?: number;
  isActive?: boolean;
}

// Tool Response Types
export interface TestConnectionResponse {
  connected: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  version?: string;
  error?: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface EntityResponse<T> {
  entity: T;
  success: boolean;
  message?: string;
}

export interface BulkResponse {
  processed: number;
  succeeded: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

export interface ReportResponse {
  format: string;
  data: any;
  generatedAt: string;
  filters?: Record<string, any>;
}

// Error Types
export interface TestRailMCPError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Common Error Codes
export enum TestRailErrorCodes {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  API_ERROR = 'API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

// Validation Schema Types
export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
}

export interface ValidationSchema {
  rules: ValidationRule[];
}

// Configuration Types
export interface MCPServerConfig {
  port?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    redis?: {
      url: string;
    };
  };
  webhook?: {
    enabled: boolean;
    port: number;
    secret: string;
  };
}