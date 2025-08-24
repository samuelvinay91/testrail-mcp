/**
 * Unit Tests for ReportingAnalyticsManager
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ReportingAnalyticsManager } from '../../src/tools/reporting-analytics-manager';
import { TestRailService } from '../../src/utils/testrail-service';

// Mock TestRailService
jest.mock('../../src/utils/testrail-service');
const MockedTestRailService = TestRailService as jest.MockedClass<typeof TestRailService>;

describe('ReportingAnalyticsManager', () => {
  let reportingManager: ReportingAnalyticsManager;
  let mockTestRailService: jest.Mocked<TestRailService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTestRailService = new MockedTestRailService({
      baseUrl: 'https://test.testrail.io',
      username: 'test@example.com',
      apiKey: 'test-key'
    }) as jest.Mocked<TestRailService>;
    
    reportingManager = new ReportingAnalyticsManager(mockTestRailService);
  });

  describe('generateProjectDashboard', () => {
    test('should generate basic project dashboard', async () => {
      const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, is_completed: false };
      const mockSuites = [
        { id: 1, name: 'Suite 1', project_id: 1 },
        { id: 2, name: 'Suite 2', project_id: 1 }
      ];
      const mockRuns = [
        {
          id: 1,
          name: 'Run 1',
          passed_count: 5,
          failed_count: 2,
          blocked_count: 1,
          untested_count: 0,
          retest_count: 0,
          created_on: 1640995200 // 2022-01-01
        },
        {
          id: 2,
          name: 'Run 2',
          passed_count: 8,
          failed_count: 1,
          blocked_count: 0,
          untested_count: 1,
          retest_count: 0,
          created_on: 1641081600 // 2022-01-02
        }
      ];
      const mockMilestones = [
        { id: 1, name: 'Milestone 1', is_completed: false },
        { id: 2, name: 'Milestone 2', is_completed: true }
      ];

      mockTestRailService.getProject.mockResolvedValue(mockProject);
      mockTestRailService.getSuites.mockResolvedValue(mockSuites);
      mockTestRailService.getRuns.mockResolvedValue(mockRuns);
      mockTestRailService.getMilestones.mockResolvedValue(mockMilestones);
      mockTestRailService.getCases.mockResolvedValue([]);

      const result = await reportingManager.generateProjectDashboard({
        projectId: 1
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.project.id).toBe(1);
      expect(response.data.overview.total_suites).toBe(2);
      expect(response.data.overview.total_runs).toBe(2);
      expect(response.data.overview.active_milestones).toBe(1);
      expect(response.data.overview.completed_milestones).toBe(1);
      
      // Check statistics calculation
      expect(response.data.statistics.total_tests).toBe(18); // Sum of all test counts
      expect(response.data.statistics.passed).toBe(13); // Sum of passed tests
      expect(response.data.statistics.failed).toBe(3); // Sum of failed tests
    });

    test('should include trends when requested', async () => {
      const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, is_completed: false };
      const mockSuites = [];
      const mockRuns = [
        {
          id: 1,
          name: 'Run 1',
          passed_count: 5,
          failed_count: 2,
          blocked_count: 0,
          untested_count: 0,
          retest_count: 0,
          created_on: 1640995200
        }
      ];
      const mockMilestones = [];

      mockTestRailService.getProject.mockResolvedValue(mockProject);
      mockTestRailService.getSuites.mockResolvedValue(mockSuites);
      mockTestRailService.getRuns.mockResolvedValue(mockRuns);
      mockTestRailService.getMilestones.mockResolvedValue(mockMilestones);

      const result = await reportingManager.generateProjectDashboard({
        projectId: 1,
        includeTrends: true,
        timeRange: {
          start: '2022-01-01',
          end: '2022-01-31'
        }
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.trends).toBeDefined();
      expect(response.data.trends.data_points).toBeGreaterThanOrEqual(0);
    });

    test('should handle API errors gracefully', async () => {
      mockTestRailService.getProject.mockRejectedValue(new Error('Project not found'));

      const result = await reportingManager.generateProjectDashboard({
        projectId: 999
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.content[0].text).toContain('Project not found');
      expect(result.isError).toBe(true);
    });
  });

  describe('generateExecutionReport', () => {
    test('should generate run execution report', async () => {
      const mockRun = {
        id: 1,
        name: 'Test Run',
        created_on: 1640995200,
        completed_on: 1641081600,
        assignedto_id: 5
      };
      const mockTests = [
        { id: 1, case_id: 101, status_id: 1, title: 'Test 1' }, // Passed
        { id: 2, case_id: 102, status_id: 5, title: 'Test 2' }, // Failed
        { id: 3, case_id: 103, status_id: 2, title: 'Test 3' }, // Blocked
        { id: 4, case_id: 104, status_id: 3, title: 'Test 4' }  // Untested
      ];

      mockTestRailService.getRun.mockResolvedValue(mockRun);
      mockTestRailService.getTests.mockResolvedValue(mockTests);

      const result = await reportingManager.generateExecutionReport({
        projectId: 1,
        runId: 1,
        format: 'detailed'
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.run.id).toBe(1);
      expect(response.data.execution_summary.stats.total_tests).toBe(4);
      expect(response.data.execution_summary.stats.passed).toBe(1);
      expect(response.data.execution_summary.stats.failed).toBe(1);
      expect(response.data.execution_summary.stats.blocked).toBe(1);
      expect(response.data.execution_summary.stats.untested).toBe(1);
    });

    test('should generate plan execution report', async () => {
      const mockPlan = {
        id: 1,
        name: 'Test Plan',
        entries: [
          {
            id: '1',
            name: 'Entry 1',
            runs: [{ id: 1, name: 'Run 1' }]
          }
        ]
      };

      mockTestRailService.getPlan.mockResolvedValue(mockPlan);

      const result = await reportingManager.generateExecutionReport({
        projectId: 1,
        planId: 1,
        format: 'summary'
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.plan.id).toBe(1);
      expect(response.data.plan_summary).toBeDefined();
    });
  });

  describe('analyzeCaseMetrics', () => {
    test('should analyze case metrics successfully', async () => {
      const mockCases = [
        { id: 1, title: 'Test Case 1', priority_id: 2, type_id: 1, custom_automation_type: 'Manual' },
        { id: 2, title: 'Automated Test Case 2', priority_id: 3, type_id: 6, custom_automation_type: 'Automated' },
        { id: 3, title: 'Test Case 3', priority_id: 1, type_id: 1, custom_automation_type: 'Manual' }
      ];
      const mockRuns = [
        { id: 1, name: 'Run 1', created_on: 1640995200 },
        { id: 2, name: 'Run 2', created_on: 1641081600 }
      ];

      // Mock test results for each run
      mockTestRailService.getCases.mockResolvedValue(mockCases);
      mockTestRailService.getRuns.mockResolvedValue(mockRuns);
      mockTestRailService.getTests.mockResolvedValue([
        { case_id: 1, status_id: 1 }, // Case 1 passed
        { case_id: 2, status_id: 5 }, // Case 2 failed
        { case_id: 3, status_id: 3 }  // Case 3 untested
      ]);

      const result = await reportingManager.analyzeCaseMetrics({
        projectId: 1,
        includeFlakiness: true
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.total_cases).toBe(3);
      expect(response.data.analyzed_cases).toBe(3);
      expect(response.data.metrics.most_executed).toBeDefined();
      expect(response.data.metrics.never_executed).toBeDefined();
      expect(response.data.summary.avg_execution_count).toBeGreaterThanOrEqual(0);
    });

    test('should handle large case sets efficiently', async () => {
      // Create 150 mock cases to test the 100-case limit
      const mockCases = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        title: `Test Case ${i + 1}`,
        priority_id: 2,
        type_id: 1,
        custom_automation_type: 'Manual'
      }));
      const mockRuns = [];

      mockTestRailService.getCases.mockResolvedValue(mockCases);
      mockTestRailService.getRuns.mockResolvedValue(mockRuns);

      const result = await reportingManager.analyzeCaseMetrics({
        projectId: 1
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.total_cases).toBe(150);
      expect(response.data.analyzed_cases).toBe(100); // Should be limited to 100
    });
  });

  describe('generateCoverageReport', () => {
    test('should generate basic coverage report', async () => {
      const mockCases = [
        { id: 1, title: 'Test 1', priority_id: 1, type_id: 1, custom_automation_type: 'Manual' },
        { id: 2, title: 'Automated Test 2', priority_id: 2, type_id: 6, custom_automation_type: 'Automated' },
        { id: 3, title: 'Test 3', priority_id: 3, type_id: 1, custom_automation_type: 'Manual' },
        { id: 4, title: 'Automated Test 4', priority_id: 2, type_id: 6, custom_automation_type: 'Automated' }
      ];

      mockTestRailService.getCases.mockResolvedValue(mockCases);

      const result = await reportingManager.generateCoverageReport({
        projectId: 1
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.total_cases).toBe(4);
      expect(response.data.priority_coverage).toBeDefined();
      expect(response.data.type_coverage).toBeDefined();
      expect(response.data.automation_coverage).toBeDefined();
      
      // Check automation coverage calculation
      expect(response.data.automation_coverage.total_cases).toBe(4);
      expect(response.data.automation_coverage.automated_cases).toBe(2);
      expect(response.data.automation_coverage.manual_cases).toBe(2);
      expect(response.data.automation_coverage.automation_percentage).toBe(50);
    });

    test('should analyze priority distribution', async () => {
      const mockCases = [
        { id: 1, priority_id: 1, type_id: 1 }, // Low priority
        { id: 2, priority_id: 1, type_id: 1 }, // Low priority
        { id: 3, priority_id: 2, type_id: 1 }, // Medium priority
        { id: 4, priority_id: 3, type_id: 1 }, // High priority
        { id: 5, priority_id: 3, type_id: 1 }  // High priority
      ];

      mockTestRailService.getCases.mockResolvedValue(mockCases);

      const result = await reportingManager.generateCoverageReport({
        projectId: 1
      });

      const response = JSON.parse(result.content[0].text);
      const priorityCoverage = response.data.priority_coverage;
      
      expect(priorityCoverage.by_priority[1]).toBe(2); // 2 low priority cases
      expect(priorityCoverage.by_priority[2]).toBe(1); // 1 medium priority case
      expect(priorityCoverage.by_priority[3]).toBe(2); // 2 high priority cases
      expect(priorityCoverage.total).toBe(5);
      
      // Check percentage calculation in coverage distribution
      const distribution = priorityCoverage.coverage_distribution;
      expect(distribution.find((d: any) => d.priority_id === 1).percentage).toBe(40); // 2/5 * 100
      expect(distribution.find((d: any) => d.priority_id === 2).percentage).toBe(20); // 1/5 * 100
      expect(distribution.find((d: any) => d.priority_id === 3).percentage).toBe(40); // 2/5 * 100
    });
  });

  describe('trend analysis', () => {
    test('should calculate pass rate trends correctly', async () => {
      const projectId = 1;
      const mockRuns = [
        {
          id: 1,
          created_on: 1640995200, // 2022-01-01
          passed_count: 8,
          failed_count: 2,
          blocked_count: 0,
          untested_count: 0,
          retest_count: 0
        },
        {
          id: 2,
          created_on: 1641081600, // 2022-01-02
          passed_count: 6,
          failed_count: 4,
          blocked_count: 0,
          untested_count: 0,
          retest_count: 0
        }
      ];

      mockTestRailService.getRuns.mockResolvedValue(mockRuns);

      // Use the public method that calls generateTrendAnalysis internally
      const result = await reportingManager.generateProjectDashboard({
        projectId,
        includeTrends: true
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.trends).toBeDefined();
      expect(response.data.trends.data_points).toBe(2);
      expect(response.data.trends.analysis.avg_pass_rate).toBeCloseTo(70, 1); // (80% + 60%) / 2
    });
  });

  describe('error handling', () => {
    test('should handle service errors gracefully', async () => {
      mockTestRailService.getProject.mockRejectedValue(new Error('Service unavailable'));

      const result = await reportingManager.generateProjectDashboard({
        projectId: 1
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.content[0].text).toContain('Service unavailable');
      expect(result.isError).toBe(true);
    });

    test('should handle missing data gracefully', async () => {
      mockTestRailService.getCases.mockResolvedValue([]);
      mockTestRailService.getRuns.mockResolvedValue([]);

      const result = await reportingManager.analyzeCaseMetrics({
        projectId: 1
      });

      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text);
      expect(response.data.total_cases).toBe(0);
      expect(response.data.analyzed_cases).toBe(0);
    });
  });

  describe('helper method calculations', () => {
    test('should calculate statistics correctly', async () => {
      // Test through the dashboard generation which uses calculateProjectStats
      const mockProject = { id: 1, name: 'Test Project', suite_mode: 1, is_completed: false };
      const mockRuns = [
        {
          passed_count: 10,
          failed_count: 5,
          blocked_count: 2,
          untested_count: 3,
          retest_count: 1
        }
      ];

      mockTestRailService.getProject.mockResolvedValue(mockProject);
      mockTestRailService.getSuites.mockResolvedValue([]);
      mockTestRailService.getRuns.mockResolvedValue(mockRuns);
      mockTestRailService.getMilestones.mockResolvedValue([]);

      const result = await reportingManager.generateProjectDashboard({
        projectId: 1
      });

      const response = JSON.parse(result.content[0].text);
      const stats = response.data.statistics;
      
      expect(stats.total_tests).toBe(21); // Sum of all counts
      expect(stats.passed).toBe(10);
      expect(stats.failed).toBe(5);
      expect(stats.blocked).toBe(2);
      expect(stats.untested).toBe(3);
      expect(stats.retest).toBe(1);
      expect(stats.pass_rate).toBeCloseTo(47.6, 1); // 10/21 * 100
      expect(stats.completion_rate).toBeCloseTo(85.7, 1); // (21-3)/21 * 100
    });
  });
});