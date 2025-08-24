/**
 * Advanced TestRail MCP Server Examples
 * 
 * This file demonstrates advanced usage patterns and complex workflows
 * for enterprise-level TestRail integration scenarios.
 */

// ============================================================================
// 1. CI/CD PIPELINE INTEGRATION
// ============================================================================

/**
 * GitHub Actions Integration Example
 * This example shows how to integrate TestRail with GitHub Actions
 */
const githubActionsIntegration = {
  // Step 1: Create test run from CI trigger
  createCIRun: {
    tool: "create_run",
    parameters: {
      projectId: 1,
      name: `CI Build ${process.env.GITHUB_RUN_NUMBER} - ${process.env.GITHUB_REF_NAME}`,
      description: `Automated test run from GitHub Actions
        Branch: ${process.env.GITHUB_REF_NAME}
        Commit: ${process.env.GITHUB_SHA}
        Triggered by: ${process.env.GITHUB_ACTOR}
        Workflow: ${process.env.GITHUB_WORKFLOW}`,
      includeAll: false,
      caseIds: [101, 102, 103, 104, 105], // Smoke test cases
      configIds: [1] // CI environment config
    }
  },

  // Step 2: Process test results from multiple test frameworks
  processTestResults: {
    tool: "add_bulk_results",
    parameters: {
      runId: "{{CI_RUN_ID}}", // From step 1
      results: [
        // Jest unit test results
        {
          caseId: 101,
          statusId: 1,
          comment: `Unit Tests - All 45 tests passed
            Coverage: 92.3%
            Duration: 12.5s
            Framework: Jest v29.7.0`,
          version: process.env.GITHUB_SHA?.substring(0, 7),
          elapsed: "12.5s"
        },
        // Cypress e2e test results
        {
          caseId: 102,
          statusId: 1,
          comment: `E2E Tests - Login Flow
            Browser: Chrome 120
            Viewport: 1280x720
            Screenshots: Available in artifacts`,
          version: process.env.GITHUB_SHA?.substring(0, 7),
          elapsed: "2m 15s"
        },
        // API integration test results
        {
          caseId: 103,
          statusId: 5,
          comment: `API Integration Tests - FAILED
            Error: Authentication endpoint returning 500
            Response time: 5.2s (exceeds 2s threshold)
            Environment: staging`,
          version: process.env.GITHUB_SHA?.substring(0, 7),
          elapsed: "45s",
          defects: `GH-${process.env.GITHUB_RUN_NUMBER}-API-FAIL`
        },
        // Performance test results
        {
          caseId: 104,
          statusId: 1,
          comment: `Performance Tests - PASSED
            Load: 100 concurrent users
            Response time p95: 1.2s
            Error rate: 0.02%
            Tool: Artillery`,
          version: process.env.GITHUB_SHA?.substring(0, 7),
          elapsed: "5m 30s"
        },
        // Security scan results
        {
          caseId: 105,
          statusId: 2,
          comment: `Security Scan - BLOCKED
            OWASP ZAP scan could not complete
            Reason: Target environment unreachable
            Will retry on next build`,
          version: process.env.GITHUB_SHA?.substring(0, 7)
        }
      ]
    }
  }
};

/**
 * Jenkins Pipeline Integration Example
 */
const jenkinsPipelineIntegration = {
  // Groovy script for Jenkins Pipeline
  jenkinsScript: `
    pipeline {
      agent any
      
      environment {
        TESTRAIL_PROJECT_ID = '1'
        TESTRAIL_SUITE_ID = '2'
      }
      
      stages {
        stage('Create Test Run') {
          steps {
            script {
              def runData = [
                projectId: env.TESTRAIL_PROJECT_ID as Integer,
                name: "Jenkins Build #\${env.BUILD_NUMBER} - \${env.BRANCH_NAME}",
                description: "Automated Jenkins pipeline execution",
                suiteId: env.TESTRAIL_SUITE_ID as Integer,
                includeAll: true
              ]
              
              // Call TestRail MCP Server
              def createRunResult = sh(
                script: "node testrail-mcp-client.js create_run '\${groovy.json.JsonOutput.toJson(runData)}'",
                returnStdout: true
              ).trim()
              
              def runResponse = readJSON text: createRunResult
              env.TESTRAIL_RUN_ID = runResponse.data.run.id
              
              echo "Created TestRail run: \${env.TESTRAIL_RUN_ID}"
            }
          }
        }
        
        stage('Execute Tests') {
          parallel {
            stage('Unit Tests') {
              steps {
                sh 'npm test'
                publishTestResults testResultsPattern: 'test-results.xml'
              }
            }
            stage('Integration Tests') {
              steps {
                sh 'npm run test:integration'
                publishTestResults testResultsPattern: 'integration-results.xml'
              }
            }
          }
        }
        
        stage('Update TestRail') {
          steps {
            script {
              // Parse test results and update TestRail
              def testResults = readJSON file: 'test-results.json'
              
              def results = testResults.collect { result ->
                [
                  caseId: result.testRailCaseId,
                  statusId: result.passed ? 1 : 5,
                  comment: result.message,
                  version: env.BUILD_NUMBER,
                  elapsed: result.duration
                ]
              }
              
              def bulkResults = [
                runId: env.TESTRAIL_RUN_ID as Integer,
                results: results
              ]
              
              sh "node testrail-mcp-client.js add_bulk_results '\${groovy.json.JsonOutput.toJson(bulkResults)}'"
            }
          }
        }
      }
      
      post {
        always {
          script {
            if (env.TESTRAIL_RUN_ID) {
              // Close the test run
              sh "node testrail-mcp-client.js close_run '{\\"runId\\": \${env.TESTRAIL_RUN_ID}}'"
            }
          }
        }
      }
    }
  `
};

