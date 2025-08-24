/**
 * Advanced TestRail MCP Server Usage Examples
 * 
 * This file demonstrates advanced usage patterns including:
 * - Complex test planning and execution
 * - CI/CD pipeline integration
 * - Automated result processing
 * - Custom reporting and analytics
 * - Error handling and retry logic
 */

// ============================================================================
// 1. ADVANCED TEST PLANNING
// ============================================================================

/**
 * Create a comprehensive test plan with multiple configurations
 */
const createComprehensiveTestPlan = {
  description: "Multi-environment test plan with different browser/OS combinations",
  steps: [
    {
      tool: "create_run",
      parameters: {
        projectId: 1,
        name: "Cross-Browser Testing - Chrome",
        description: "Test execution on Chrome browser across different OS",
        includeAll: false,
        caseIds: [1, 2, 3, 4, 5],
        configIds: [1, 2]  // Chrome on Windows, Chrome on Mac
      }
    },
    {
      tool: "create_run", 
      parameters: {
        projectId: 1,
        name: "Cross-Browser Testing - Firefox",
        description: "Test execution on Firefox browser across different OS",
        includeAll: false,
        caseIds: [1, 2, 3, 4, 5],
        configIds: [3, 4]  // Firefox on Windows, Firefox on Mac
      }
    },
    {
      tool: "create_run",
      parameters: {
        projectId: 1,
        name: "Mobile Testing - iOS",
        description: "Mobile app testing on iOS devices",
        includeAll: false,
        caseIds: [6, 7, 8, 9, 10],
        configIds: [5, 6]  // iOS 16, iOS 17
      }
    }
  ]
};

/**
 * Automated test case generation from requirements
 */
const generateTestCasesFromRequirements = {
  description: "Generate test cases based on requirement specifications",
  requirements: [
    {
      id: "REQ-001",
      title: "User Authentication",
      scenarios: [
        "Valid login credentials",
        "Invalid username",
        "Invalid password", 
        "Empty credentials",
        "SQL injection attempt",
        "Session timeout"
      ]
    }
  ],
  generatedCases: [
    {
      tool: "create_case",
      parameters: {
        sectionId: 1,
        title: "REQ-001: Verify login with valid credentials",
        refs: "REQ-001",
        typeId: 6,
        priorityId: 3,
        preconditions: "User account exists with valid credentials",
        steps: "1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login button",
        expectedResult: "User is authenticated and redirected to dashboard"
      }
    },
    {
      tool: "create_case",
      parameters: {
        sectionId: 1,
        title: "REQ-001: Verify login rejection with invalid username",
        refs: "REQ-001",
        typeId: 6,
        priorityId: 2,
        preconditions: "Login page is accessible",
        steps: "1. Navigate to login page\n2. Enter invalid/non-existent username\n3. Enter any password\n4. Click login button",
        expectedResult: "Login is rejected with appropriate error message"
      }
    }
  ]
};

// ============================================================================
// 2. CI/CD PIPELINE INTEGRATION
// ============================================================================

/**
 * GitHub Actions integration example
 */
const githubActionsIntegration = {
  description: "Complete CI/CD workflow with TestRail integration",
  workflowFile: `
# .github/workflows/test-and-report.yml
name: Test and Report to TestRail

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests with coverage
      run: npm run test:coverage
      
    - name: Create TestRail run
      id: create-run
      run: |
        RUN_ID=$(node scripts/create-testrail-run.js)
        echo "run_id=$RUN_ID" >> $GITHUB_OUTPUT
        
    - name: Report results to TestRail
      run: node scripts/report-to-testrail.js ${{ steps.create-run.outputs.run_id }}
      env:
        TESTRAIL_URL: ${{ secrets.TESTRAIL_URL }}
        TESTRAIL_USERNAME: ${{ secrets.TESTRAIL_USERNAME }}
        TESTRAIL_API_KEY: ${{ secrets.TESTRAIL_API_KEY }}
  `,
  
  createRunScript: {
    tool: "create_run",
    parameters: {
      projectId: 1,
      name: `CI Build ${process.env.GITHUB_RUN_NUMBER} - ${process.env.GITHUB_SHA?.substring(0, 7)}`,
      description: `Automated test run for commit ${process.env.GITHUB_SHA}\nBranch: ${process.env.GITHUB_REF_NAME}\nTriggered by: ${process.env.GITHUB_ACTOR}`,
      includeAll: true
    }
  },
  
  reportResults: {
    tool: "add_bulk_results",
    parameters: {
      runId: "{{RUN_ID}}",
      results: [
        // This would be populated from test results
      ]
    }
  }
};

