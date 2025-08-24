/**
 * AutoSpectra Integration Bridge
 * Connects TestRail MCP Server with AutoSpectra Framework
 */

import { TestRailMCPTools } from '../tools/testrail-tools';

export interface AutoSpectraTestResult {
  testId: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'blocked';
  duration?: number;
  error?: string;
  screenshots?: string[];
  logs?: string[];
  metadata?: {
    framework?: string;
    browser?: string;
    environment?: string;
    buildNumber?: string;
    branch?: string;
    commit?: string;
  };
}

export interface AutoSpectraTestSuite {
  suiteId: string;
  name: string;
  results: AutoSpectraTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    blocked: number;
    duration: number;
  };
}

export class AutoSpectraBridge {
  private testRailTools: TestRailMCPTools;
  private isConnected: boolean = false;
  private runMapping: Map<string, number> = new Map(); // AutoSpectra suite ID -> TestRail run ID

  constructor() {
    this.testRailTools = new TestRailMCPTools();
  }

  /**
   * Initialize connection to TestRail
   */
  async connect(config: {
    baseUrl: string;
    username: string;
    apiKey: string;
    projectId: number;
  }): Promise<boolean> {
    try {
      await this.testRailTools.connectTestRail({
        baseUrl: config.baseUrl,
        username: config.username,
        apiKey: config.apiKey
      });

      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Create TestRail run from AutoSpectra test suite
   */
  async createRunFromSuite(
    projectId: number,
    suite: AutoSpectraTestSuite,
    options?: {
      milestoneId?: number;
      assignedToId?: number;
      environment?: string;
      buildNumber?: string;
    }
  ): Promise<number | null> {
    if (!this.isConnected) {
      throw new Error('TestRail connection not established');
    }

    try {
      const runName = `AutoSpectra - ${suite.name} - ${new Date().toISOString().split('T')[0]}`;
      const description = this.buildRunDescription(suite, options);

      const result = await this.testRailTools.createRun({
        projectId,
        name: runName,
        description,
        ...(options?.milestoneId && { milestoneId: options.milestoneId }),
        ...(options?.assignedToId && { assignedToId: options.assignedToId }),
        includeAll: true // Include all cases for now
      });

      if (result.content && result.content[0]) {
        const response = JSON.parse(result.content[0].text as string);
        if (response.success && response.data.run) {
          const runId = response.data.run.id;
          this.runMapping.set(suite.suiteId, runId);
          return runId;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Submit AutoSpectra test results to TestRail
   */
  async submitResults(
    suite: AutoSpectraTestSuite,
    caseMapping: Map<string, number>, // AutoSpectra test ID -> TestRail case ID
    options?: {
      closeRun?: boolean;
      addDefects?: boolean;
    }
  ): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('TestRail connection not established');
    }

    const runId = this.runMapping.get(suite.suiteId);
    if (!runId) {
      throw new Error(`No TestRail run found for suite ${suite.suiteId}`);
    }

    try {
      const results = suite.results
        .filter(result => caseMapping.has(result.testId))
        .map(result => ({
          caseId: caseMapping.get(result.testId)!,
          statusId: this.mapAutoSpectraStatus(result.status),
          comment: this.buildResultComment(result),
          elapsed: result.duration ? this.formatDuration(result.duration) : undefined,
          version: result.metadata?.buildNumber,
          defects: result.status === 'failed' && options?.addDefects 
            ? `AUTO-${result.testId}-${Date.now()}` 
            : undefined
        }));

      if (results.length === 0) {
        return true; // No results to submit
      }

      await this.testRailTools.addBulkResults({
        runId,
        results: results.map(result => ({
          caseId: result.caseId,
          statusId: result.statusId,
          comment: result.comment,
          ...(result.elapsed && { elapsed: result.elapsed }),
          ...(result.version && { version: result.version }),
          ...(result.defects && { defects: result.defects })
        }))
      });

      // Close run if requested
      if (options?.closeRun) {
        await this.testRailTools.closeRun({ runId });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Auto-sync AutoSpectra execution with TestRail
   */
  async autoSync(
    projectId: number,
    suite: AutoSpectraTestSuite,
    options?: {
      createCasesIfMissing?: boolean;
      milestoneId?: number;
      environment?: string;
      buildNumber?: string;
    }
  ): Promise<{
    success: boolean;
    runId?: number;
    createdCases?: number;
    submittedResults?: number;
    errors?: string[];
  }> {
    const result: {
      success: boolean;
      runId?: number;
      createdCases?: number;
      submittedResults?: number;
      errors?: string[];
    } = {
      success: false,
      createdCases: 0,
      submittedResults: 0,
      errors: [] as string[]
    };

    try {
      // Step 1: Get or create TestRail cases
      const caseMapping = new Map<string, number>();
      
      if (options?.createCasesIfMissing) {
        // Auto-create missing test cases
        for (const testResult of suite.results) {
          const caseId = await this.getOrCreateCase(projectId, testResult);
          if (caseId) {
            caseMapping.set(testResult.testId, caseId);
            if (caseId > 0) result.createdCases = (result.createdCases || 0) + 1;
          }
        }
      }

      // Step 2: Create test run
      const runId = await this.createRunFromSuite(projectId, suite, {
        ...(options?.milestoneId && { milestoneId: options.milestoneId }),
        ...(options?.environment && { environment: options.environment }),
        ...(options?.buildNumber && { buildNumber: options.buildNumber })
      });

      if (!runId) {
        (result.errors || []).push('Failed to create TestRail run');
        return result;
      }

      result.runId = runId;

      // Step 3: Submit results
      const submitSuccess = await this.submitResults(suite, caseMapping, {
        closeRun: true,
        addDefects: true
      });

      if (submitSuccess) {
        result.submittedResults = suite.results.length;
        result.success = true;
      } else {
        (result.errors || []).push('Failed to submit test results');
      }

      return result;
    } catch (error) {
      (result.errors || []).push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Generate TestRail dashboard for AutoSpectra project
   */
  async generateDashboard(
    projectId: number,
    timeRange?: { start: string; end: string }
  ): Promise<any> {
    if (!this.isConnected) {
      throw new Error('TestRail connection not established');
    }

    try {
      const result = await this.testRailTools.generateProjectDashboard({
        projectId,
        timeRange,
        includeMetrics: true,
        includeTrends: true,
        includeTopFailures: true
      });

      if (result.content && result.content[0]) {
        const response = JSON.parse(result.content[0].text as string);
        if (response.success) {
          return response.data;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Helper methods

  private buildRunDescription(
    suite: AutoSpectraTestSuite,
    options?: any
  ): string {
    let description = `AutoSpectra Test Execution - ${suite.name}\n\n`;
    description += `Summary:\n`;
    description += `- Total Tests: ${suite.summary.total}\n`;
    description += `- Passed: ${suite.summary.passed}\n`;
    description += `- Failed: ${suite.summary.failed}\n`;
    description += `- Skipped: ${suite.summary.skipped}\n`;
    description += `- Duration: ${this.formatDuration(suite.summary.duration)}\n\n`;

    if (options?.environment) {
      description += `Environment: ${options.environment}\n`;
    }
    if (options?.buildNumber) {
      description += `Build: ${options.buildNumber}\n`;
    }

    description += `Generated by AutoSpectra Bridge at ${new Date().toISOString()}`;

    return description;
  }

  private mapAutoSpectraStatus(status: string): number {
    switch (status.toLowerCase()) {
      case 'passed': return 1;
      case 'failed': return 5;
      case 'skipped': return 2;
      case 'blocked': return 2;
      default: return 3; // Untested
    }
  }

  private buildResultComment(result: AutoSpectraTestResult): string {
    let comment = `AutoSpectra Test Result: ${result.status.toUpperCase()}\n\n`;
    
    if (result.error) {
      comment += `Error: ${result.error}\n\n`;
    }
    
    if (result.metadata) {
      comment += `Execution Details:\n`;
      if (result.metadata.framework) comment += `- Framework: ${result.metadata.framework}\n`;
      if (result.metadata.browser) comment += `- Browser: ${result.metadata.browser}\n`;
      if (result.metadata.environment) comment += `- Environment: ${result.metadata.environment}\n`;
      if (result.metadata.buildNumber) comment += `- Build: ${result.metadata.buildNumber}\n`;
      if (result.metadata.branch) comment += `- Branch: ${result.metadata.branch}\n`;
      if (result.metadata.commit) comment += `- Commit: ${result.metadata.commit}\n`;
    }
    
    if (result.screenshots && result.screenshots.length > 0) {
      comment += `\nScreenshots: ${result.screenshots.length} captured`;
    }
    
    if (result.logs && result.logs.length > 0) {
      comment += `\nLogs: ${result.logs.length} files available`;
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

  private async getOrCreateCase(
    projectId: number,
    testResult: AutoSpectraTestResult
  ): Promise<number | null> {
    try {
      // First, try to find existing case by title
      const existingCases = await this.testRailTools.getCases({
        projectId,
        limit: 1000
      });

      if (existingCases.content && existingCases.content[0]) {
        const response = JSON.parse(existingCases.content[0].text as string);
        if (response.success && response.data.cases) {
          const existingCase = response.data.cases.find((c: any) => 
            c.title.toLowerCase() === testResult.title.toLowerCase()
          );
          if (existingCase) {
            return existingCase.id;
          }
        }
      }

      // Create new case if not found
      const createResult = await this.testRailTools.createCase({
        sectionId: 1, // Default section - would need to be configured
        title: testResult.title,
        typeId: 6, // Functional test
        priorityId: 2, // Medium priority
        refs: testResult.testId,
        steps: `Automated test: ${testResult.testId}`,
        expectedResult: 'Test should pass without errors',
        customFields: {
          custom_automation_type: 'Automated',
          custom_test_framework: testResult.metadata?.framework || 'AutoSpectra'
        }
      });

      if (createResult.content && createResult.content[0]) {
        const response = JSON.parse(createResult.content[0].text as string);
        if (response.success && response.data.case) {
          return response.data.case.id;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get run mapping for debugging
   */
  getRunMapping(): Map<string, number> {
    return this.runMapping;
  }

  /**
   * Clear run mapping
   */
  clearRunMapping(): void {
    this.runMapping.clear();
  }

  /**
   * Check connection status
   */
  isConnectedToTestRail(): boolean {
    return this.isConnected;
  }
}