// ============================================================================
// 2. TEST AUTOMATION FRAMEWORK INTEGRATION
// ============================================================================

/**
 * Playwright Test Results Integration
 */
const playwrightIntegration = {
  // Custom Playwright reporter for TestRail
  reporter: `
    // playwright-testrail-reporter.js
    class TestRailReporter {
      constructor(options) {
        this.testRailRunId = options.runId;
        this.results = [];
      }
      
      onTestEnd(test, result) {
        const testRailCaseId = this.extractCaseId(test.title);
        if (testRailCaseId) {
          this.results.push({
            caseId: testRailCaseId,
            statusId: this.mapStatus(result.status),
            comment: this.formatComment(test, result),
            elapsed: this.formatDuration(result.duration),
            version: process.env.npm_package_version
          });
        }
      }
      
      async onEnd() {
        if (this.results.length > 0) {
          // Call TestRail MCP Server
          const mcpResponse = await fetch('http://localhost:3000/tools/add_bulk_results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              runId: this.testRailRunId,
              results: this.results
            })
          });
          
          const response = await mcpResponse.json();
          console.log('TestRail results updated:', response.data.processed);
        }
      }
      
      extractCaseId(title) {
        const match = title.match(/\\[C(\\d+)\\]/);
        return match ? parseInt(match[1]) : null;
      }
      
      mapStatus(status) {
        switch (status) {
          case 'passed': return 1;
          case 'failed': return 5;
          case 'skipped': return 2;
          case 'timedOut': return 5;
          default: return 3;
        }
      }
      
      formatComment(test, result) {
        let comment = \`Test: \${test.title}\\n\`;
        comment += \`Status: \${result.status.toUpperCase()}\\n\`;
        
        if (result.error) {
          comment += \`Error: \${result.error.message}\\n\`;
          comment += \`Stack: \${result.error.stack}\`;
        }
        
        if (result.attachments && result.attachments.length > 0) {
          comment += \`\\nAttachments: \${result.attachments.length} files\`;
        }
        
        return comment;
      }
      
      formatDuration(ms) {
        if (ms < 1000) return \`\${ms}ms\`;
        if (ms < 60000) return \`\${(ms / 1000).toFixed(1)}s\`;
        return \`\${Math.floor(ms / 60000)}m \${((ms % 60000) / 1000).toFixed(0)}s\`;
      }
    }
    
    module.exports = TestRailReporter;
  `,

  // Playwright test with TestRail case IDs
  testExample: `
    // login.spec.js
    import { test, expect } from '@playwright/test';
    
    test('[C123] User can login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid=username]', 'testuser@example.com');
      await page.fill('[data-testid=password]', 'password123');
      await page.click('[data-testid=login-button]');
      
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid=welcome-message]')).toContainText('Welcome');
    });
    
    test('[C124] User cannot login with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid=username]', 'invalid@example.com');
      await page.fill('[data-testid=password]', 'wrongpassword');
      await page.click('[data-testid=login-button]');
      
      await expect(page.locator('[data-testid=error-message]')).toContainText('Invalid credentials');
    });
  `
};

/**
 * Selenium WebDriver Integration (Java)
 */