/**
 * Jenkins pipeline integration
 */
const jenkinsPipelineIntegration = {
  description: "Jenkins pipeline with TestRail reporting",
  jenkinsfile: `
pipeline {
    agent any
    
    environment {
        TESTRAIL_URL = credentials('testrail-url')
        TESTRAIL_USERNAME = credentials('testrail-username') 
        TESTRAIL_API_KEY = credentials('testrail-api-key')
    }
    
    stages {
        stage('Test') {
            steps {
                sh 'npm test -- --reporter=json --outputFile=test-results.json'
            }
        }
        
        stage('Report to TestRail') {
            steps {
                script {
                    def runId = sh(
                        script: 'node scripts/create-testrail-run.js',
                        returnStdout: true
                    ).trim()
                    
                    sh "node scripts/report-results.js ${runId}"
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'test-results.json', fingerprint: true
        }
    }
}
  `,
  
  resultMapping: {
    description: "Map Jest/Mocha results to TestRail",
    script: `
// scripts/report-results.js
const testResults = require('./test-results.json');

const testRailResults = testResults.tests.map(test => ({
  caseId: extractCaseId(test.title), // Extract from test title or tags
  statusId: test.state === 'passed' ? 1 : 5,
  comment: test.err ? test.err.message : 'Test passed successfully',
  elapsed: formatDuration(test.duration),
  version: process.env.BUILD_NUMBER
}));

// Use add_bulk_results tool
const bulkResults = {
  tool: "add_bulk_results",
  parameters: {
    runId: process.argv[2],
    results: testRailResults
  }
};
    `
  }
};

// ============================================================================
// 3. AUTOMATED RESULT PROCESSING
// ============================================================================

/**
 * Parse and process Selenium test results
 */
const seleniumResultProcessing = {
  description: "Process Selenium WebDriver test results",
  
  parseSeleniumResults: {
    description: "Convert Selenium test results to TestRail format",
    input: `
<!-- Selenium JUnit XML output -->
<testsuite name="LoginTests" tests="3" failures="1" errors="0" time="45.67">
  <testcase classname="com.example.LoginTest" name="testValidLogin" time="12.34">
    <!-- Test passed -->
  </testcase>
  <testcase classname="com.example.LoginTest" name="testInvalidLogin" time="8.92">
    <!-- Test passed -->
  </testcase>
  <testcase classname="com.example.LoginTest" name="testEmptyCredentials" time="24.41">
    <failure message="Element not found" type="NoSuchElementException">
      Stack trace here...
    </failure>
  </testcase>
</testsuite>
    `,
    
    processor: {
      tool: "add_bulk_results",
      parameters: {
        runId: 123,
        results: [
          {
            caseId: 45,  // Mapped from testValidLogin
            statusId: 1,
            comment: "Selenium test passed - Valid login successful",
            elapsed: "12s",
            version: "selenium-v4.15.0"
          },
          {
            caseId: 46,  // Mapped from testInvalidLogin  
            statusId: 1,
            comment: "Selenium test passed - Invalid login correctly rejected",
            elapsed: "9s",
            version: "selenium-v4.15.0"
          },
          {
            caseId: 47,  // Mapped from testEmptyCredentials
            statusId: 5,
            comment: "Selenium test failed - NoSuchElementException: Element not found. Browser: Chrome 119.0",
            elapsed: "24s",
            defects: "AUTO-SELENIUM-001",
            version: "selenium-v4.15.0"
          }
        ]
      }
    }
  }
};

/**
 * API test result processing from Postman/Newman
 */
