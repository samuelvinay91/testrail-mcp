/**
 * AutoSpectra-TestRail Integration Examples
 * Demonstrates how to integrate TestRail with AutoSpectra test execution
 */

import { AutoSpectraBridge, AutoSpectraTestResult, AutoSpectraTestSuite } from './autospectra-bridge';

/**
 * Example 1: Basic Test Result Submission
 */
export async function basicIntegrationExample() {
  const bridge = new AutoSpectraBridge();

  // Step 1: Connect to TestRail
  const connected = await bridge.connect({
    baseUrl: 'https://yourcompany.testrail.io',
    username: 'automation@company.com',
    apiKey: 'your-api-key',
    projectId: 1
  });

  if (!connected) {
    throw new Error('Failed to connect to TestRail');
  }

  // Step 2: Prepare AutoSpectra test results
  const autoSpectraResults: AutoSpectraTestResult[] = [
    {
      testId: 'login-001',
      title: 'User can login with valid credentials',
      status: 'passed',
      duration: 2500,
      metadata: {
        framework: 'Playwright',
        browser: 'Chrome',
        environment: 'staging',
        buildNumber: 'v1.2.3-build.456',
        branch: 'main',
        commit: 'abc123def'
      }
    },
    {
      testId: 'login-002',
      title: 'User cannot login with invalid credentials',
      status: 'failed',
      duration: 1800,
      error: 'Expected error message not displayed',
      screenshots: ['login-failed-1.png'],
      logs: ['browser.log'],
      metadata: {
        framework: 'Playwright',
        browser: 'Chrome',
        environment: 'staging',
        buildNumber: 'v1.2.3-build.456'
      }
    }
  ];

  const testSuite: AutoSpectraTestSuite = {
    suiteId: 'login-suite-001',
    name: 'Login Functionality Tests',
    results: autoSpectraResults,
    summary: {
      total: 2,
      passed: 1,
      failed: 1,
      skipped: 0,
      blocked: 0,
      duration: 4300
    }
  };

  // Step 3: Auto-sync with TestRail
  const syncResult = await bridge.autoSync(1, testSuite, {
    createCasesIfMissing: true,
    milestoneId: 15,
    environment: 'staging',
    buildNumber: 'v1.2.3-build.456'
  });

  console.log('Integration Result:', syncResult);
  return syncResult;
}

/**
 * Example 2: CI/CD Pipeline Integration
 */
export class CIPipelineIntegration {
  private bridge: AutoSpectraBridge;
  private projectId: number;

  constructor(projectId: number) {
    this.bridge = new AutoSpectraBridge();
    this.projectId = projectId;
  }

  async initializeForPipeline(): Promise<boolean> {
    const config = {
      baseUrl: process.env.TESTRAIL_URL || '',
      username: process.env.TESTRAIL_USERNAME || '',
      apiKey: process.env.TESTRAIL_API_KEY || '',
      projectId: this.projectId
    };

    return await this.bridge.connect(config);
  }

  async processTestResults(
    _testResultsPath: string,
    buildInfo: {
      buildNumber: string;
      branch: string;
      commit: string;
      environment: string;
    }
  ): Promise<void> {
    // This would normally read from AutoSpectra test output files
    const mockResults = this.loadMockResults(buildInfo);

    for (const suite of mockResults) {
      const result = await this.bridge.autoSync(this.projectId, suite, {
        createCasesIfMissing: true,
        environment: buildInfo.environment,
        buildNumber: buildInfo.buildNumber
      });

      if (result.success) {
        console.log(`✅ Suite ${suite.name}: Run ${result.runId} created with ${result.submittedResults} results`);
      } else {
        console.error(`❌ Suite ${suite.name} failed:`, result.errors);
      }
    }
  }

  private loadMockResults(buildInfo: any): AutoSpectraTestSuite[] {
    // Mock implementation - would normally parse AutoSpectra output files
    return [
      {
        suiteId: 'smoke-tests',
        name: `Smoke Tests - Build ${buildInfo.buildNumber}`,
        results: [
          {
            testId: 'smoke-001',
            title: 'Application loads successfully',
            status: 'passed',
            duration: 1500,
            metadata: buildInfo
          },
          {
            testId: 'smoke-002',
            title: 'API health check passes',
            status: 'passed',
            duration: 800,
            metadata: buildInfo
          }
        ],
        summary: { total: 2, passed: 2, failed: 0, skipped: 0, blocked: 0, duration: 2300 }
      }
    ];
  }
}

/**
 * Example 3: Real-time Test Execution Monitoring
 */
export class RealTimeMonitor {
  private bridge: AutoSpectraBridge;

  constructor() {
    this.bridge = new AutoSpectraBridge();
  }

  async startMonitoring(projectId: number): Promise<void> {
    const connected = await this.bridge.connect({
      baseUrl: process.env.TESTRAIL_URL || '',
      username: process.env.TESTRAIL_USERNAME || '',
      apiKey: process.env.TESTRAIL_API_KEY || '',
      projectId
    });

    if (!connected) {
      throw new Error('Failed to connect to TestRail for monitoring');
    }

    // Simulate real-time test execution monitoring
    this.simulateTestExecution(projectId);
  }

