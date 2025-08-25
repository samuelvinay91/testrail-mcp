import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { TestRailService } from '../utils/testrail-service';
import { ProjectSuiteManager } from './project-suite-manager';
import { ReportingAnalyticsManager } from './reporting-analytics-manager';
import { AutoSpectraBridge, AutoSpectraTestSuite } from '../integration/autospectra-bridge';
import {
  TestRailMCPResponse,
  ConnectTestRailInput,
  GetProjectsInput,
  GetProjectInput,
  CreateProjectInput,
  GetSuitesInput,
  CreateSuiteInput,
  GetSectionsInput,
  CreateSectionInput,
  GetCasesInput,
  CreateCaseInput,
  UpdateCaseInput,
  DeleteCaseInput,
  GetRunsInput,
  CreateRunInput,
  UpdateRunInput,
  CloseRunInput,
  DeleteRunInput,
  GetTestsInput,
  AddResultInput,
  AddBulkResultsInput,
  GetResultsInput,
  GetUsersInput,
  GetReportInput,
  SearchInput,
  AddPlanEntryInput,
  UpdatePlanEntryInput,
  DeletePlanEntryInput,
  GetPlanEntriesInput,
  ClosePlanEntryInput,
  ReopenPlanInput,
  GetMilestoneInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  DeleteMilestoneInput,
  GetMilestoneDependenciesInput,
  UpdateMilestoneDependenciesInput,
  GetTemplatesInput,
  GetConfigurationsInput,
  GetConfigGroupsInput,
  UpdateProjectInput,
  DeleteProjectInput,
  GetProjectPermissionsInput,
  UpdateProjectPermissionsInput,
  ExportCasesInput,
  ExportRunsInput,
  GetReportsInput,
  AddAttachmentInput,
  GetAttachmentsInput,
  DeleteAttachmentInput,
  CreateUserInput,
  UpdateUserInput,
  TestRailErrorCodes,
} from '../types';

/**
 * TestRail MCP Tools
 * Comprehensive set of tools for TestRail integration via Model Context Protocol
 */
export class TestRailMCPTools {
  private testRailService: TestRailService | null = null;
  private projectSuiteManager: ProjectSuiteManager | null = null;
  private reportingAnalyticsManager: ReportingAnalyticsManager | null = null;
  private autoSpectraBridge: AutoSpectraBridge | null = null;

