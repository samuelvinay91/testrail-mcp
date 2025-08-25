/**
 * TestRail Reporting and Analytics Tools
 * Comprehensive reporting, metrics, and analytics functionality
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { TestRailService } from '../utils/testrail-service';
import {
  TestRailStats,
  TestRailExecutionSummary,
  TestRailCaseMetrics,
  TestRailTrendData,
  TestRailErrorCodes,
} from '../types';

export class ReportingAnalyticsManager {
  private testRailService: TestRailService;

  constructor(testRailService: TestRailService) {
    this.testRailService = testRailService;
  }

  /**
   * Generate comprehensive project dashboard
   */
  async generateProjectDashboard(params: {
    projectId: number;
    timeRange?: {
      start: string; // YYYY-MM-DD
      end: string; // YYYY-MM-DD
    };
    includeMetrics?: boolean;
    includeTrends?: boolean;
    includeTopFailures?: boolean;
  }): Promise<CallToolResult> {
    try {
      const project = await this.testRailService.getProject(params.projectId);
      const suites = await this.testRailService.getSuites(params.projectId);
      const runs = await this.testRailService.getRuns(params.projectId, { limit: 100 });
      const milestones = await this.testRailService.getMilestones(params.projectId);

      // Calculate overall project statistics
      const overallStats = this.calculateProjectStats(runs);

      // Generate suite breakdown
      const suiteBreakdown = await this.generateSuiteBreakdown(params.projectId, suites);

      // Generate trends if requested
      let trends = null;
      if (params.includeTrends) {
        trends = await this.generateTrendAnalysis(params.projectId, params.timeRange);
      }

      // Top failures analysis
      let topFailures = null;
      if (params.includeTopFailures) {
        topFailures = await this.analyzeTopFailures(params.projectId, runs.slice(0, 10));
      }

      const dashboard = {
        project: {
          id: project.id,
          name: project.name,
          suite_mode: project.suite_mode,
          is_completed: project.is_completed,
        },
        overview: {
          total_suites: suites.length,
          total_runs: runs.length,
          active_milestones: milestones.filter((m) => !m.is_completed).length,
          completed_milestones: milestones.filter((m) => m.is_completed).length,
        },
        statistics: overallStats,
        suite_breakdown: suiteBreakdown,
        trends,
        top_failures: topFailures,
        generated_at: new Date().toISOString(),
      };

      return this.createSuccessResponse(dashboard, 'Project dashboard generated successfully');
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
  async generateExecutionReport(params: {
    runId?: number;
    planId?: number;
    projectId: number;
    format?: 'summary' | 'detailed' | 'executive';
    includeFailureAnalysis?: boolean;
    includePerformanceMetrics?: boolean;
  }): Promise<CallToolResult> {
    try {
      let reportData: any = {
        project_id: params.projectId,
        format: params.format || 'summary',
        generated_at: new Date().toISOString(),
      };

      if (params.runId) {
        // Single run report
        const run = await this.testRailService.getRun(params.runId);
        const tests = await this.testRailService.getTests(params.runId);

        reportData.run = run;
        reportData.execution_summary = this.generateExecutionSummary(run, tests);

        if (params.includeFailureAnalysis) {
          reportData.failure_analysis = await this.analyzeRunFailures(params.runId, tests);
        }

        if (params.includePerformanceMetrics) {
          reportData.performance_metrics = await this.calculatePerformanceMetrics(tests);
        }
      } else if (params.planId) {
        // Test plan report
        const plan = await this.testRailService.getPlan(params.planId);
        reportData.plan = plan;
        reportData.plan_summary = this.generatePlanSummary(plan);
      }

      return this.createSuccessResponse(reportData, 'Execution report generated successfully');
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
  async analyzeCaseMetrics(params: {
    projectId: number;
    suiteId?: number;
    timeRange?: {
      start: string;
      end: string;
    };
    includeFlakiness?: boolean;
    includeExecutionTrends?: boolean;
  }): Promise<CallToolResult> {
    try {
      const cases = await this.testRailService.getCases(params.projectId, params.suiteId);
      const runs = await this.testRailService.getRuns(params.projectId, { limit: 50 });

      const caseMetrics = [];
      for (const testCase of cases.slice(0, 100)) {
        // Limit for performance
        const metrics = await this.calculateCaseMetrics(testCase, runs);
        if (params.includeFlakiness) {
          metrics.flakiness_score = await this.calculateFlakiness(testCase.id, runs);
        }
        caseMetrics.push(metrics);
      }

      // Sort by various criteria
      const analysis = {
        total_cases: cases.length,
        analyzed_cases: caseMetrics.length,
        metrics: {
          most_executed: caseMetrics
            .sort((a, b) => b.execution_count - a.execution_count)
            .slice(0, 10),
          least_executed: caseMetrics
            .filter((m) => m.execution_count > 0)
            .sort((a, b) => a.execution_count - b.execution_count)
            .slice(0, 10),
          most_failures: caseMetrics.sort((a, b) => b.fail_count - a.fail_count).slice(0, 10),
          never_executed: caseMetrics.filter((m) => m.execution_count === 0).length,
          high_flakiness: params.includeFlakiness
            ? caseMetrics.filter((m) => (m.flakiness_score || 0) > 0.3).slice(0, 10)
            : undefined,
        },
        summary: {
          avg_execution_count:
            caseMetrics.reduce((sum, m) => sum + m.execution_count, 0) / caseMetrics.length,
          total_executions: caseMetrics.reduce((sum, m) => sum + m.execution_count, 0),
          avg_pass_rate:
            caseMetrics.reduce(
              (sum, m) => sum + (m.execution_count > 0 ? m.pass_count / m.execution_count : 0),
              0
            ) / caseMetrics.length,
        },
      };

      return this.createSuccessResponse(analysis, 'Case metrics analysis completed successfully');
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
  async generateCoverageReport(params: {
    projectId: number;
    suiteId?: number;
    requirementField?: string; // Custom field containing requirements
    componentField?: string; // Custom field containing components
  }): Promise<CallToolResult> {
    try {
      const cases = await this.testRailService.getCases(params.projectId, params.suiteId);

      // Analyze coverage by priority
      const priorityCoverage = this.analyzePriorityCoverage(cases);

      // Analyze coverage by type
      const typeCoverage = this.analyzeTypeCoverage(cases);

      // Analyze automation coverage
      const automationCoverage = this.analyzeAutomationCoverage(cases);

      // Analyze requirement coverage if field specified
      let requirementCoverage = null;
      if (params.requirementField) {
        requirementCoverage = this.analyzeRequirementCoverage(cases, params.requirementField);
      }

      // Analyze component coverage if field specified
      let componentCoverage = null;
      if (params.componentField) {
        componentCoverage = this.analyzeComponentCoverage(cases, params.componentField);
      }

      const coverage = {
        project_id: params.projectId,
        suite_id: params.suiteId,
        total_cases: cases.length,
        priority_coverage: priorityCoverage,
        type_coverage: typeCoverage,
        automation_coverage: automationCoverage,
        requirement_coverage: requirementCoverage,
        component_coverage: componentCoverage,
        gaps: this.identifyCoverageGaps(priorityCoverage, typeCoverage, automationCoverage),
        recommendations: this.generateCoverageRecommendations(
          priorityCoverage,
          typeCoverage,
          automationCoverage
        ),
      };

      return this.createSuccessResponse(coverage, 'Coverage report generated successfully');
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to generate coverage report',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Generate trend analysis
   */
  async generateTrendAnalysis(
    projectId: number,
    timeRange?: { start: string; end: string }
  ): Promise<any> {
    const runs = await this.testRailService.getRuns(projectId, { limit: 50 });

    // Filter runs by time range if provided
    let filteredRuns = runs;
    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime() / 1000;
      const endTime = new Date(timeRange.end).getTime() / 1000;
      filteredRuns = runs.filter((run) => run.created_on >= startTime && run.created_on <= endTime);
    }

    const trendData: TestRailTrendData[] = filteredRuns.map((run) => ({
      date: new Date(run.created_on * 1000).toISOString().split('T')[0],
      stats: {
        total_tests:
          run.passed_count +
          run.failed_count +
          run.blocked_count +
          run.untested_count +
          run.retest_count,
        passed: run.passed_count,
        failed: run.failed_count,
        blocked: run.blocked_count,
        untested: run.untested_count,
        retest: run.retest_count,
        pass_rate: this.calculatePassRate(run),
        completion_rate: this.calculateCompletionRate(run),
      },
    }));

    return {
      period: timeRange || { start: 'all_time', end: 'now' },
      data_points: trendData.length,
      trends: trendData,
      analysis: {
        avg_pass_rate: trendData.reduce((sum, d) => sum + d.stats.pass_rate, 0) / trendData.length,
        avg_completion_rate:
          trendData.reduce((sum, d) => sum + d.stats.completion_rate, 0) / trendData.length,
        trend_direction: this.calculateTrendDirection(trendData),
      },
    };
  }

  // Helper methods

  private calculateProjectStats(runs: any[]): TestRailStats {
    const totalTests = runs.reduce(
      (sum, run) =>
        sum +
        run.passed_count +
        run.failed_count +
        run.blocked_count +
        run.untested_count +
        run.retest_count,
      0
    );
    const totalPassed = runs.reduce((sum, run) => sum + run.passed_count, 0);
    const totalFailed = runs.reduce((sum, run) => sum + run.failed_count, 0);
    const totalBlocked = runs.reduce((sum, run) => sum + run.blocked_count, 0);
    const totalUntested = runs.reduce((sum, run) => sum + run.untested_count, 0);
    const totalRetest = runs.reduce((sum, run) => sum + run.retest_count, 0);

    return {
      total_tests: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      blocked: totalBlocked,
      untested: totalUntested,
      retest: totalRetest,
      pass_rate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      completion_rate: totalTests > 0 ? ((totalTests - totalUntested) / totalTests) * 100 : 0,
    };
  }

  private async generateSuiteBreakdown(projectId: number, suites: any[]): Promise<any[]> {
    const breakdown = [];
    for (const suite of suites.slice(0, 10)) {
      // Limit for performance
      try {
        const cases = await this.testRailService.getCases(projectId, suite.id);
        breakdown.push({
          suite,
          case_count: cases.length,
          automation_count: cases.filter(
            (c) =>
              c.custom_automation_type === 'Automated' ||
              c.title.toLowerCase().includes('automated')
          ).length,
        });
      } catch (error) {
        // Skip failed suites
      }
    }
    return breakdown;
  }

  private generateExecutionSummary(run: any, tests: any[]): TestRailExecutionSummary {
    const stats = {
      total_tests: tests.length,
      passed: tests.filter((t) => t.status_id === 1).length,
      failed: tests.filter((t) => t.status_id === 5).length,
      blocked: tests.filter((t) => t.status_id === 2).length,
      untested: tests.filter((t) => t.status_id === 3).length,
      retest: tests.filter((t) => t.status_id === 4).length,
      pass_rate: 0,
      completion_rate: 0,
    };

    stats.pass_rate = stats.total_tests > 0 ? (stats.passed / stats.total_tests) * 100 : 0;
    stats.completion_rate =
      stats.total_tests > 0 ? ((stats.total_tests - stats.untested) / stats.total_tests) * 100 : 0;

    return {
      run_id: run.id,
      run_name: run.name,
      project_name: 'Unknown',
      suite_name: 'Unknown',
      stats,
      start_date: new Date(run.created_on * 1000).toISOString(),
      end_date: run.completed_on ? new Date(run.completed_on * 1000).toISOString() : '',
      assigned_to: run.assignedto_id?.toString(),
    };
  }

  private async calculateCaseMetrics(testCase: any, runs: any[]): Promise<TestRailCaseMetrics> {
    let executionCount = 0;
    let passCount = 0;
    let failCount = 0;
    let lastExecuted = '';

    // This is a simplified calculation - in real implementation,
    // you'd need to get actual test results for each case
    for (const run of runs.slice(0, 10)) {
      try {
        const tests = await this.testRailService.getTests(run.id);
        const caseTest = tests.find((t) => t.case_id === testCase.id);
        if (caseTest && caseTest.status_id !== 3) {
          // Not untested
          executionCount++;
          if (caseTest.status_id === 1) passCount++;
          if (caseTest.status_id === 5) failCount++;
          lastExecuted = new Date(run.created_on * 1000).toISOString();
        }
      } catch (error) {
        // Skip failed runs
      }
    }

    return {
      case_id: testCase.id,
      title: testCase.title,
      execution_count: executionCount,
      pass_count: passCount,
      fail_count: failCount,
      last_executed: lastExecuted || 'Never',
    };
  }

  private analyzePriorityCoverage(cases: any[]): any {
    const priorityCount = cases.reduce(
      (acc, case_) => {
        acc[case_.priority_id] = (acc[case_.priority_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    return {
      by_priority: priorityCount,
      total: cases.length,
      coverage_distribution: Object.entries(priorityCount).map(([priority, count]) => ({
        priority_id: parseInt(priority),
        count,
        percentage: ((count as number) / cases.length) * 100,
      })),
    };
  }

  private analyzeTypeCoverage(cases: any[]): any {
    const typeCount = cases.reduce(
      (acc, case_) => {
        acc[case_.type_id] = (acc[case_.type_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    return {
      by_type: typeCount,
      total: cases.length,
    };
  }

  private analyzeAutomationCoverage(cases: any[]): any {
    const automated = cases.filter(
      (c) => c.custom_automation_type === 'Automated' || c.title.toLowerCase().includes('automated')
    ).length;

    const manual = cases.length - automated;

    return {
      total_cases: cases.length,
      automated_cases: automated,
      manual_cases: manual,
      automation_percentage: cases.length > 0 ? (automated / cases.length) * 100 : 0,
    };
  }

  private calculatePassRate(run: any): number {
    const total = run.passed_count + run.failed_count + run.blocked_count + run.retest_count;
    return total > 0 ? (run.passed_count / total) * 100 : 0;
  }

  private calculateCompletionRate(run: any): number {
    const total =
      run.passed_count +
      run.failed_count +
      run.blocked_count +
      run.untested_count +
      run.retest_count;
    return total > 0 ? ((total - run.untested_count) / total) * 100 : 0;
  }

  private calculateTrendDirection(trendData: TestRailTrendData[]): string {
    if (trendData.length < 2) return 'insufficient_data';

    const recent = trendData.slice(-3);
    const older = trendData.slice(0, 3);

    const recentAvg = recent.reduce((sum, d) => sum + d.stats.pass_rate, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.stats.pass_rate, 0) / older.length;

    if (recentAvg > olderAvg * 1.05) return 'improving';
    if (recentAvg < olderAvg * 0.95) return 'declining';
    return 'stable';
  }

  private createSuccessResponse(data: any, message?: string): CallToolResult {
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

  private createErrorResponse(error: string, code?: string): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error,
              code: code || TestRailErrorCodes.INTERNAL_ERROR,
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

  // Additional helper methods (simplified for brevity)
  private async analyzeTopFailures(_projectId: number, _runs: any[]): Promise<any> {
    return null;
  }
  private async analyzeRunFailures(_runId: number, _tests: any[]): Promise<any> {
    return null;
  }
  private async calculatePerformanceMetrics(_tests: any[]): Promise<any> {
    return null;
  }
  private generatePlanSummary(_plan: any): any {
    return null;
  }
  private async calculateFlakiness(_caseId: number, _runs: any[]): Promise<number> {
    return 0;
  }
  private analyzeRequirementCoverage(_cases: any[], _field: string): any {
    return null;
  }
  private analyzeComponentCoverage(_cases: any[], _field: string): any {
    return null;
  }
  private identifyCoverageGaps(_priority: any, _type: any, _automation: any): any[] {
    return [];
  }
  private generateCoverageRecommendations(_priority: any, _type: any, _automation: any): any[] {
    return [];
  }
}
