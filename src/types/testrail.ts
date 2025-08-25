/**
 * TestRail API Types and Interfaces
 * Comprehensive type definitions for TestRail API integration
 */

export interface TestRailConfig {
  baseUrl: string;
  username: string;
  apiKey: string;
  timeout?: number;
  defaultProjectId?: number;
  defaultSuiteId?: number;
}

export interface TestRailProject {
  id: number;
  name: string;
  announcement?: string;
  show_announcement?: boolean;
  is_completed: boolean;
  completed_on?: number;
  suite_mode: number;
  default_role_id?: number;
  url: string;
}

export interface TestRailSuite {
  id: number;
  name: string;
  description?: string;
  project_id: number;
  master_id?: number;
  is_master: boolean;
  is_baseline: boolean;
  is_completed: boolean;
  completed_on?: number;
  url: string;
}

export interface TestRailSection {
  id: number;
  name: string;
  description?: string;
  suite_id: number;
  parent_id?: number;
  display_order: number;
  depth: number;
}

export interface TestRailCase {
  id: number;
  title: string;
  section_id: number;
  template_id: number;
  type_id: number;
  priority_id: number;
  milestone_id?: number;
  refs?: string;
  created_by: number;
  created_on: number;
  updated_by: number;
  updated_on: number;
  estimate?: string;
  estimate_forecast?: string;
  suite_id: number;
  custom_preconds?: string;
  custom_steps?: string;
  custom_expected?: string;
  custom_steps_separated?: TestRailStep[];
  custom_mission?: string;
  custom_goals?: string;
  [key: string]: any; // For custom fields
}

export interface TestRailStep {
  content: string;
  expected: string;
  actual?: string;
  status_id?: number;
}

export interface TestRailRun {
  id: number;
  name: string;
  description?: string;
  milestone_id?: number;
  assignedto_id?: number;
  include_all: boolean;
  is_completed: boolean;
  completed_on?: number;
  config?: string;
  config_ids?: number[];
  passed_count: number;
  blocked_count: number;
  untested_count: number;
  retest_count: number;
  failed_count: number;
  custom_status1_count?: number;
  custom_status2_count?: number;
  custom_status3_count?: number;
  custom_status4_count?: number;
  custom_status5_count?: number;
  custom_status6_count?: number;
  custom_status7_count?: number;
  project_id: number;
  suite_id: number;
  created_on: number;
  created_by: number;
  url: string;
  plan_id?: number;
  entry_id?: string;
  entry_index?: number;
}

export interface TestRailTest {
  id: number;
  case_id: number;
  status_id: number;
  assignedto_id?: number;
  run_id: number;
  title: string;
  template_id: number;
  type_id: number;
  priority_id: number;
  milestone_id?: number;
  refs?: string;
  estimate?: string;
  estimate_forecast?: string;
  custom_expected?: string;
  custom_preconds?: string;
  custom_steps_separated?: TestRailStep[];
  [key: string]: any; // For custom fields
}

export interface TestRailResult {
  id: number;
  test_id: number;
  status_id: number;
  created_by: number;
  created_on: number;
  assignedto_id?: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  custom_step_results?: TestRailStepResult[];
  [key: string]: any; // For custom fields
}

export interface TestRailStepResult {
  content: string;
  expected: string;
  actual: string;
  status_id: number;
}

export interface TestRailPlan {
  id: number;
  name: string;
  description?: string;
  milestone_id?: number;
  assignedto_id?: number;
  is_completed: boolean;
  completed_on?: number;
  passed_count: number;
  blocked_count: number;
  untested_count: number;
  retest_count: number;
  failed_count: number;
  custom_status1_count?: number;
  custom_status2_count?: number;
  custom_status3_count?: number;
  custom_status4_count?: number;
  custom_status5_count?: number;
  custom_status6_count?: number;
  custom_status7_count?: number;
  project_id: number;
  created_on: number;
  created_by: number;
  url: string;
  entries: TestRailPlanEntry[];
}

