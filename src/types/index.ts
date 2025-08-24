/**
 * TestRail MCP Server - Type Definitions Index
 * 
 * This file exports all type definitions used throughout the TestRail MCP Server.
 */

// Export TestRail API types
export * from './testrail';

// Export MCP specific types
export * from './mcp';

// Re-export commonly used types for convenience
export type {
  TestRailConfig,
  TestRailProject,
  TestRailSuite,
  TestRailCase,
  TestRailRun,
  TestRailTest,
  TestRailResult,
  TestRailPlan,
  TestRailMilestone,
  TestRailUser,
  TestRailStatus,
  TestRailPriority,
  TestRailType,
  TestRailTemplate,
  TestRailSection,
  CreateTestRailCase,
  CreateTestRailRun,
  CreateTestRailResult,
  CreateTestRailPlan,
  TestRailSearchOptions,
  TestRailFilter,
  TestRailStats,
  TestRailError
} from './testrail';

export type {
  TestRailMCPTool,
  TestRailMCPResponse,
  TestRailMCPError,
  ConnectTestRailInput,
  CreateCaseInput,
  CreateRunInput,
  AddResultInput,
  GetReportInput,
  TestConnectionResponse,
  ListResponse,
  EntityResponse,
  BulkResponse,
  ReportResponse,
  MCPServerConfig
} from './mcp';

// Export constants
export {
  TestRailStatusIds,
  TestRailPriorityIds,
  TestRailCaseTypeIds,
  TestRailSuiteModes
} from './testrail';

export {
  TestRailErrorCodes
} from './mcp';