const apiTestResultProcessing = {
  description: "Process API test results from Postman/Newman",
  
  newmanResults: {
    input: `
{
  "collection": {
    "info": { "name": "User API Tests" }
  },
  "run": {
    "stats": {
      "requests": { "total": 5, "failed": 1 },
      "assertions": { "total": 15, "failed": 2 }
    },
    "executions": [
      {
        "item": { "name": "GET /users" },
        "assertions": [
          { "assertion": "Status code is 200", "error": null },
          { "assertion": "Response has users array", "error": null }
        ]
      },
      {
        "item": { "name": "POST /users" },
        "assertions": [
          { "assertion": "Status code is 201", "error": "expected 201 but got 500" },
          { "assertion": "User created successfully", "error": "User not created" }
        ]
      }
    ]
  }
}
    `,
    
    processor: {
      tool: "add_bulk_results",
      parameters: {
        runId: 124,
        results: [
          {
            caseId: 100,  // GET /users endpoint test
            statusId: 1,
            comment: "API test passed - GET /users returns user list correctly. All assertions passed.",
            elapsed: "245ms",
            version: "api-v2.1.0"
          },
          {
            caseId: 101,  // POST /users endpoint test  
            statusId: 5,
            comment: "API test failed - POST /users returned 500 instead of 201. Server error during user creation.",
            elapsed: "1.2s",
            defects: "API-500-ERROR",
            version: "api-v2.1.0"
          }
        ]
      }
    }
  }
};

// ============================================================================
// 4. CUSTOM REPORTING AND ANALYTICS
// ============================================================================

/**
 * Generate executive dashboard report
 */
const executiveDashboardReport = {
  description: "Create comprehensive executive report with trends and metrics",
  
  dataCollection: [
    {
      tool: "get_runs",
      parameters: {
        projectId: 1,
        limit: 50,
        isCompleted: true
      }
    },
    {
      tool: "generate_report",
      parameters: {
        projectId: 1,
        format: "detailed",
        dateRange: {
          start: "2024-01-01",
          end: "2024-03-31"
        }
      }
    }
  ],
  
  customAnalytics: {
    description: "Process data to generate custom metrics",
    metrics: [
      "Test execution velocity (tests per sprint)",
      "Pass rate trends over time", 
      "Defect density by component",
      "Test coverage gaps",
      "Automation percentage",
      "Mean time to resolution for failed tests"
    ]
  }
};

/**
 * Automated quality gate checks
 */
const qualityGateChecks = {
  description: "Automated quality gates based on TestRail metrics",
  
  checks: [
    {
      name: "Pass Rate Check",
      threshold: 0.95, // 95% pass rate required
      query: {
        tool: "generate_report",
        parameters: {
          projectId: 1,
          runId: 123,
          format: "summary"
        }
      },
      evaluation: `
        const passRate = data.summary.passed / data.summary.total;
        return {
          passed: passRate >= 0.95,
          value: passRate,
          message: passRate >= 0.95 
            ? 'Quality gate passed - Pass rate acceptable'
            : 'Quality gate failed - Pass rate below threshold'
        };
      `
    },
    {
      name: "Critical Test Coverage",
      threshold: 1.0, // 100% of critical tests must pass
      evaluation: `
        const criticalTests = data.tests.filter(t => t.priority_id === 4);
        const criticalPassed = criticalTests.filter(t => t.status_id === 1);
        const coverage = criticalPassed.length / criticalTests.length;
        
        return {
          passed: coverage === 1.0,
          value: coverage,
          message: coverage === 1.0
            ? 'All critical tests passed'
            : 'Critical test failures detected - Release blocked'
        };
      `
    }
  ]
};

// ============================================================================
// 5. ERROR HANDLING AND RESILIENCE
// ============================================================================

/**
 * Robust error handling with retry logic
 */