  /**
   * Helper method to create successful response
   */
  private createSuccessResponse(data: any, message?: string): TestRailMCPResponse {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              data,
              message: message || 'Operation completed successfully',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Helper method to create error response
   */
  private createErrorResponse(error: string, code?: string, details?: any): TestRailMCPResponse {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error,
              code: code || TestRailErrorCodes.INTERNAL_ERROR,
              details,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  /**
   * Validate service connection
   */
  private validateConnection(): void {
    if (!this.testRailService) {
      throw new Error(
        'TestRail service not connected. Please connect first using connect_testrail tool.'
      );
    }
  }

  // ============================================================================
  // CONNECTION & AUTHENTICATION TOOLS
  // ============================================================================

  /**
   * Connect to TestRail instance
   */
  async connectTestRail(input: ConnectTestRailInput): Promise<CallToolResult> {
    try {
      this.testRailService = new TestRailService({
        baseUrl: input.baseUrl,
        username: input.username,
        apiKey: input.apiKey,
        ...(input.timeout && { timeout: input.timeout }),
      });

      // Initialize advanced managers
      this.projectSuiteManager = new ProjectSuiteManager(this.testRailService);
      this.reportingAnalyticsManager = new ReportingAnalyticsManager(this.testRailService);
      this.autoSpectraBridge = new AutoSpectraBridge();

      const connectionTest = await this.testRailService.testConnection();

      if (connectionTest.connected) {
        return this.createSuccessResponse(connectionTest, 'Successfully connected to TestRail');
      } else {
        return this.createErrorResponse(
          connectionTest.error || 'Failed to connect to TestRail',
          TestRailErrorCodes.CONNECTION_FAILED
        );
      }
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Unknown connection error',
        TestRailErrorCodes.CONNECTION_FAILED,
        error
      );
    }
  }

  /**
   * Test TestRail connection
   */
  async testConnection(): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const result = await this.testRailService!.testConnection();
      return this.createSuccessResponse(result);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Connection test failed',
        TestRailErrorCodes.CONNECTION_FAILED
      );
    }
  }

  // ============================================================================
  // PROJECT TOOLS
  // ============================================================================

  /**
   * Get all projects
   */
  async getProjects(input: GetProjectsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const projects = await this.testRailService!.getProjects({
        is_completed: input.isCompleted ? 1 : 0,
      });

      return this.createSuccessResponse({
        projects,
        total: projects.length,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get projects',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get specific project
   */
  async getProject(input: GetProjectInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const project = await this.testRailService!.getProject(input.projectId);
      return this.createSuccessResponse({ project });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get project',
        TestRailErrorCodes.NOT_FOUND
      );
    }
  }

  /**
   * Create new project
   */
  async createProject(input: CreateProjectInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const project = await this.testRailService!.addProject({
        name: input.name,
        ...(input.announcement && { announcement: input.announcement }),
        ...(input.showAnnouncement !== undefined && { show_announcement: input.showAnnouncement }),
        ...(input.suiteMode && { suite_mode: input.suiteMode }),
      });
      return this.createSuccessResponse({ project }, 'Project created successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create project',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // SUITE TOOLS
  // ============================================================================

  /**
   * Get suites for a project
   */
  async getSuites(input: GetSuitesInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const suites = await this.testRailService!.getSuites(input.projectId);
      return this.createSuccessResponse({
        suites,
        total: suites.length,
        projectId: input.projectId,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get suites',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Create new suite
   */
  async createSuite(input: CreateSuiteInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const suite = await this.testRailService!.addSuite(input.projectId, {
        name: input.name,
        ...(input.description && { description: input.description }),
      });
      return this.createSuccessResponse({ suite }, 'Suite created successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create suite',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // SECTION TOOLS
  // ============================================================================

  /**
   * Get sections for a project/suite
   */
  async getSections(input: GetSectionsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const sections = await this.testRailService!.getSections(input.projectId, input.suiteId);
      return this.createSuccessResponse({
        sections,
        total: sections.length,
        projectId: input.projectId,
        suiteId: input.suiteId,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get sections',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Create new section
   */
  async createSection(input: CreateSectionInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const section = await this.testRailService!.addSection(input.projectId, {
        name: input.name,
        ...(input.description && { description: input.description }),
        ...(input.suiteId && { suite_id: input.suiteId }),
        ...(input.parentId && { parent_id: input.parentId }),
      });
      return this.createSuccessResponse({ section }, 'Section created successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create section',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // TEST CASE TOOLS
  // ============================================================================

  /**
   * Get test cases
   */
  async getCases(input: GetCasesInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const cases = await this.testRailService!.getCases(input.projectId, input.suiteId, {
        ...(input.limit && { limit: input.limit }),
        ...(input.offset && { offset: input.offset }),
        ...(input.filter && { filter: input.filter }),
      });

      return this.createSuccessResponse({
        cases,
        total: cases.length,
        projectId: input.projectId,
        suiteId: input.suiteId,
        sectionId: input.sectionId,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get test cases',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Create new test case
   */
  async createCase(input: CreateCaseInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      const caseData: any = {
        title: input.title,
        template_id: input.templateId,
        type_id: input.typeId,
        priority_id: input.priorityId,
        milestone_id: input.milestoneId,
        refs: input.refs,
        estimate: input.estimate,
        custom_preconds: input.preconditions,
        custom_steps: input.steps,
        custom_expected: input.expectedResult,
        custom_steps_separated: input.stepsDetailed,
        ...input.customFields,
      };

      const testCase = await this.testRailService!.addCase(input.sectionId, caseData);
      return this.createSuccessResponse({ case: testCase }, 'Test case created successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create test case',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Update test case
   */
  async updateCase(input: UpdateCaseInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      const updateData: any = {};
      if (input.title) updateData.title = input.title;
      if (input.templateId) updateData.template_id = input.templateId;
      if (input.typeId) updateData.type_id = input.typeId;
      if (input.priorityId) updateData.priority_id = input.priorityId;
      if (input.milestoneId) updateData.milestone_id = input.milestoneId;
      if (input.refs) updateData.refs = input.refs;
      if (input.estimate) updateData.estimate = input.estimate;
      if (input.preconditions) updateData.custom_preconds = input.preconditions;
      if (input.steps) updateData.custom_steps = input.steps;
      if (input.expectedResult) updateData.custom_expected = input.expectedResult;
      if (input.stepsDetailed) updateData.custom_steps_separated = input.stepsDetailed;
      if (input.customFields) Object.assign(updateData, input.customFields);

      const testCase = await this.testRailService!.updateCase(input.caseId, updateData);
      return this.createSuccessResponse({ case: testCase }, 'Test case updated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update test case',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Delete test case
   */
  async deleteCase(input: DeleteCaseInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      await this.testRailService!.deleteCase(input.caseId);
      return this.createSuccessResponse({ caseId: input.caseId }, 'Test case deleted successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete test case',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // TEST RUN TOOLS
  // ============================================================================

  /**
   * Get test runs
   */
  async getRuns(input: GetRunsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const runs = await this.testRailService!.getRuns(input.projectId, {
        ...(input.limit && { limit: input.limit }),
        ...(input.offset && { offset: input.offset }),
        filter: {
          is_completed: input.isCompleted ? 1 : 0,
          ...(input.milestoneId && { milestone_id: [input.milestoneId] }),
        },
      });

      return this.createSuccessResponse({
        runs,
        total: runs.length,
        projectId: input.projectId,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get test runs',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Create new test run
   */
  async createRun(input: CreateRunInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const run = await this.testRailService!.addRun(input.projectId, {
        name: input.name,
        ...(input.description && { description: input.description }),
        ...(input.milestoneId && { milestone_id: input.milestoneId }),
        ...(input.assignedToId && { assignedto_id: input.assignedToId }),
        ...(input.includeAll !== undefined && { include_all: input.includeAll }),
        ...(input.caseIds && { case_ids: input.caseIds }),
        ...(input.configIds && { config_ids: input.configIds }),
      });

      return this.createSuccessResponse({ run }, 'Test run created successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create test run',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Update test run
   */
  async updateRun(input: UpdateRunInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description) updateData.description = input.description;
      if (input.milestoneId) updateData.milestone_id = input.milestoneId;
      if (input.assignedToId) updateData.assignedto_id = input.assignedToId;

      const run = await this.testRailService!.updateRun(input.runId, updateData);
      return this.createSuccessResponse({ run }, 'Test run updated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update test run',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Close test run
   */
  async closeRun(input: CloseRunInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const run = await this.testRailService!.closeRun(input.runId);
      return this.createSuccessResponse({ run }, 'Test run closed successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to close test run',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Delete test run
   */
  async deleteRun(input: DeleteRunInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      await this.testRailService!.deleteRun(input.runId);
      return this.createSuccessResponse({ runId: input.runId }, 'Test run deleted successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete test run',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // TEST EXECUTION TOOLS
  // ============================================================================

  /**
   * Get tests in a run
   */
  async getTests(input: GetTestsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const tests = await this.testRailService!.getTests(input.runId, {
        ...(input.limit && { limit: input.limit }),
        ...(input.offset && { offset: input.offset }),
        ...(input.statusId && { filter: { status_id: [input.statusId] } }),
      });

      return this.createSuccessResponse({
        tests,
        total: tests.length,
        runId: input.runId,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get tests',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Add test result
   */
  async addResult(input: AddResultInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      const resultData: any = {
        status_id: input.statusId,
        comment: input.comment,
        version: input.version,
        elapsed: input.elapsed,
        defects: input.defects,
        assignedto_id: input.assignedToId,
        custom_step_results: input.stepResults,
        ...input.customFields,
      };

      let result;
      if (input.testId) {
        result = await this.testRailService!.addResult(input.testId, resultData);
      } else if (input.runId && input.caseId) {
        result = await this.testRailService!.addResultForCase(
          input.runId,
          input.caseId,
          resultData
        );
      } else {
        throw new Error('Either testId or both runId and caseId must be provided');
      }

      return this.createSuccessResponse({ result }, 'Test result added successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to add test result',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Add bulk test results
   */
  async addBulkResults(input: AddBulkResultsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      // Convert input format to TestRail API format
      const results = input.results.map((result) => {
        const resultData: any = {
          status_id: result.statusId,
          comment: result.comment,
          version: result.version,
          elapsed: result.elapsed,
          defects: result.defects,
          assignedto_id: result.assignedToId,
          custom_step_results: result.stepResults,
          ...result.customFields,
        };

        if (result.testId) {
          resultData.test_id = result.testId;
        } else if (result.caseId) {
          resultData.case_id = result.caseId;
        }

        return resultData;
      });

      // Determine if we're adding by test IDs or case IDs
      const hasTestIds = results.some((r) => r.test_id);
      const hasCaseIds = results.some((r) => r.case_id);

      let apiResults;
      if (hasTestIds && !hasCaseIds) {
        apiResults = await this.testRailService!.addResults(input.runId, results);
      } else if (hasCaseIds && !hasTestIds) {
        apiResults = await this.testRailService!.addResultsForCases(input.runId, results);
      } else {
        throw new Error('All results must use either test_id or case_id consistently');
      }

      return this.createSuccessResponse(
        {
          results: apiResults,
          processed: results.length,
          runId: input.runId,
        },
        'Bulk test results added successfully'
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to add bulk test results',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // RESULT RETRIEVAL TOOLS
  // ============================================================================

  /**
   * Get test results
   */
  async getResults(input: GetResultsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      let results;
      if (input.testId) {
        results = await this.testRailService!.getResults(input.testId, {
          ...(input.limit && { limit: input.limit }),
          ...(input.offset && { offset: input.offset }),
        });
      } else if (input.runId && input.caseId) {
        results = await this.testRailService!.getResultsForCase(input.runId, input.caseId, {
          ...(input.limit && { limit: input.limit }),
          ...(input.offset && { offset: input.offset }),
        });
      } else {
        throw new Error('Either testId or both runId and caseId must be provided');
      }

      return this.createSuccessResponse({
        results,
        total: results.length,
        testId: input.testId,
        runId: input.runId,
        caseId: input.caseId,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get test results',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // METADATA TOOLS
  // ============================================================================

  /**
   * Get users
   */
  async getUsers(input: GetUsersInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const users = await this.testRailService!.getUsers(input.projectId);
      return this.createSuccessResponse({
        users,
        total: users.length,
        projectId: input.projectId,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get users',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get statuses
   */
  async getStatuses(): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const statuses = await this.testRailService!.getStatuses();
      return this.createSuccessResponse({
        statuses,
        total: statuses.length,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get statuses',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get priorities
   */
  async getPriorities(): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const priorities = await this.testRailService!.getPriorities();
      return this.createSuccessResponse({
        priorities,
        total: priorities.length,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get priorities',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get case types
   */
  async getCaseTypes(): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const types = await this.testRailService!.getCaseTypes();
      return this.createSuccessResponse({
        types,
        total: types.length,
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get case types',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // ADVANCED TOOLS
  // ============================================================================

  /**
   * Search across TestRail entities
   */
  async search(input: SearchInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      const results: any = {
        query: input.query,
        entityType: input.entityType,
        total: 0,
        items: [],
      };

      // Search based on entity type
      switch (input.entityType) {
        case 'cases':
          const cases = await this.testRailService!.getCases(input.projectId);
          results.items = cases
            .filter(
              (c) =>
                c.title.toLowerCase().includes(input.query.toLowerCase()) ||
                (c.custom_steps && c.custom_steps.toLowerCase().includes(input.query.toLowerCase()))
            )
            .slice(input.offset || 0, (input.offset || 0) + (input.limit || 50));
          break;

        case 'runs':
          const runs = await this.testRailService!.getRuns(input.projectId);
          results.items = runs
            .filter(
              (r) =>
                r.name.toLowerCase().includes(input.query.toLowerCase()) ||
                (r.description && r.description.toLowerCase().includes(input.query.toLowerCase()))
            )
            .slice(input.offset || 0, (input.offset || 0) + (input.limit || 50));
          break;

        case 'plans':
          const plans = await this.testRailService!.getPlans(input.projectId);
          results.items = plans
            .filter(
              (p) =>
                p.name.toLowerCase().includes(input.query.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(input.query.toLowerCase()))
            )
            .slice(input.offset || 0, (input.offset || 0) + (input.limit || 50));
          break;

        case 'milestones':
          const milestones = await this.testRailService!.getMilestones(input.projectId);
          results.items = milestones
            .filter(
              (m) =>
                m.name.toLowerCase().includes(input.query.toLowerCase()) ||
                (m.description && m.description.toLowerCase().includes(input.query.toLowerCase()))
            )
            .slice(input.offset || 0, (input.offset || 0) + (input.limit || 50));
          break;

        default:
          // Search across all entity types
          const allCases = await this.testRailService!.getCases(input.projectId);
          const allRuns = await this.testRailService!.getRuns(input.projectId);

          const matchingCases = allCases
            .filter((c) => c.title.toLowerCase().includes(input.query.toLowerCase()))
            .map((c) => ({ ...c, entity_type: 'case' }));

          const matchingRuns = allRuns
            .filter((r) => r.name.toLowerCase().includes(input.query.toLowerCase()))
            .map((r) => ({ ...r, entity_type: 'run' }));

          results.items = [...matchingCases, ...matchingRuns].slice(
            input.offset || 0,
            (input.offset || 0) + (input.limit || 50)
          );
          break;
      }

      results.total = results.items.length;

      return this.createSuccessResponse(
        results,
        `Found ${results.total} items matching "${input.query}"`
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Search failed',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(input: GetReportInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      // Gather data for the report
      const projectData = await this.testRailService!.getProject(input.projectId);

      let reportData: any = {
        project: projectData,
        generatedAt: new Date().toISOString(),
        format: input.format || 'summary',
      };

      if (input.runId) {
        const run = await this.testRailService!.getRun(input.runId);
        const tests = await this.testRailService!.getTests(input.runId);
        reportData.run = run;
        reportData.tests = tests;
        reportData.summary = {
          total: tests.length,
          passed: tests.filter((t) => t.status_id === 1).length,
          failed: tests.filter((t) => t.status_id === 5).length,
          blocked: tests.filter((t) => t.status_id === 2).length,
          untested: tests.filter((t) => t.status_id === 3).length,
        };
      }

      return this.createSuccessResponse(reportData, 'Report generated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to generate report',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // ADVANCED PROJECT & SUITE MANAGEMENT TOOLS
  // ============================================================================

  /**
   * Create advanced project with templates and initial structure
   */
  async createAdvancedProject(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.projectSuiteManager) {
        throw new Error('Project suite manager not initialized');
      }
      return await this.projectSuiteManager.createAdvancedProject(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create advanced project',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Analyze project structure and health
   */
  async analyzeProjectStructure(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.projectSuiteManager) {
        throw new Error('Project suite manager not initialized');
      }
      return await this.projectSuiteManager.analyzeProjectStructure(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to analyze project structure',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Bulk manage test suites with advanced operations
   */
  async bulkManageSuites(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.projectSuiteManager) {
        throw new Error('Project suite manager not initialized');
      }
      return await this.projectSuiteManager.bulkManageSuites(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to bulk manage suites',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Create advanced suite with templates and structure
   */
  async createAdvancedSuite(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.projectSuiteManager) {
        throw new Error('Project suite manager not initialized');
      }
      return await this.projectSuiteManager.createAdvancedSuite(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create advanced suite',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // REPORTING & ANALYTICS TOOLS
  // ============================================================================

  /**
   * Generate comprehensive project dashboard
   */
  async generateProjectDashboard(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.reportingAnalyticsManager) {
        throw new Error('Reporting analytics manager not initialized');
      }
      return await this.reportingAnalyticsManager.generateProjectDashboard(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to generate project dashboard',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Generate detailed test execution report
   */
  async generateExecutionReport(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.reportingAnalyticsManager) {
        throw new Error('Reporting analytics manager not initialized');
      }
      return await this.reportingAnalyticsManager.generateExecutionReport(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to generate execution report',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Analyze test case metrics and health
   */
  async analyzeCaseMetrics(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.reportingAnalyticsManager) {
        throw new Error('Reporting analytics manager not initialized');
      }
      return await this.reportingAnalyticsManager.analyzeCaseMetrics(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to analyze case metrics',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Generate test coverage report
   */
  async generateCoverageReport(input: any): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.reportingAnalyticsManager) {
        throw new Error('Reporting analytics manager not initialized');
      }
      return await this.reportingAnalyticsManager.generateCoverageReport(input);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to generate coverage report',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // INTEGRATION TOOLS
  // ============================================================================

  /**
   * Synchronize AutoSpectra test results with TestRail
   */
  async autoSpectraSync(input: {
    projectId: number;
    testSuite: AutoSpectraTestSuite;
    options?: {
      createCasesIfMissing?: boolean;
      milestoneId?: number;
      environment?: string;
      buildNumber?: string;
    };
  }): Promise<CallToolResult> {
    try {
      this.validateConnection();
      if (!this.autoSpectraBridge) {
        throw new Error('AutoSpectra bridge not initialized');
      }

      // Mock connection data since we don't have getConnectionData method
      const result = await this.autoSpectraBridge.autoSync(
        input.projectId,
        input.testSuite,
        input.options
      );

      return this.createSuccessResponse(
        result,
        `AutoSpectra sync completed: ${result.success ? 'SUCCESS' : 'FAILED'}`
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to sync AutoSpectra results',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // PLAN ENTRY MANAGEMENT TOOLS
  // ============================================================================

  /**
   * Add entry to test plan
   */
  async addPlanEntry(input: AddPlanEntryInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const entry = await this.testRailService!.addPlanEntry(input.planId, {
        suite_id: input.suiteId,
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.assignedToId && { assignedto_id: input.assignedToId }),
        ...(input.includeAll !== undefined && { include_all: input.includeAll }),
        ...(input.caseIds && { case_ids: input.caseIds }),
        ...(input.configIds && { config_ids: input.configIds }),
        ...(input.runs && {
          runs: input.runs.map((run) => ({
            ...(run.includeAll !== undefined && { include_all: run.includeAll }),
            ...(run.caseIds && { case_ids: run.caseIds }),
            ...(run.configIds && { config_ids: run.configIds }),
            ...(run.assignedToId && { assignedto_id: run.assignedToId }),
          })),
        }),
      });
      return this.createSuccessResponse({ entry }, 'Plan entry added successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to add plan entry',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Update plan entry
   */
  async updatePlanEntry(input: UpdatePlanEntryInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const entry = await this.testRailService!.updatePlanEntry(input.planId, input.entryId, {
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.assignedToId && { assignedto_id: input.assignedToId }),
        ...(input.includeAll !== undefined && { include_all: input.includeAll }),
        ...(input.caseIds && { case_ids: input.caseIds }),
      });
      return this.createSuccessResponse({ entry }, 'Plan entry updated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update plan entry',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Delete plan entry
   */
  async deletePlanEntry(input: DeletePlanEntryInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      await this.testRailService!.deletePlanEntry(input.planId, input.entryId);
      return this.createSuccessResponse({}, 'Plan entry deleted successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete plan entry',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get plan entries
   */
  async getPlanEntries(input: GetPlanEntriesInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const plan = await this.testRailService!.getPlan(input.planId);
      return this.createSuccessResponse({ entries: plan.entries || [] });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get plan entries',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Close plan entry
   */
  async closePlanEntry(input: ClosePlanEntryInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const entry = await this.testRailService!.closePlanEntry(input.planId, input.entryId);
      return this.createSuccessResponse({ entry }, 'Plan entry closed successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to close plan entry',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Reopen plan
   */
  async reopenPlan(input: ReopenPlanInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const plan = await this.testRailService!.reopenPlan(input.planId);
      return this.createSuccessResponse({ plan }, 'Plan reopened successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to reopen plan',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // ENHANCED MILESTONE MANAGEMENT TOOLS
  // ============================================================================

  /**
   * Get specific milestone
   */
  async getMilestone(input: GetMilestoneInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const milestone = await this.testRailService!.getMilestone(input.milestoneId);
      return this.createSuccessResponse({ milestone });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get milestone',
        TestRailErrorCodes.NOT_FOUND
      );
    }
  }

  /**
   * Create milestone (enhanced version)
   */
  async createMilestone(input: CreateMilestoneInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const milestone = await this.testRailService!.addMilestone(input.projectId, {
        name: input.name,
        ...(input.description && { description: input.description }),
        ...(input.dueOn && { due_on: new Date(input.dueOn).getTime() / 1000 }),
        ...(input.parentId && { parent_id: input.parentId }),
        ...(input.refs && { refs: input.refs }),
      });
      return this.createSuccessResponse({ milestone }, 'Milestone created successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create milestone',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Update milestone (enhanced version)
   */
  async updateMilestone(input: UpdateMilestoneInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const milestone = await this.testRailService!.updateMilestone(input.milestoneId, {
        ...(input.name && { name: input.name }),
        ...(input.description && { description: input.description }),
        ...(input.dueOn && { due_on: new Date(input.dueOn).getTime() / 1000 }),
        ...(input.isCompleted !== undefined && { is_completed: input.isCompleted }),
        ...(input.isStarted !== undefined && { is_started: input.isStarted }),
        ...(input.refs && { refs: input.refs }),
      });
      return this.createSuccessResponse({ milestone }, 'Milestone updated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update milestone',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Delete milestone (enhanced version)
   */
  async deleteMilestone(input: DeleteMilestoneInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      await this.testRailService!.deleteMilestone(input.milestoneId);
      return this.createSuccessResponse({}, 'Milestone deleted successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete milestone',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get milestone dependencies
   */
  async getMilestoneDependencies(input: GetMilestoneDependenciesInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      // Note: TestRail API may not have direct dependency support
      // This is a placeholder for future enhancement
      await this.testRailService!.getMilestone(input.milestoneId); // Validate milestone exists
      return this.createSuccessResponse({
        milestone_id: input.milestoneId,
        dependencies: [], // Placeholder
        note: 'Milestone dependencies feature requires custom implementation',
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get milestone dependencies',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Update milestone dependencies
   */
  async updateMilestoneDependencies(
    input: UpdateMilestoneDependenciesInput
  ): Promise<CallToolResult> {
    try {
      this.validateConnection();
      // Note: TestRail API may not have direct dependency support
      // This is a placeholder for future enhancement
      return this.createSuccessResponse(
        {
          milestone_id: input.milestoneId,
          dependencies: input.dependencies,
          note: 'Milestone dependencies feature requires custom implementation',
        },
        'Dependencies updated (placeholder)'
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update milestone dependencies',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // TEMPLATES & CONFIGURATIONS TOOLS
  // ============================================================================

  /**
   * Get templates
   */
  async getTemplates(input: GetTemplatesInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const templates = await this.testRailService!.getTemplates(input.projectId);
      return this.createSuccessResponse({ templates });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get templates',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get configurations
   */
  async getConfigurations(input: GetConfigurationsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const configurations = await this.testRailService!.getConfigs(input.projectId);
      return this.createSuccessResponse({ configurations });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get configurations',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get configuration groups
   */
  async getConfigGroups(input: GetConfigGroupsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const configGroups = await this.testRailService!.getConfigGroups(input.projectId);
      return this.createSuccessResponse({ configGroups });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get configuration groups',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // PROJECT ADMINISTRATION TOOLS
  // ============================================================================

  /**
   * Update project
   */
  async updateProject(input: UpdateProjectInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const project = await this.testRailService!.updateProject(input.projectId, {
        ...(input.name && { name: input.name }),
        ...(input.announcement && { announcement: input.announcement }),
        ...(input.showAnnouncement !== undefined && { show_announcement: input.showAnnouncement }),
        ...(input.suiteMode && { suite_mode: input.suiteMode }),
        ...(input.isCompleted !== undefined && { is_completed: input.isCompleted }),
      });
      return this.createSuccessResponse({ project }, 'Project updated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update project',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Delete project
   */
  async deleteProject(input: DeleteProjectInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      await this.testRailService!.deleteProject(input.projectId);
      return this.createSuccessResponse({}, 'Project deleted successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete project',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get project permissions
   */
  async getProjectPermissions(input: GetProjectPermissionsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      // Note: TestRail API may not have direct permissions endpoint
      // This is a placeholder for future enhancement
      return this.createSuccessResponse({
        project_id: input.projectId,
        user_id: input.userId,
        permissions: {},
        note: 'Project permissions feature requires custom implementation',
      });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get project permissions',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Update project permissions
   */
  async updateProjectPermissions(input: UpdateProjectPermissionsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      // Note: TestRail API may not have direct permissions endpoint
      // This is a placeholder for future enhancement
      return this.createSuccessResponse(
        {
          project_id: input.projectId,
          user_id: input.userId,
          permissions: input.permissions,
          note: 'Project permissions feature requires custom implementation',
        },
        'Permissions updated (placeholder)'
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update project permissions',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // ENHANCED REPORTING TOOLS
  // ============================================================================

  /**
   * Export test cases
   */
  async exportCases(input: ExportCasesInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const cases = await this.testRailService!.getCases(input.projectId, input.suiteId);

      // Apply filters if provided
      let filteredCases = cases;
      if (input.filter) {
        filteredCases = cases.filter((c) => {
          if (input.filter!.priority_id && !input.filter!.priority_id.includes(c.priority_id))
            return false;
          if (input.filter!.type_id && !input.filter!.type_id.includes(c.type_id)) return false;
          if (input.filter!.created_by && !input.filter!.created_by.includes(c.created_by))
            return false;
          if (
            input.filter!.milestone_id &&
            c.milestone_id &&
            !input.filter!.milestone_id.includes(c.milestone_id)
          )
            return false;
          return true;
        });
      }

      return this.createSuccessResponse(
        {
          format: input.format,
          total_cases: filteredCases.length,
          cases: filteredCases,
          exported_at: new Date().toISOString(),
        },
        `Cases exported in ${input.format} format`
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to export cases',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Export test runs
   */
  async exportRuns(input: ExportRunsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      let runs;
      if (input.runId) {
        const run = await this.testRailService!.getRun(input.runId);
        runs = [run];
        if (input.includeResults) {
          const tests = await this.testRailService!.getTests(input.runId);
          (runs[0] as any).tests = tests;
        }
      } else {
        runs = await this.testRailService!.getRuns(input.projectId);

        // Apply date range filter if provided
        if (input.dateRange) {
          const startTime = new Date(input.dateRange.start).getTime() / 1000;
          const endTime = new Date(input.dateRange.end).getTime() / 1000;
          runs = runs.filter((run) => run.created_on >= startTime && run.created_on <= endTime);
        }
      }

      return this.createSuccessResponse(
        {
          format: input.format,
          total_runs: runs.length,
          runs,
          include_results: input.includeResults || false,
          exported_at: new Date().toISOString(),
        },
        `Runs exported in ${input.format} format`
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to export runs',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get detailed reports
   */
  async getReports(input: GetReportsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();

      let reportData: any = {
        project_id: input.projectId,
        type: input.type,
        generated_at: new Date().toISOString(),
      };

      switch (input.type) {
        case 'summary':
          const runs = await this.testRailService!.getRuns(input.projectId);
          reportData.summary = {
            total_runs: runs.length,
            completed_runs: runs.filter((r) => r.is_completed).length,
            total_tests: runs.reduce(
              (sum, r) =>
                sum +
                (r.passed_count +
                  r.failed_count +
                  r.blocked_count +
                  r.untested_count +
                  r.retest_count),
              0
            ),
            passed_tests: runs.reduce((sum, r) => sum + r.passed_count, 0),
            failed_tests: runs.reduce((sum, r) => sum + r.failed_count, 0),
          };
          break;

        case 'progress':
          if (input.runId) {
            const run = await this.testRailService!.getRun(input.runId);
            const tests = await this.testRailService!.getTests(input.runId);
            reportData.progress = {
              run,
              completion_rate: ((tests.length - run.untested_count) / tests.length) * 100,
              pass_rate: (run.passed_count / (run.passed_count + run.failed_count)) * 100,
            };
          }
          break;

        case 'activity':
          const allRuns = await this.testRailService!.getRuns(input.projectId, { limit: 50 });
          reportData.activity = {
            recent_runs: allRuns.slice(0, 10),
            runs_by_day: {}, // Placeholder for activity analysis
          };
          break;

        case 'comparison':
          // Placeholder for comparison logic
          reportData.comparison = {
            note: 'Comparison reports require additional implementation',
          };
          break;
      }

      return this.createSuccessResponse(reportData, `${input.type} report generated successfully`);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get reports',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // ATTACHMENTS TOOLS
  // ============================================================================

  /**
   * Add attachment
   */
  async addAttachment(input: AddAttachmentInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const attachment = await this.testRailService!.addAttachment(
        input.entityType,
        input.entityId,
        input.filePath
      );
      return this.createSuccessResponse({ attachment }, 'Attachment added successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to add attachment',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Get attachments
   */
  async getAttachments(input: GetAttachmentsInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const attachments = await this.testRailService!.getAttachments(
        input.entityType,
        input.entityId
      );
      return this.createSuccessResponse({ attachments });
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get attachments',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(input: DeleteAttachmentInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      await this.testRailService!.deleteAttachment(input.attachmentId);
      return this.createSuccessResponse({}, 'Attachment deleted successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete attachment',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // ============================================================================
  // USER MANAGEMENT TOOLS
  // ============================================================================

  /**
   * Create user
   */
  async createUser(input: CreateUserInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const user = await this.testRailService!.createUser({
        name: input.name,
        email: input.email,
        ...(input.roleId && { role_id: input.roleId }),
        ...(input.isActive !== undefined && { is_active: input.isActive }),
      });
      return this.createSuccessResponse({ user }, 'User created successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create user',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Update user
   */
  async updateUser(input: UpdateUserInput): Promise<CallToolResult> {
    try {
      this.validateConnection();
      const user = await this.testRailService!.updateUser(input.userId, {
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
        ...(input.roleId && { role_id: input.roleId }),
        ...(input.isActive !== undefined && { is_active: input.isActive }),
      });
      return this.createSuccessResponse({ user }, 'User updated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update user',
        TestRailErrorCodes.API_ERROR
      );
    }
  }
}
