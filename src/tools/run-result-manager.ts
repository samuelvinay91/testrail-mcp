/**
 * Advanced TestRail Run and Result Management Tools
 * Specialized tools for comprehensive test execution management
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { TestRailService } from '../utils/testrail-service';
import {
  TestRailRun,
  TestRailTest,
  TestRailResult,
  TestRailStats,
  TestRailExecutionSummary,
  TestRailErrorCodes,
  CreateTestRailRun
} from '../types';

export class TestRunResultManager {
  private testRailService: TestRailService;

  constructor(testRailService: TestRailService) {
    this.testRailService = testRailService;
  }

  /**
   * Create a comprehensive test run with advanced options
   */
  async createAdvancedRun(params: {
    projectId: number;
    name: string;
    description?: string;
    suiteId?: number;
    milestoneId?: number;
    assignedToId?: number;
    includeAll?: boolean;
    caseIds?: number[];
    configIds?: number[];
    tags?: string[];
    environment?: string;
    buildVersion?: string;
    testPlan?: {
      planId?: number;
      entryName?: string;
    };
  }): Promise<CallToolResult> {
    try {
      // Prepare run data
      const runData: CreateTestRailRun = {
        name: params.name,
        description: this.buildRunDescription(params),
        ...(params.milestoneId && { milestone_id: params.milestoneId }),
        ...(params.assignedToId && { assignedto_id: params.assignedToId }),
        include_all: params.includeAll ?? true,
        ...(params.caseIds && { case_ids: params.caseIds }),
        ...(params.configIds && { config_ids: params.configIds })
      };

      // Create the run
      const run = await this.testRailService.addRun(params.projectId, runData);

      // Get initial test count and statistics
      const tests = await this.testRailService.getTests(run.id);
      const stats = this.calculateRunStats(run);

      return this.createSuccessResponse({
        run,
        tests: {
          total: tests.length,
          untested: tests.filter(t => t.status_id === 3).length,
          summary: stats
        },
        metadata: {
          environment: params.environment,
          buildVersion: params.buildVersion,
          tags: params.tags
        }
      }, 'Advanced test run created successfully');

    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create test run',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Execute automated test results submission
   */
  async submitAutomationResults(params: {
    runId: number;
    results: Array<{
      caseId?: number;
      testId?: number;
      status: 'passed' | 'failed' | 'skipped' | 'blocked';
      comment?: string;
      duration?: number;
      errorMessage?: string;
      stackTrace?: string;
      screenshots?: string[];
      logs?: string[];
      automationTool?: string;
      buildNumber?: string;
      environment?: string;
    }>;
    executionMetadata?: {
      startTime: string;
      endTime: string;
      executor: string;
      environment: string;
      buildNumber?: string;
      branch?: string;
      commit?: string;
    };
  }): Promise<CallToolResult> {
    try {
      const processedResults = params.results.map(result => {
        const statusId = this.mapAutomationStatus(result.status);
        const comment = this.buildAutomationComment(result, params.executionMetadata);
        const elapsed = result.duration ? this.formatDuration(result.duration) : undefined;

        const testResult: any = {
          status_id: statusId,
          comment,
          elapsed,
          version: params.executionMetadata?.buildNumber,
          custom_automation_status: result.status,
          custom_automation_tool: result.automationTool,
          custom_environment: result.environment || params.executionMetadata?.environment
        };

        if (result.testId) {
          testResult.test_id = result.testId;
        } else if (result.caseId) {
          testResult.case_id = result.caseId;
        }

        return testResult;
      });

      // Submit results in batches
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < processedResults.length; i += batchSize) {
        batches.push(processedResults.slice(i, i + batchSize));
      }

      const allResults = [];
      for (const batch of batches) {
        const hasTestIds = batch.some(r => r.test_id);
        const hasCaseIds = batch.some(r => r.case_id);

        let batchResults;
        if (hasTestIds && !hasCaseIds) {
          batchResults = await this.testRailService.addResults(params.runId, batch);
        } else if (hasCaseIds && !hasTestIds) {
          batchResults = await this.testRailService.addResultsForCases(params.runId, batch);
        } else {
          throw new Error('Mixed test IDs and case IDs not supported in batch');
        }

        allResults.push(...batchResults);
      }

      // Calculate execution summary
      const summary = this.calculateExecutionSummary(allResults, params.executionMetadata);

      return this.createSuccessResponse({
        submitted: allResults.length,
        batches: batches.length,
        summary,
        metadata: params.executionMetadata
      }, `Successfully submitted ${allResults.length} automation results`);

    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to submit automation results',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Bulk update test run status and results
   */
  async bulkUpdateRunResults(params: {
    runId: number;
    operations: Array<{
      type: 'update_test' | 'add_result' | 'update_run';
      testId?: number;
      caseId?: number;
      data: any;
    }>;
    closeRun?: boolean;
  }): Promise<CallToolResult> {
    try {
      const results = {
        updated: 0,
        failed: 0,
        errors: [] as Array<{ operation: number; error: string }>
      };

      // Process each operation
      for (let i = 0; i < params.operations.length; i++) {
        const operation = params.operations[i];
        try {
          switch (operation.type) {
            case 'add_result':
              if (operation.testId) {
                await this.testRailService.addResult(operation.testId, operation.data);
              } else if (operation.caseId) {
                await this.testRailService.addResultForCase(params.runId, operation.caseId, operation.data);
              }
              results.updated++;
              break;

            case 'update_run':
              await this.testRailService.updateRun(params.runId, operation.data);
              results.updated++;
              break;

            default:
              throw new Error(`Unsupported operation type: ${operation.type}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            operation: i,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Close run if requested
      if (params.closeRun) {
        try {
          await this.testRailService.closeRun(params.runId);
        } catch (error) {
          results.errors.push({
            operation: -1,
            error: `Failed to close run: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      return this.createSuccessResponse({
        runId: params.runId,
        results,
        closed: params.closeRun
      }, `Bulk update completed: ${results.updated} successful, ${results.failed} failed`);

    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Bulk update failed',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Generate comprehensive run execution report
   */
  async generateExecutionReport(params: {
    runId: number;
    includeDetails?: boolean;
    includeTimeline?: boolean;
    format?: 'summary' | 'detailed' | 'executive';
  }): Promise<CallToolResult> {
    try {
      // Get run details
      const run = await this.testRailService.getRun(params.runId);
      const tests = await this.testRailService.getTests(params.runId);
      
      // Get results for detailed analysis
      const allResults = [];
      if (params.includeDetails) {
        for (const test of tests) {
          try {
            const results = await this.testRailService.getResults(test.id, { limit: 10 });
            allResults.push(...results.map(r => ({ ...r, test_title: test.title })));
          } catch (error) {
            // Continue if we can't get results for a specific test
          }
        }
      }

      const stats = this.calculateRunStats(run);
      const timeline = params.includeTimeline ? this.generateExecutionTimeline(allResults) : undefined;

      const report = {
        run: {
          id: run.id,
          name: run.name,
          description: run.description,
          project_id: run.project_id,
          suite_id: run.suite_id,
          is_completed: run.is_completed,
          created_on: new Date(run.created_on * 1000).toISOString(),
          completed_on: run.completed_on ? new Date(run.completed_on * 1000).toISOString() : null
        },
        statistics: stats,
        tests: {
          total: tests.length,
          by_status: this.groupTestsByStatus(tests),
          by_priority: this.groupTestsByPriority(tests)
        },
        timeline,
        details: params.includeDetails ? {
          recent_results: allResults.slice(0, 50),
          failure_analysis: this.analyzeFailures(allResults)
        } : undefined,
        generated_at: new Date().toISOString()
      };

      return this.createSuccessResponse(report, 'Execution report generated successfully');

    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to generate execution report',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Compare runs for regression analysis
   */
  async compareRuns(params: {
    baselineRunId: number;
    currentRunId: number;
    includeNewTests?: boolean;
    includeMissingTests?: boolean;
  }): Promise<CallToolResult> {
    try {
      const [baselineRun, currentRun] = await Promise.all([
        this.testRailService.getRun(params.baselineRunId),
        this.testRailService.getRun(params.currentRunId)
      ]);

      const [baselineTests, currentTests] = await Promise.all([
        this.testRailService.getTests(params.baselineRunId),
        this.testRailService.getTests(params.currentRunId)
      ]);

      const comparison = this.performRunComparison(
        baselineTests,
        currentTests,
        params.includeNewTests,
        params.includeMissingTests
      );

      const analysis = {
        baseline: {
          run: baselineRun,
          stats: this.calculateRunStats(baselineRun)
        },
        current: {
          run: currentRun,
          stats: this.calculateRunStats(currentRun)
        },
        comparison,
        regression_indicators: this.detectRegressions(comparison),
        improvement_indicators: this.detectImprovements(comparison)
      };

      return this.createSuccessResponse(analysis, 'Run comparison completed successfully');

    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to compare runs',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // Helper methods

  private buildRunDescription(params: any): string {
    let description = params.description || '';
    
    if (params.environment) {
      description += `\nEnvironment: ${params.environment}`;
    }
    if (params.buildVersion) {
      description += `\nBuild Version: ${params.buildVersion}`;
    }
    if (params.tags && params.tags.length > 0) {
      description += `\nTags: ${params.tags.join(', ')}`;
    }
    
    return description.trim();
  }

  private mapAutomationStatus(status: string): number {
    switch (status.toLowerCase()) {
      case 'passed': return 1;
      case 'failed': return 5;
      case 'skipped': return 2;
      case 'blocked': return 2;
      default: return 3; // Untested
    }
  }

  private buildAutomationComment(result: any, metadata?: any): string {
    let comment = result.comment || `Automated test ${result.status}`;
    
    if (result.errorMessage) {
      comment += `\n\nError: ${result.errorMessage}`;
    }
    
    if (result.automationTool) {
      comment += `\nTool: ${result.automationTool}`;
    }
    
    if (metadata?.executor) {
      comment += `\nExecutor: ${metadata.executor}`;
    }
    
    if (result.screenshots && result.screenshots.length > 0) {
      comment += `\nScreenshots: ${result.screenshots.length} files`;
    }
    
    if (result.logs && result.logs.length > 0) {
      comment += `\nLogs: ${result.logs.length} files`;
    }
    
    return comment;
  }

  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  private calculateRunStats(run: TestRailRun): TestRailStats {
    const total = run.passed_count + run.failed_count + run.blocked_count + 
                 run.untested_count + run.retest_count;
    
    return {
      total_tests: total,
      passed: run.passed_count,
      failed: run.failed_count,
      blocked: run.blocked_count,
      untested: run.untested_count,
      retest: run.retest_count,
      pass_rate: total > 0 ? (run.passed_count / total) * 100 : 0,
      completion_rate: total > 0 ? ((total - run.untested_count) / total) * 100 : 0
    };
  }

  private calculateExecutionSummary(results: TestRailResult[], metadata?: any): TestRailExecutionSummary {
    const statusCounts = results.reduce((acc, result) => {
      acc[result.status_id] = (acc[result.status_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      run_id: results[0]?.test_id || 0,
      run_name: metadata?.runName || 'Automation Run',
      project_name: metadata?.projectName || 'Unknown',
      suite_name: metadata?.suiteName || 'Unknown',
      stats: {
        total_tests: results.length,
        passed: statusCounts[1] || 0,
        failed: statusCounts[5] || 0,
        blocked: statusCounts[2] || 0,
        untested: statusCounts[3] || 0,
        retest: statusCounts[4] || 0,
        pass_rate: results.length > 0 ? ((statusCounts[1] || 0) / results.length) * 100 : 0,
        completion_rate: 100
      },
      start_date: metadata?.startTime || new Date().toISOString(),
      end_date: metadata?.endTime || new Date().toISOString(),
      duration: metadata?.duration,
      assigned_to: metadata?.executor
    };
  }

  private generateExecutionTimeline(results: TestRailResult[]): any[] {
    const timeline = results
      .sort((a, b) => a.created_on - b.created_on)
      .map(result => ({
        timestamp: new Date(result.created_on * 1000).toISOString(),
        test_id: result.test_id,
        status: result.status_id,
        comment: result.comment?.substring(0, 100)
      }));

    return timeline.slice(0, 100); // Limit to last 100 entries
  }

  private groupTestsByStatus(tests: TestRailTest[]): Record<number, number> {
    return tests.reduce((acc, test) => {
      acc[test.status_id] = (acc[test.status_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private groupTestsByPriority(tests: TestRailTest[]): Record<number, number> {
    return tests.reduce((acc, test) => {
      acc[test.priority_id] = (acc[test.priority_id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private analyzeFailures(results: TestRailResult[]): any {
    const failures = results.filter(r => r.status_id === 5);
    
    return {
      total_failures: failures.length,
      common_error_patterns: this.findCommonErrorPatterns(failures),
      failure_trend: this.calculateFailureTrend(failures)
    };
  }

  private findCommonErrorPatterns(failures: TestRailResult[]): any[] {
    const patterns = new Map<string, number>();
    
    failures.forEach(failure => {
      if (failure.comment) {
        // Extract error patterns (simplified)
        const errorMatch = failure.comment.match(/Error: (.+?)(\n|$)/);
        if (errorMatch) {
          const error = errorMatch[1].substring(0, 50);
          patterns.set(error, (patterns.get(error) || 0) + 1);
        }
      }
    });

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  private calculateFailureTrend(failures: TestRailResult[]): string {
    if (failures.length < 2) return 'insufficient_data';
    
    const sorted = failures.sort((a, b) => a.created_on - b.created_on);
    const recent = sorted.slice(-Math.floor(sorted.length / 2));
    const older = sorted.slice(0, Math.floor(sorted.length / 2));
    
    const recentRate = recent.length / sorted.length;
    const olderRate = older.length / sorted.length;
    
    if (recentRate > olderRate * 1.2) return 'increasing';
    if (recentRate < olderRate * 0.8) return 'decreasing';
    return 'stable';
  }

  private performRunComparison(
    baselineTests: TestRailTest[],
    currentTests: TestRailTest[],
    includeNew?: boolean,
    includeMissing?: boolean
  ): any {
    const baselineMap = new Map(baselineTests.map(t => [t.case_id, t]));
    const currentMap = new Map(currentTests.map(t => [t.case_id, t]));
    
    const common = [];
    const newTests = [];
    const missingTests = [];
    const statusChanges = [];
    
    // Analyze common tests
    for (const [caseId, currentTest] of currentMap) {
      const baselineTest = baselineMap.get(caseId);
      if (baselineTest) {
        common.push({
          case_id: caseId,
          baseline_status: baselineTest.status_id,
          current_status: currentTest.status_id,
          status_changed: baselineTest.status_id !== currentTest.status_id
        });
        
        if (baselineTest.status_id !== currentTest.status_id) {
          statusChanges.push({
            case_id: caseId,
            from: baselineTest.status_id,
            to: currentTest.status_id,
            is_regression: baselineTest.status_id === 1 && currentTest.status_id === 5
          });
        }
      } else if (includeNew) {
        newTests.push({
          case_id: caseId,
          status: currentTest.status_id
        });
      }
    }
    
    // Find missing tests
    if (includeMissing) {
      for (const [caseId, baselineTest] of baselineMap) {
        if (!currentMap.has(caseId)) {
          missingTests.push({
            case_id: caseId,
            baseline_status: baselineTest.status_id
          });
        }
      }
    }
    
    return {
      common_tests: common.length,
      status_changes: statusChanges,
      new_tests: newTests,
      missing_tests: missingTests,
      regression_count: statusChanges.filter(c => c.is_regression).length
    };
  }

  private detectRegressions(comparison: any): any[] {
    return comparison.status_changes
      .filter((change: any) => change.is_regression)
      .map((change: any) => ({
        case_id: change.case_id,
        type: 'status_regression',
        severity: 'high',
        description: `Test case ${change.case_id} regressed from passed to failed`
      }));
  }

  private detectImprovements(comparison: any): any[] {
    return comparison.status_changes
      .filter((change: any) => change.from === 5 && change.to === 1)
      .map((change: any) => ({
        case_id: change.case_id,
        type: 'status_improvement',
        description: `Test case ${change.case_id} improved from failed to passed`
      }));
  }

  private createSuccessResponse(data: any, message?: string): CallToolResult {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data,
          message: message || 'Operation completed successfully'
        }, null, 2)
      }]
    };
  }

  private createErrorResponse(error: string, code?: string): CallToolResult {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error,
          code: code || TestRailErrorCodes.INTERNAL_ERROR,
          timestamp: new Date().toISOString()
        }, null, 2)
      }],
      isError: true
    };
  }
}