const seleniumIntegration = {
  // Java TestNG listener for TestRail
  testNGListener: `
    // TestRailListener.java
    public class TestRailListener implements ITestListener {
        private TestRailClient testRailClient;
        private int runId;
        private List<TestResult> results = new ArrayList<>();
        
        @Override
        public void onStart(ITestContext context) {
            testRailClient = new TestRailClient();
            runId = Integer.parseInt(System.getProperty("testrail.run.id"));
        }
        
        @Override
        public void onTestSuccess(ITestResult result) {
            updateTestRailResult(result, 1); // Passed
        }
        
        @Override
        public void onTestFailure(ITestResult result) {
            updateTestRailResult(result, 5); // Failed
        }
        
        @Override
        public void onTestSkipped(ITestResult result) {
            updateTestRailResult(result, 2); // Blocked
        }
        
        private void updateTestRailResult(ITestResult result, int statusId) {
            TestRailCase annotation = result.getMethod()
                .getConstructorOrMethod()
                .getMethod()
                .getAnnotation(TestRailCase.class);
                
            if (annotation != null) {
                TestResult testResult = new TestResult();
                testResult.setCaseId(annotation.id());
                testResult.setStatusId(statusId);
                testResult.setComment(formatComment(result));
                testResult.setElapsed(formatDuration(result));
                
                results.add(testResult);
            }
        }
        
        @Override
        public void onFinish(ITestContext context) {
            if (!results.isEmpty()) {
                testRailClient.addBulkResults(runId, results);
            }
        }
    }
  `,

  // Java test with TestRail annotation
  javaTestExample: `
    // LoginTest.java
    public class LoginTest {
        private WebDriver driver;
        
        @Test
        @TestRailCase(id = 123)
        @Description("Verify user can login with valid credentials")
        public void testValidLogin() {
            driver.get("https://example.com/login");
            
            WebElement username = driver.findElement(By.id("username"));
            WebElement password = driver.findElement(By.id("password"));
            WebElement loginButton = driver.findElement(By.id("login"));
            
            username.sendKeys("testuser@example.com");
            password.sendKeys("password123");
            loginButton.click();
            
            WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
            wait.until(ExpectedConditions.urlContains("/dashboard"));
            
            Assert.assertTrue(driver.getCurrentUrl().contains("/dashboard"));
        }
        
        @Test
        @TestRailCase(id = 124)
        @Description("Verify user cannot login with invalid credentials")
        public void testInvalidLogin() {
            driver.get("https://example.com/login");
            
            driver.findElement(By.id("username")).sendKeys("invalid@example.com");
            driver.findElement(By.id("password")).sendKeys("wrongpassword");
            driver.findElement(By.id("login")).click();
            
            WebElement errorMessage = driver.findElement(By.className("error-message"));
            Assert.assertTrue(errorMessage.getText().contains("Invalid credentials"));
        }
    }
  `
};

// ============================================================================
// 3. ADVANCED REPORTING AND ANALYTICS
// ============================================================================

/**
 * Custom Dashboard Generation
 */
const advancedReporting = {
  // Generate executive dashboard
  executiveDashboard: {
    tool: "generate_report",
    parameters: {
      projectId: 1,
      format: "detailed",
      dateRange: {
        start: "2024-01-01",
        end: "2024-12-31"
      }
    }
  },

  // Custom analytics queries
  customAnalytics: [
    {
      description: "Get test execution trends over time",
      workflow: [
        {
          tool: "get_runs",
          parameters: {
            projectId: 1,
            isCompleted: true,
            limit: 100
          }
        },
        {
          tool: "generate_report",
          parameters: {
            projectId: 1,
            format: "csv"
          }
        }
      ]
    },
    {
      description: "Identify flaky tests",
      workflow: [
        {
          tool: "get_cases",
          parameters: {
            projectId: 1,
            filter: {
              priority_id: [3, 4] // High and Critical priority
            }
          }
        }
        // Additional analysis would be done in post-processing
      ]
    }
  ],

  // Test coverage analysis
  coverageAnalysis: {
    tool: "search",
    parameters: {
      projectId: 1,
      query: "automated",
      entityType: "cases"
    }
  }
};

// ============================================================================
// 4. BULK OPERATIONS AND DATA MIGRATION
// ============================================================================

/**
 * Large Scale Data Operations
 */
const bulkOperations = {
  // Migrate test cases from another system
  migrateTestCases: {
    description: "Bulk import test cases from CSV/JSON",
    batchSize: 100,
    workflow: `
      // Process test cases in batches
      const testCases = loadTestCasesFromFile('test-cases.json');
      const batchSize = 100;
      
      for (let i = 0; i < testCases.length; i += batchSize) {
        const batch = testCases.slice(i, i + batchSize);
        
        for (const testCase of batch) {
          await mcpClient.callTool('create_case', {
            sectionId: testCase.sectionId,
            title: testCase.title,
            typeId: testCase.typeId,
            priorityId: testCase.priorityId,
            preconditions: testCase.preconditions,
            steps: testCase.steps,
            expectedResult: testCase.expectedResult
          });
        }
        
        // Rate limiting: wait between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    `
  },

  // Bulk update test case priorities
  bulkUpdatePriorities: {
    description: "Update priorities based on business rules",
    workflow: `
      // Get all test cases
      const cases = await mcpClient.callTool('get_cases', {
        projectId: 1,
        limit: 1000
      });
      
      // Apply business rules
      for (const testCase of cases.data.cases) {
        let newPriorityId = testCase.priority_id;
        
        // Business rule: Security tests are high priority
        if (testCase.title.toLowerCase().includes('security')) {
          newPriorityId = 3; // High priority
        }
        
        // Business rule: API tests are medium priority
        if (testCase.title.toLowerCase().includes('api')) {
          newPriorityId = 2; // Medium priority
        }
        
        // Update if priority changed
        if (newPriorityId !== testCase.priority_id) {
          await mcpClient.callTool('update_case', {
            caseId: testCase.id,
            priorityId: newPriorityId
          });
        }
      }
    `
  }
};