export interface TestRailPlanEntry {
  id: string;
  name: string;
  description?: string;
  suite_id: number;
  assignedto_id?: number;
  include_all: boolean;
  case_ids?: number[];
  config_ids?: number[];
  runs: TestRailRun[];
}

export interface TestRailMilestone {
  id: number;
  name: string;
  description?: string;
  start_on?: number;
  started_on?: number;
  due_on?: number;
  completed_on?: number;
  is_completed: boolean;
  is_started: boolean;
  project_id: number;
  parent_id?: number;
  refs?: string;
  url: string;
}

export interface TestRailPriority {
  id: number;
  name: string;
  priority: number;
  short_name: string;
  is_default: boolean;
}

export interface TestRailStatus {
  id: number;
  name: string;
  label: string;
  color_dark: number;
  color_medium: number;
  color_bright: number;
  is_system: boolean;
  is_untested: boolean;
  is_final: boolean;
}

export interface TestRailUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  role_id: number;
  role: string;
}

export interface TestRailTemplate {
  id: number;
  name: string;
  is_default: boolean;
}

export interface TestRailType {
  id: number;
  name: string;
  is_default: boolean;
}

export interface TestRailConfiguration {
  id: number;
  name: string;
  project_id: number;
  configs: TestRailConfigGroup[];
}

export interface TestRailConfigGroup {
  id: number;
  name: string;
  options: TestRailConfigOption[];
}

export interface TestRailConfigOption {
  id: number;
  name: string;
  group_id: number;
}

// Request/Response types
export interface TestRailResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface TestRailPaginatedResponse<T> {
  data: T[];
  offset: number;
  limit: number;
  size: number;
  _links: {
    next?: string;
    prev?: string;
  };
}

// Input types for creating/updating entities
export interface CreateTestRailProject {
  name: string;
  announcement?: string;
  show_announcement?: boolean;
  suite_mode?: number;
}

export interface CreateTestRailSuite {
  name: string;
  description?: string;
}

export interface CreateTestRailSection {
  name: string;
  description?: string;
  suite_id?: number;
  parent_id?: number;
}

export interface CreateTestRailCase {
  title: string;
  section_id?: number;
  template_id?: number;
  type_id?: number;
  priority_id?: number;
  milestone_id?: number;
  refs?: string;
  estimate?: string;
  custom_preconds?: string;
  custom_steps?: string;
  custom_expected?: string;
  custom_steps_separated?: TestRailStep[];
  [key: string]: any; // For custom fields
}

export interface UpdateTestRailCase extends Partial<CreateTestRailCase> {
  id: number;
}

export interface CreateTestRailRun {
  name: string;
  description?: string;
  milestone_id?: number;
  assignedto_id?: number;
  include_all?: boolean;
  case_ids?: number[];
  config_ids?: number[];
}

export interface UpdateTestRailRun extends Partial<CreateTestRailRun> {
  id: number;
}

export interface CreateTestRailResult {
  status_id: number;
  comment?: string;
  version?: string;
  elapsed?: string;
  defects?: string;
  assignedto_id?: number;
  custom_step_results?: TestRailStepResult[];
  [key: string]: any; // For custom fields
}

export interface CreateTestRailPlan {
  name: string;
  description?: string;
  milestone_id?: number;
  entries?: CreateTestRailPlanEntry[];
}

export interface CreateTestRailPlanEntry {
  name: string;
  description?: string;
  suite_id: number;
  assignedto_id?: number;
  include_all?: boolean;
  case_ids?: number[];
  config_ids?: number[];
  runs?: CreateTestRailRun[];
}

export interface TestRailFilter {
  is_completed?: 0 | 1;
  milestone_id?: number[];
  created_after?: number;
  created_before?: number;
  created_by?: number[];
  suite_id?: number[];
  section_id?: number[];
  priority_id?: number[];
  type_id?: number[];
  template_id?: number[];
  [key: string]: any; // For custom field filters
}