const resilientTestExecution = {
  description: "Error handling patterns for reliable test execution",
  
  retryWrapper: {
    description: "Wrapper function with exponential backoff",
    implementation: `
async function executeWithRetry(toolCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await executeTool(toolCall);
      
      if (result.success) {
        return result;
      }
      
      // Handle specific error types
      if (result.code === 'RATE_LIMITED') {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await sleep(delay);
        continue;
      }
      
      if (result.code === 'CONNECTION_FAILED' && attempt < maxRetries) {
        console.log('Connection failed, retrying in 5 seconds...');
        await sleep(5000);
        continue;
      }
      
      // Non-retryable error
      throw new Error(result.error);
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.log('Attempt ${attempt} failed, retrying...', error.message);
      await sleep(1000 * attempt);
    }
  }
}
    `
  },
  
  fallbackStrategies: {
    description: "Fallback strategies for different failure scenarios",
    strategies: [
      {
        scenario: "TestRail API unavailable",
        fallback: "Store results locally and sync when service is restored",
        implementation: {
          tool: "local_cache_results",
          parameters: {
            results: "{{failed_results}}",
            retryAfter: 300 // 5 minutes
          }
        }
      },
      {
        scenario: "Authentication expired",
        fallback: "Refresh connection and retry",
        implementation: {
          tool: "connect_testrail",
          parameters: {
            baseUrl: "{{config.baseUrl}}",
            username: "{{config.username}}",
            apiKey: "{{config.refreshedApiKey}}"
          }
        }
      }
    ]
  }
};

/**
 * Comprehensive validation and sanitization
 */
const inputValidationExamples = {
  description: "Validate inputs before sending to TestRail",
  
  validators: {
    testCaseValidation: {
      description: "Validate test case data before creation",
      rules: [
        "Title must be 1-255 characters",
        "Steps must not exceed 65535 characters", 
        "Priority ID must be valid (1-4)",
        "Type ID must exist in project",
        "Section ID must exist and be accessible"
      ],
      implementation: `
function validateTestCase(caseData) {
  const errors = [];
  
  if (!caseData.title || caseData.title.length < 1 || caseData.title.length > 255) {
    errors.push('Title must be 1-255 characters');
  }
  
  if (caseData.steps && caseData.steps.length > 65535) {
    errors.push('Steps must not exceed 65535 characters');
  }
  
  if (caseData.priorityId && ![1,2,3,4].includes(caseData.priorityId)) {
    errors.push('Priority ID must be 1-4');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}
      `
    }
  }
};

// ============================================================================
// 6. PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Batch processing for large datasets
 */
const batchProcessingExamples = {
  description: "Efficiently process large amounts of test data",
  
  batchResultSubmission: {
    description: "Process results in batches to avoid timeouts",
    implementation: `
async function submitResultsInBatches(runId, allResults, batchSize = 50) {
  const batches = [];
  
  // Split results into batches
  for (let i = 0; i < allResults.length; i += batchSize) {
    batches.push(allResults.slice(i, i + batchSize));
  }
  
  const results = [];
  
  // Process each batch
  for (const [index, batch] of batches.entries()) {
    console.log('Processing batch ${index + 1}/${batches.length}...');
    
    const batchResult = await executeTool({
      tool: "add_bulk_results",
      parameters: {
        runId: runId,
        results: batch
      }
    });
    
    results.push(batchResult);
    
    // Add delay between batches to respect rate limits
    if (index < batches.length - 1) {
      await sleep(1000);
    }
  }
  
  return results;
}
    `
  },
  
  parallelDataFetching: {
    description: "Fetch related data in parallel for efficiency",
    implementation: `
async function fetchTestRunData(projectId, runId) {
  // Fetch multiple data sources in parallel
  const [runDetails, tests, users, statuses] = await Promise.all([
    executeTool({ tool: "get_run", parameters: { runId } }),
    executeTool({ tool: "get_tests", parameters: { runId } }),
    executeTool({ tool: "get_users", parameters: { projectId } }),
    executeTool({ tool: "get_statuses", parameters: {} })
  ]);
  
  return {
    run: runDetails.data,
    tests: tests.data.tests,
    users: users.data.users,
    statuses: statuses.data.statuses
  };
}
    `
  }
};

// Export all advanced examples
module.exports = {
  testPlanning: {
    createComprehensiveTestPlan,
    generateTestCasesFromRequirements
  },
  cicdIntegration: {
    githubActionsIntegration,
    jenkinsPipelineIntegration
  },
  resultProcessing: {
    seleniumResultProcessing,
    apiTestResultProcessing
  },
  reporting: {
    executiveDashboardReport,
    qualityGateChecks
  },
  errorHandling: {
    resilientTestExecution,
    inputValidationExamples
  },
  performance: {
    batchProcessingExamples
  }
};