// ============================================================================
// 5. COMPLEX WORKFLOW ORCHESTRATION
// ============================================================================

/**
 * Multi-Environment Test Orchestration
 */
const multiEnvironmentWorkflow = {
  description: "Orchestrate tests across multiple environments",
  
  environments: ['dev', 'staging', 'production'],
  
  workflow: {
    // Step 1: Create runs for each environment
    createEnvironmentRuns: {
      dev: {
        tool: "create_run",
        parameters: {
          projectId: 1,
          name: "Smoke Test - Development",
          configIds: [1], // Dev config
          caseIds: [1, 2, 3] // Smoke test cases
        }
      },
      staging: {
        tool: "create_run", 
        parameters: {
          projectId: 1,
          name: "Regression Test - Staging",
          configIds: [2], // Staging config
          includeAll: true
        }
      },
      production: {
        tool: "create_run",
        parameters: {
          projectId: 1,
          name: "Health Check - Production",
          configIds: [3], // Prod config
          caseIds: [1, 5, 10] // Critical path only
        }
      }
    },

    // Step 2: Execute tests in sequence with dependencies
    executionFlow: `
      // Development tests (must pass before staging)
      const devResults = await executeTests('dev');
      
      if (devResults.passRate >= 0.95) {
        // Staging tests (must pass before production)
        const stagingResults = await executeTests('staging');
        
        if (stagingResults.passRate >= 0.90) {
          // Production health checks
          const prodResults = await executeTests('production');
          
          // Generate consolidated report
          await generateConsolidatedReport([devResults, stagingResults, prodResults]);
        } else {
          // Block production deployment
          await notifyStakeholders('Staging tests failed - Production deployment blocked');
        }
      } else {
        // Block all downstream environments
        await notifyStakeholders('Development tests failed - All deployments blocked');
      }
    `
  }
};

/**
 * Test Plan Management Workflow
 */
const testPlanManagement = {
  // Create comprehensive test plan
  createMasterPlan: {
    tool: "create_plan",
    parameters: {
      projectId: 1,
      name: "Release 3.0 Master Test Plan",
      description: "Comprehensive testing plan for major release 3.0",
      milestoneId: 10,
      entries: [
        {
          name: "Unit Tests",
          suiteId: 1,
          assignedToId: 5,
          includeAll: false,
          caseIds: [1, 2, 3, 4, 5]
        },
        {
          name: "Integration Tests",
          suiteId: 2,
          assignedToId: 6,
          includeAll: true
        },
        {
          name: "E2E Tests",
          suiteId: 3,
          assignedToId: 7,
          configIds: [1, 2, 3] // All environments
        },
        {
          name: "Performance Tests",
          suiteId: 4,
          assignedToId: 8,
          includeAll: false,
          caseIds: [100, 101, 102] // Critical performance scenarios
        }
      ]
    }
  },

  // Monitor plan progress
  monitorProgress: `
    // Get plan details
    const plan = await mcpClient.callTool('get_plan', { planId: 123 });
    
    // Calculate overall progress
    let totalTests = 0;
    let completedTests = 0;
    let passedTests = 0;
    
    for (const entry of plan.data.plan.entries) {
      for (const run of entry.runs) {
        totalTests += run.passed_count + run.failed_count + run.blocked_count + run.untested_count;
        completedTests += run.passed_count + run.failed_count + run.blocked_count;
        passedTests += run.passed_count;
      }
    }
    
    const progressReport = {
      totalTests,
      completedTests,
      passedTests,
      progressPercentage: (completedTests / totalTests) * 100,
      passPercentage: (passedTests / completedTests) * 100,
      status: plan.data.plan.is_completed ? 'Completed' : 'In Progress'
    };
    
    console.log('Test Plan Progress:', progressReport);
  `
};

// Export all advanced examples
module.exports = {
  cicd: {
    githubActionsIntegration,
    jenkinsPipelineIntegration
  },
  automation: {
    playwrightIntegration,
    seleniumIntegration
  },
  reporting: {
    advancedReporting
  },
  bulkOperations,
  workflows: {
    multiEnvironmentWorkflow,
    testPlanManagement
  }
};