export interface TestRailSearchOptions {
  offset?: number;
  limit?: number;
  filter?: TestRailFilter;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Bulk operation types
export interface BulkUpdateTestRailCases {
  case_ids: number[];
  updates: Partial<CreateTestRailCase>;
}

export interface BulkAddResultsToRun {
  run_id: number;
  results: Array<{
    test_id: number;
    status_id: number;
    comment?: string;
    version?: string;
    elapsed?: string;
    defects?: string;
    assignedto_id?: number;
    custom_step_results?: TestRailStepResult[];
    [key: string]: any;
  }>;
}

// Analytics and reporting types
export interface TestRailReportData {
  project_id: number;
  suite_id?: number;
  run_id?: number;
  plan_id?: number;
  milestone_id?: number;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface TestRailStats {
  total_tests: number;
  passed: number;
  failed: number;
  blocked: number;
  untested: number;
  retest: number;
  custom_statuses?: { [key: string]: number };
  pass_rate: number;
  completion_rate: number;
}

export interface TestRailTrendData {
  date: string;
  stats: TestRailStats;
}

export interface TestRailExecutionSummary {
  run_id: number;
  run_name: string;
  project_name: string;
  suite_name: string;
  stats: TestRailStats;
  start_date: string;
  end_date?: string;
  duration?: string;
  assigned_to?: string;
}

export interface TestRailCaseMetrics {
  case_id: number;
  title: string;
  execution_count: number;
  pass_count: number;
  fail_count: number;
  last_executed: string;
  avg_execution_time?: string;
  flakiness_score?: number;
}

// Error types
export interface TestRailError {
  error: string;
  code?: number;
  details?: any;
}

// Webhook types
export interface TestRailWebhookEvent {
  event: string;
  timestamp: number;
  data: any;
}

// MCP Tool Input/Output types
export interface TestRailMCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface TestRailConnectionTest {
  connected: boolean;
  user?: TestRailUser;
  api_version?: string;
  error?: string;
}

// Export all status IDs as constants
export const TestRailStatusIds = {
  PASSED: 1,
  BLOCKED: 2,
  UNTESTED: 3,
  RETEST: 4,
  FAILED: 5,
  CUSTOM_STATUS1: 6,
  CUSTOM_STATUS2: 7,
  CUSTOM_STATUS3: 8,
  CUSTOM_STATUS4: 9,
  CUSTOM_STATUS5: 10,
  CUSTOM_STATUS6: 11,
  CUSTOM_STATUS7: 12,
} as const;

export type TestRailStatusId = (typeof TestRailStatusIds)[keyof typeof TestRailStatusIds];

// Priority constants
export const TestRailPriorityIds = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

export type TestRailPriorityId = (typeof TestRailPriorityIds)[keyof typeof TestRailPriorityIds];

// Case type constants
export const TestRailCaseTypeIds = {
  ACCEPTANCE: 1,
  ACCESSIBILITY: 2,
  AUTOMATED: 3,
  COMPATIBILITY: 4,
  DESTRUCTIVE: 5,
  FUNCTIONAL: 6,
  OTHER: 7,
  PERFORMANCE: 8,
  REGRESSION: 9,
  SECURITY: 10,
  SMOKE_SANITY: 11,
  USABILITY: 12,
} as const;

export type TestRailCaseTypeId = (typeof TestRailCaseTypeIds)[keyof typeof TestRailCaseTypeIds];

// Suite mode constants
export const TestRailSuiteModes = {
  SINGLE_SUITE: 1,
  SINGLE_SUITE_BASELINES: 2,
  MULTIPLE_SUITES: 3,
} as const;

export type TestRailSuiteMode = (typeof TestRailSuiteModes)[keyof typeof TestRailSuiteModes];
