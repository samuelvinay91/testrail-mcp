import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
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
  TestRailConfiguration,
  CreateTestRailCase,
  CreateTestRailRun,
  CreateTestRailResult,
  CreateTestRailPlan,
  TestRailSearchOptions,
  TestRailError,
  TestRailConnectionTest,
} from '../types';

/**
 * TestRail Service Class
 * Provides comprehensive access to TestRail API functionality
 */
export class TestRailService {
  private client: AxiosInstance;
  private config: TestRailConfig;
  private isConnected = false;

  constructor(config: TestRailConfig) {
    this.config = config;

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: `${config.baseUrl}/index.php?/api/v2`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestRail-MCP-Server/1.0.0',
      },
      auth: {
        username: config.username,
        password: config.apiKey,
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔗 TestRail API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ TestRail API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ TestRail API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ TestRail API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Handle API errors and convert to standardized format
   */
  private handleApiError(error: any): TestRailError {
    if (error.response) {
      return {
        error: error.response.data?.error || error.response.statusText || 'Unknown API error',
        code: error.response.status,
        details: error.response.data,
      };
    } else if (error.request) {
      return {
        error: 'Network error - unable to reach TestRail server',
        details: error.message,
      };
    } else {
      return {
        error: error.message || 'Unknown error',
        details: error,
      };
    }
  }

  /**
   * Generic GET request method
   */
  private async get<T>(endpoint: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(endpoint, { params });
    return response.data;
  }

  /**
   * Generic POST request method
   */
  private async post<T>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, data);
    return response.data;
  }

  // ============================================================================
  // CONNECTION & AUTHENTICATION
  // ============================================================================

  /**
   * Test the connection to TestRail and validate credentials
   */
  async testConnection(): Promise<TestRailConnectionTest> {
    try {
      const user = await this.getUserByEmail(this.config.username);
      const apiInfo = await this.getApiInfo();

      this.isConnected = true;
      return {
        connected: true,
        user,
        api_version: apiInfo?.version || 'unknown',
      };
    } catch (error) {
      this.isConnected = false;
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Check if service is connected
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }

  // ============================================================================
  // PROJECT METHODS
  // ============================================================================

  /**
   * Get all projects
   */
  async getProjects(options?: { is_completed?: 0 | 1 }): Promise<TestRailProject[]> {
    return this.get<TestRailProject[]>('/get_projects', options);
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: number): Promise<TestRailProject> {
    return this.get<TestRailProject>(`/get_project/${projectId}`);
  }

  /**
   * Add a new project
   */
  async addProject(data: {
    name: string;
    announcement?: string;
    show_announcement?: boolean;
    suite_mode?: number;
  }): Promise<TestRailProject> {
    return this.post<TestRailProject>('/add_project', data);
  }

  /**
   * Update an existing project
   */
  async updateProject(
    projectId: number,
    data: {
      name?: string;
      announcement?: string;
      show_announcement?: boolean;
      suite_mode?: number;
      is_completed?: boolean;
    }
  ): Promise<TestRailProject> {
    return this.post<TestRailProject>(`/update_project/${projectId}`, data);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: number): Promise<void> {
    return this.post<void>(`/delete_project/${projectId}`, {});
  }

  // ============================================================================
  // SUITE METHODS
  // ============================================================================

  /**
   * Get all suites for a project
   */
  async getSuites(projectId: number): Promise<TestRailSuite[]> {
    return this.get<TestRailSuite[]>(`/get_suites/${projectId}`);
  }

  /**
   * Get a specific suite by ID
   */
  async getSuite(suiteId: number): Promise<TestRailSuite> {
    return this.get<TestRailSuite>(`/get_suite/${suiteId}`);
  }

  /**
   * Add a new suite
   */
  async addSuite(
    projectId: number,
    data: {
      name: string;
      description?: string;
    }
  ): Promise<TestRailSuite> {
    return this.post<TestRailSuite>(`/add_suite/${projectId}`, data);
  }

  /**
   * Update a suite
   */
  async updateSuite(
    suiteId: number,
    data: {
      name?: string;
      description?: string;
    }
  ): Promise<TestRailSuite> {
    return this.post<TestRailSuite>(`/update_suite/${suiteId}`, data);
  }

  /**
   * Delete a suite
   */
  async deleteSuite(suiteId: number): Promise<void> {
    return this.post<void>(`/delete_suite/${suiteId}`, {});
  }

  // ============================================================================
  // SECTION METHODS
  // ============================================================================

  /**
   * Get all sections for a project/suite
   */
  async getSections(projectId: number, suiteId?: number): Promise<TestRailSection[]> {
    const endpoint = suiteId
      ? `/get_sections/${projectId}&suite_id=${suiteId}`
      : `/get_sections/${projectId}`;
    return this.get<TestRailSection[]>(endpoint);
  }

  /**
   * Get a specific section by ID
   */
  async getSection(sectionId: number): Promise<TestRailSection> {
    return this.get<TestRailSection>(`/get_section/${sectionId}`);
  }

  /**
   * Add a new section
   */
  async addSection(
    projectId: number,
    data: {
      name: string;
      description?: string;
      suite_id?: number;
      parent_id?: number;
    }
  ): Promise<TestRailSection> {
    return this.post<TestRailSection>(`/add_section/${projectId}`, data);
  }

  /**
   * Update a section
   */
  async updateSection(
    sectionId: number,
    data: {
      name?: string;
      description?: string;
    }
  ): Promise<TestRailSection> {
    return this.post<TestRailSection>(`/update_section/${sectionId}`, data);
  }

  /**
   * Delete a section
   */
  async deleteSection(sectionId: number): Promise<void> {
    return this.post<void>(`/delete_section/${sectionId}`, {});
  }

  // ============================================================================
  // TEST CASE METHODS
  // ============================================================================

  /**
   * Get all test cases for a project/suite
   */
  async getCases(
    projectId: number,
    suiteId?: number,
    options?: TestRailSearchOptions
  ): Promise<TestRailCase[]> {
    const endpoint = suiteId
      ? `/get_cases/${projectId}&suite_id=${suiteId}`
      : `/get_cases/${projectId}`;

    const params = {
      ...options?.filter,
      offset: options?.offset,
      limit: options?.limit,
    };

    return this.get<TestRailCase[]>(endpoint, params);
  }

  /**
   * Get a specific test case by ID
   */
  async getCase(caseId: number): Promise<TestRailCase> {
    return this.get<TestRailCase>(`/get_case/${caseId}`);
  }

  /**
   * Add a new test case
   */
  async addCase(sectionId: number, data: CreateTestRailCase): Promise<TestRailCase> {
    return this.post<TestRailCase>(`/add_case/${sectionId}`, data);
  }

  /**
   * Update a test case
   */
  async updateCase(caseId: number, data: Partial<CreateTestRailCase>): Promise<TestRailCase> {
    return this.post<TestRailCase>(`/update_case/${caseId}`, data);
  }

  /**
   * Delete a test case
   */
  async deleteCase(caseId: number): Promise<void> {
    return this.post<void>(`/delete_case/${caseId}`, {});
  }

  /**
   * Copy test cases between sections
   */
  async copyCases(fromSectionId: number, toSectionId: number, caseIds?: number[]): Promise<void> {
    const data = caseIds ? { case_ids: caseIds } : {};
    return this.post<void>(`/copy_cases_to_section/${toSectionId}`, {
      ...data,
      section_id: fromSectionId,
    });
  }

  // ============================================================================
  // TEST RUN METHODS
  // ============================================================================

  /**
   * Get all test runs for a project
   */
  async getRuns(projectId: number, options?: TestRailSearchOptions): Promise<TestRailRun[]> {
    const params = {
      ...options?.filter,
      offset: options?.offset,
      limit: options?.limit,
    };

    return this.get<TestRailRun[]>(`/get_runs/${projectId}`, params);
  }

  /**
   * Get a specific test run by ID
   */
  async getRun(runId: number): Promise<TestRailRun> {
    return this.get<TestRailRun>(`/get_run/${runId}`);
  }

  /**
   * Add a new test run
   */
  async addRun(projectId: number, data: CreateTestRailRun): Promise<TestRailRun> {
    return this.post<TestRailRun>(`/add_run/${projectId}`, data);
  }

  /**
   * Update a test run
   */
  async updateRun(runId: number, data: Partial<CreateTestRailRun>): Promise<TestRailRun> {
    return this.post<TestRailRun>(`/update_run/${runId}`, data);
  }

  /**
   * Close a test run
   */
  async closeRun(runId: number): Promise<TestRailRun> {
    return this.post<TestRailRun>(`/close_run/${runId}`, {});
  }

  /**
   * Delete a test run
   */
  async deleteRun(runId: number): Promise<void> {
    return this.post<void>(`/delete_run/${runId}`, {});
  }

  // ============================================================================
  // TEST METHODS
  // ============================================================================

  /**
   * Get all tests for a test run
   */
  async getTests(runId: number, options?: TestRailSearchOptions): Promise<TestRailTest[]> {
    const params = {
      ...options?.filter,
      offset: options?.offset,
      limit: options?.limit,
    };

    return this.get<TestRailTest[]>(`/get_tests/${runId}`, params);
  }

  /**
   * Get a specific test by ID
   */
  async getTest(testId: number): Promise<TestRailTest> {
    return this.get<TestRailTest>(`/get_test/${testId}`);
  }

  // ============================================================================
  // RESULT METHODS
  // ============================================================================

  /**
   * Get all results for a test
   */
  async getResults(testId: number, options?: TestRailSearchOptions): Promise<TestRailResult[]> {
    const params = {
      offset: options?.offset,
      limit: options?.limit,
    };

    return this.get<TestRailResult[]>(`/get_results/${testId}`, params);
  }

  /**
   * Get all results for a test case across runs
   */
  async getResultsForCase(
    runId: number,
    caseId: number,
    options?: TestRailSearchOptions
  ): Promise<TestRailResult[]> {
    const params = {
      offset: options?.offset,
      limit: options?.limit,
    };

    return this.get<TestRailResult[]>(`/get_results_for_case/${runId}/${caseId}`, params);
  }

  /**
   * Add a test result
   */
  async addResult(testId: number, data: CreateTestRailResult): Promise<TestRailResult> {
    return this.post<TestRailResult>(`/add_result/${testId}`, data);
  }

  /**
   * Add a test result for a case
   */
  async addResultForCase(
    runId: number,
    caseId: number,
    data: CreateTestRailResult
  ): Promise<TestRailResult> {
    return this.post<TestRailResult>(`/add_result_for_case/${runId}/${caseId}`, data);
  }

  /**
   * Add multiple results to a run
   */
  async addResults(
    runId: number,
    results: Array<{ test_id: number } & CreateTestRailResult>
  ): Promise<TestRailResult[]> {
    return this.post<TestRailResult[]>(`/add_results/${runId}`, { results });
  }

  /**
   * Add multiple results for cases
   */
  async addResultsForCases(
    runId: number,
    results: Array<{ case_id: number } & CreateTestRailResult>
  ): Promise<TestRailResult[]> {
    return this.post<TestRailResult[]>(`/add_results_for_cases/${runId}`, { results });
  }

  // ============================================================================
  // PLAN METHODS
  // ============================================================================

  /**
   * Get all test plans for a project
   */
  async getPlans(projectId: number, options?: TestRailSearchOptions): Promise<TestRailPlan[]> {
    const params = {
      ...options?.filter,
      offset: options?.offset,
      limit: options?.limit,
    };

    return this.get<TestRailPlan[]>(`/get_plans/${projectId}`, params);
  }

  /**
   * Get a specific test plan by ID
   */
  async getPlan(planId: number): Promise<TestRailPlan> {
    return this.get<TestRailPlan>(`/get_plan/${planId}`);
  }

  /**
   * Add a new test plan
   */
  async addPlan(projectId: number, data: CreateTestRailPlan): Promise<TestRailPlan> {
    return this.post<TestRailPlan>(`/add_plan/${projectId}`, data);
  }

  /**
   * Update a test plan
   */
  async updatePlan(planId: number, data: Partial<CreateTestRailPlan>): Promise<TestRailPlan> {
    return this.post<TestRailPlan>(`/update_plan/${planId}`, data);
  }

  /**
   * Close a test plan
   */
  async closePlan(planId: number): Promise<TestRailPlan> {
    return this.post<TestRailPlan>(`/close_plan/${planId}`, {});
  }

  /**
   * Delete a test plan
   */
  async deletePlan(planId: number): Promise<void> {
    return this.post<void>(`/delete_plan/${planId}`, {});
  }

  /**
   * Add plan entry
   */
  async addPlanEntry(
    planId: number,
    data: {
      suite_id: number;
      name?: string;
      description?: string;
      assignedto_id?: number;
      include_all?: boolean;
      case_ids?: number[];
      config_ids?: number[];
      runs?: Array<{
        include_all?: boolean;
        case_ids?: number[];
        config_ids?: number[];
        assignedto_id?: number;
      }>;
    }
  ): Promise<any> {
    return this.post<any>(`/add_plan_entry/${planId}`, data);
  }

  /**
   * Update plan entry
   */
  async updatePlanEntry(
    planId: number,
    entryId: string,
    data: {
      name?: string;
      description?: string;
      assignedto_id?: number;
      include_all?: boolean;
      case_ids?: number[];
    }
  ): Promise<any> {
    return this.post<any>(`/update_plan_entry/${planId}/${entryId}`, data);
  }

  /**
   * Delete plan entry
   */
  async deletePlanEntry(planId: number, entryId: string): Promise<void> {
    return this.post<void>(`/delete_plan_entry/${planId}/${entryId}`, {});
  }

  /**
   * Close plan entry
   */
  async closePlanEntry(planId: number, entryId: string): Promise<any> {
    return this.post<any>(`/close_plan_entry/${planId}/${entryId}`, {});
  }

  /**
   * Reopen plan
   */
  async reopenPlan(planId: number): Promise<TestRailPlan> {
    return this.post<TestRailPlan>(`/reopen_plan/${planId}`, {});
  }

  // ============================================================================
  // MILESTONE METHODS
  // ============================================================================

  /**
   * Get all milestones for a project
   */
  async getMilestones(
    projectId: number,
    options?: { is_completed?: 0 | 1; is_started?: 0 | 1 }
  ): Promise<TestRailMilestone[]> {
    return this.get<TestRailMilestone[]>(`/get_milestones/${projectId}`, options);
  }

  /**
   * Get a specific milestone by ID
   */
  async getMilestone(milestoneId: number): Promise<TestRailMilestone> {
    return this.get<TestRailMilestone>(`/get_milestone/${milestoneId}`);
  }

  /**
   * Add a new milestone
   */
  async addMilestone(
    projectId: number,
    data: {
      name: string;
      description?: string;
      due_on?: number;
      parent_id?: number;
      refs?: string;
    }
  ): Promise<TestRailMilestone> {
    return this.post<TestRailMilestone>(`/add_milestone/${projectId}`, data);
  }

  /**
   * Update a milestone
   */
  async updateMilestone(
    milestoneId: number,
    data: {
      name?: string;
      description?: string;
      due_on?: number;
      is_completed?: boolean;
      is_started?: boolean;
      refs?: string;
    }
  ): Promise<TestRailMilestone> {
    return this.post<TestRailMilestone>(`/update_milestone/${milestoneId}`, data);
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(milestoneId: number): Promise<void> {
    return this.post<void>(`/delete_milestone/${milestoneId}`, {});
  }

  // ============================================================================
  // METADATA METHODS
  // ============================================================================

  /**
   * Get all users
   */
  async getUsers(projectId?: number): Promise<TestRailUser[]> {
    const endpoint = projectId ? `/get_users/${projectId}` : '/get_users';
    return this.get<TestRailUser[]>(endpoint);
  }

  /**
   * Get a specific user by ID
   */
  async getUser(userId: number): Promise<TestRailUser> {
    return this.get<TestRailUser>(`/get_user/${userId}`);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<TestRailUser> {
    return this.get<TestRailUser>(`/get_user_by_email&email=${encodeURIComponent(email)}`);
  }

  /**
   * Get all case statuses
   */
  async getStatuses(): Promise<TestRailStatus[]> {
    return this.get<TestRailStatus[]>('/get_statuses');
  }

  /**
   * Get all case priorities
   */
  async getPriorities(): Promise<TestRailPriority[]> {
    return this.get<TestRailPriority[]>('/get_priorities');
  }

  /**
   * Get all case types
   */
  async getCaseTypes(): Promise<TestRailType[]> {
    return this.get<TestRailType[]>('/get_case_types');
  }

  /**
   * Get all case templates
   */
  async getTemplates(projectId: number): Promise<TestRailTemplate[]> {
    return this.get<TestRailTemplate[]>(`/get_templates/${projectId}`);
  }

  /**
   * Get all configurations for a project
   */
  async getConfigs(projectId: number): Promise<TestRailConfiguration[]> {
    return this.get<TestRailConfiguration[]>(`/get_configs/${projectId}`);
  }

  /**
   * Get configuration groups for a project
   */
  async getConfigGroups(projectId: number): Promise<any[]> {
    return this.get<any[]>(`/get_config_groups/${projectId}`);
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    name: string;
    email: string;
    role_id?: number;
    is_active?: boolean;
  }): Promise<TestRailUser> {
    return this.post<TestRailUser>('/add_user', data);
  }

  /**
   * Update an existing user
   */
  async updateUser(
    userId: number,
    data: {
      name?: string;
      email?: string;
      role_id?: number;
      is_active?: boolean;
    }
  ): Promise<TestRailUser> {
    return this.post<TestRailUser>(`/update_user/${userId}`, data);
  }

  /**
   * Add attachment to entity
   */
  async addAttachment(entityType: string, entityId: number, filePath: string): Promise<any> {
    // Note: This would require multipart/form-data handling
    // For now, return a placeholder implementation
    return this.post<any>(`/add_attachment_to_${entityType}/${entityId}`, { path: filePath });
  }

  /**
   * Get attachments for entity
   */
  async getAttachments(entityType: string, entityId: number): Promise<any[]> {
    return this.get<any[]>(`/get_attachments_for_${entityType}/${entityId}`);
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: number): Promise<void> {
    return this.post<void>(`/delete_attachment/${attachmentId}`, {});
  }

  /**
   * Get API information
   */
  async getApiInfo(): Promise<any> {
    return this.get<any>('/get_info');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Update the configuration
   */
  updateConfig(newConfig: Partial<TestRailConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update axios instance with new config
    if (newConfig.baseUrl) {
      this.client.defaults.baseURL = `${newConfig.baseUrl}/index.php?/api/v2`;
    }

    if (newConfig.username || newConfig.apiKey) {
      this.client.defaults.auth = {
        username: newConfig.username || this.config.username,
        password: newConfig.apiKey || this.config.apiKey,
      };
    }

    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }

    // Reset connection status to force re-test
    this.isConnected = false;
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<TestRailConfig, 'apiKey'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Get full configuration (for debugging - use with caution)
   */
  getFullConfig(): TestRailConfig {
    return { ...this.config };
  }
}