  private async simulateTestExecution(projectId: number): Promise<void> {
    // Simulate AutoSpectra tests running in real-time
    const testScenarios = [
      { id: 'e2e-001', title: 'Complete user journey', duration: 15000 },
      { id: 'api-001', title: 'API integration test', duration: 5000 },
      { id: 'ui-001', title: 'UI component test', duration: 3000 }
    ];

    for (const scenario of testScenarios) {
      console.log(`🏃 Starting test: ${scenario.title}`);
      
      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, Math.min(scenario.duration, 2000)));
      
      // Simulate random result
      const status = Math.random() > 0.2 ? 'passed' : 'failed';
      
      const result: AutoSpectraTestResult = {
        testId: scenario.id,
        title: scenario.title,
        status: status as any,
        duration: scenario.duration,
        ...(status === 'failed' && { error: 'Simulated test failure' }),
        metadata: {
          framework: 'AutoSpectra',
          environment: 'staging',
          buildNumber: 'live-test'
        }
      };

      // Submit individual result
      await this.submitIndividualResult(projectId, result);
      
      console.log(`${status === 'passed' ? '✅' : '❌'} Test completed: ${scenario.title} (${status})`);
    }
  }

  private async submitIndividualResult(
    projectId: number,
    result: AutoSpectraTestResult
  ): Promise<void> {
    const suite: AutoSpectraTestSuite = {
      suiteId: 'live-monitoring',
      name: 'Live Test Monitoring',
      results: [result],
      summary: {
        total: 1,
        passed: result.status === 'passed' ? 1 : 0,
        failed: result.status === 'failed' ? 1 : 0,
        skipped: result.status === 'skipped' ? 1 : 0,
        blocked: result.status === 'blocked' ? 1 : 0,
        duration: result.duration || 0
      }
    };

    await this.bridge.autoSync(projectId, suite, {
      createCasesIfMissing: true,
      environment: 'live-monitoring'
    });
  }
}

/**
 * Example 4: Advanced Dashboard Generation
 */
export async function generateAdvancedDashboard(projectId: number): Promise<any> {
  const bridge = new AutoSpectraBridge();
  
  const connected = await bridge.connect({
    baseUrl: process.env.TESTRAIL_URL || '',
    username: process.env.TESTRAIL_USERNAME || '',
    apiKey: process.env.TESTRAIL_API_KEY || '',
    projectId
  });

  if (!connected) {
    throw new Error('Failed to connect to TestRail');
  }

  // Generate dashboard for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dashboard = await bridge.generateDashboard(projectId, {
    start: thirtyDaysAgo.toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  return dashboard;
}

/**
 * Utility Functions for Integration
 */
export class IntegrationUtils {
  /**
   * Convert AutoSpectra test output to TestRail format
   */
  static convertAutoSpectraOutput(autoSpectraJson: any): AutoSpectraTestSuite {
    // This would parse actual AutoSpectra output format
    return {
      suiteId: autoSpectraJson.suiteId || 'unknown',
      name: autoSpectraJson.name || 'AutoSpectra Test Suite',
      results: autoSpectraJson.tests?.map((test: any) => ({
        testId: test.id,
        title: test.title,
        status: test.status,
        duration: test.duration,
        error: test.error,
        screenshots: test.attachments?.screenshots || [],
        logs: test.attachments?.logs || [],
        metadata: test.metadata
      })) || [],
      summary: autoSpectraJson.summary || {
        total: 0, passed: 0, failed: 0, skipped: 0, blocked: 0, duration: 0
      }
    };
  }

  /**
   * Generate case mapping from configuration
   */
  static generateCaseMapping(config: {
    [autoSpectraTestId: string]: number; // TestRail case ID
  }): Map<string, number> {
    return new Map(Object.entries(config));
  }

  /**
   * Validate TestRail connection
   */
  static async validateConnection(config: {
    baseUrl: string;
    username: string;
    apiKey: string;
    projectId: number;
  }): Promise<boolean> {
    const bridge = new AutoSpectraBridge();
    return await bridge.connect(config);
  }
}

// Export main integration bridge for external use
export { AutoSpectraBridge };

// Example configuration for easy setup
export const DEFAULT_CONFIG = {
  testrail: {
    baseUrl: process.env.TESTRAIL_URL || '',
    username: process.env.TESTRAIL_USERNAME || '',
    apiKey: process.env.TESTRAIL_API_KEY || ''
  },
  autospectra: {
    outputPath: process.env.AUTOSPECTRA_OUTPUT_PATH || './test-results',
    environment: process.env.TEST_ENVIRONMENT || 'development'
  },
  integration: {
    autoCreateCases: true,
    autoClosureRuns: true,
    enableDashboard: true,
    retryFailedUploads: 3
  }
};