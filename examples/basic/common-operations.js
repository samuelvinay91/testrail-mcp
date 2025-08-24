/**
 * Basic TestRail MCP Server Usage Examples
 * 
 * This file demonstrates common usage patterns for the TestRail MCP Server.
 * These examples can be used directly with MCP clients like Claude Desktop or Cline.
 */

// ============================================================================
// 1. CONNECTION AND SETUP
// ============================================================================

// First, connect to your TestRail instance
const connectionExample = {
  tool: "connect_testrail",
  parameters: {
    baseUrl: "https://yourcompany.testrail.io",
    username: "your.email@company.com",
    apiKey: "your-api-key-here",
    timeout: 30000
  }
};

// Test the connection
const testConnectionExample = {
  tool: "test_connection",
  parameters: {}
};

// ============================================================================
// 2. PROJECT MANAGEMENT
// ============================================================================

// Get all projects
const getProjectsExample = {
  tool: "get_projects",
  parameters: {
    isCompleted: false  // Only active projects
  }
};

// Get specific project
const getProjectExample = {
  tool: "get_project",
  parameters: {
    projectId: 1
  }
};

// Create new project
const createProjectExample = {
  tool: "create_project",
  parameters: {
    name: "Mobile App Testing",
    announcement: "New project for mobile app test automation",
    showAnnouncement: true,
    suiteMode: 1  // Single suite mode
  }
};

// ============================================================================
// 3. TEST CASE MANAGEMENT
// ============================================================================

// Get all test cases in a project
const getCasesExample = {
  tool: "get_cases",
  parameters: {
    projectId: 1,
    suiteId: 1,
    limit: 100,
    filter: {
      priority_id: [2, 3, 4],  // Medium, High, Critical
      type_id: [1, 6]          // Acceptance, Functional
    }
  }
};

// Create a new test case
const createCaseExample = {
  tool: "create_case",
  parameters: {
    sectionId: 1,
    title: "Verify user registration with valid email",
    typeId: 6,        // Functional test
    priorityId: 2,    // Medium priority
    refs: "REQ-123",  // Requirement reference
    preconditions: "User has access to registration page",
    steps: "1. Navigate to registration page\n2. Enter valid email address\n3. Enter password\n4. Confirm password\n5. Click Register button",
    expectedResult: "User account is created successfully and confirmation email is sent",
    stepsDetailed: [
      {
        content: "Navigate to registration page",
        expected: "Registration form is displayed with email and password fields"
      },
      {
        content: "Enter valid email address (e.g., test@example.com)",
        expected: "Email field accepts the input without validation errors"
      },
      {
        content: "Enter password meeting complexity requirements",
        expected: "Password field accepts the input and strength indicator shows adequate"
      },
      {
        content: "Confirm password by re-entering the same password",
        expected: "Password confirmation field accepts input and shows match indicator"
      },
      {
        content: "Click Register button",
        expected: "Registration is processed and success message is displayed"
      }
    ],
    customFields: {
      custom_automation_type: "Manual",
      custom_component: "User Management"
    }
  }
};

// Update existing test case
const updateCaseExample = {
  tool: "update_case",
  parameters: {
    caseId: 123,
    title: "Updated: Verify user registration with valid email and SMS verification",
    priorityId: 3,  // Changed to High priority
    steps: "1. Navigate to registration page\n2. Enter valid email\n3. Enter phone number\n4. Enter password\n5. Verify SMS code\n6. Complete registration",
    customFields: {
      custom_automation_type: "Automated"
    }
  }
};

// ============================================================================
// 4. TEST RUN MANAGEMENT
// ============================================================================

// Create a test run for regression testing
const createRunExample = {
  tool: "create_run",
  parameters: {
    projectId: 1,
    name: "Sprint 24 Regression Testing",
    description: "Comprehensive regression testing for Sprint 24 release",
    suiteId: 1,
    milestoneId: 15,
    assignedToId: 5,  // Assign to specific tester
    includeAll: false,
    caseIds: [1, 2, 3, 5, 8, 13, 21, 34]  // Fibonacci sequence of test case IDs
  }
};

// Create a smoke test run (quick subset)
const createSmokeRunExample = {
  tool: "create_run",
  parameters: {
    projectId: 1,
    name: "Daily Smoke Test - " + new Date().toISOString().split('T')[0],
    description: "Automated daily smoke test execution",
    includeAll: false,
    caseIds: [1, 2, 3]  // Critical path test cases only
  }
};

// Get active test runs
const getRunsExample = {
  tool: "get_runs",
  parameters: {
    projectId: 1,
    isCompleted: false,
    limit: 20
  }
};

// ============================================================================
// 5. TEST EXECUTION AND RESULTS
// ============================================================================

// Add a passing test result with detailed information
const addPassResultExample = {
  tool: "add_result",
  parameters: {
    runId: 45,
    caseId: 123,
    statusId: 1,  // Passed
    comment: "Test executed successfully. All validation points passed. Registration flow working as expected.",
    version: "v2.1.3-build.456",
    elapsed: "2m 30s",
    stepResults: [
      {
        content: "Navigate to registration page",
        expected: "Registration form is displayed",
        actual: "Registration form displayed correctly with all required fields",
        statusId: 1
      },
      {
        content: "Enter valid email address",
        expected: "Email field accepts input",
        actual: "Email validation working, accepted test@example.com",
        statusId: 1
      },
      {
        content: "Complete registration process",
        expected: "Success message displayed",
        actual: "Registration completed, confirmation email received",
        statusId: 1
      }
    ]
  }
};

// Add a failing test result with detailed error information
const addFailResultExample = {
  tool: "add_result",
  parameters: {
    runId: 45,
    caseId: 124,
    statusId: 5,  // Failed
    comment: "Test failed during email validation step. Server returned 500 error when submitting registration form. Issue appears to be related to email service integration.",
    version: "v2.1.3-build.456",
    elapsed: "1m 15s",
    defects: "BUG-789, BUG-790",
    stepResults: [
      {
        content: "Navigate to registration page",
        expected: "Registration form is displayed",
        actual: "Registration form displayed correctly",
        statusId: 1
      },
      {
        content: "Enter valid email and submit",
        expected: "Registration should complete successfully",
        actual: "Server returned 500 Internal Server Error. Email service appears down.",
        statusId: 5
      }
    ]
  }
};

// Add a blocked test result
const addBlockedResultExample = {
  tool: "add_result",
  parameters: {
    runId: 45,
    caseId: 125,
    statusId: 2,  // Blocked
    comment: "Cannot execute test due to environment issues. Database server is down for maintenance. Will retry once environment is restored.",
    assignedToId: 7  // Reassign to infrastructure team
  }
};

// Bulk add results from automated test execution
const addBulkResultsExample = {
  tool: "add_bulk_results",
  parameters: {
    runId: 45,
    results: [
      {
        caseId: 101,
        statusId: 1,
        comment: "Automated test passed - Login functionality verified",
        version: "v2.1.3",
        elapsed: "45s"
      },
      {
        caseId: 102,
        statusId: 1,
        comment: "Automated test passed - Dashboard loads correctly",
        version: "v2.1.3",
        elapsed: "30s"
      },
      {
        caseId: 103,
        statusId: 5,
        comment: "Automated test failed - Search function returns incorrect results",
        version: "v2.1.3",
        elapsed: "1m 20s",
        defects: "AUTO-BUG-001"
      },
      {
        caseId: 104,
        statusId: 1,
        comment: "Automated test passed - User profile update works",
        version: "v2.1.3",
        elapsed: "55s"
      }
    ]
  }
};

// ============================================================================
// 6. REPORTING AND ANALYTICS
// ============================================================================

// Generate comprehensive test report
const generateReportExample = {
  tool: "generate_report",
  parameters: {
    projectId: 1,
    runId: 45,
    format: "detailed",
    dateRange: {
      start: "2024-01-01",
      end: "2024-01-31"
    }
  }
};

// Generate milestone summary report
const generateMilestoneReportExample = {
  tool: "generate_report",
  parameters: {
    projectId: 1,
    milestoneId: 15,
    format: "summary"
  }
};

// ============================================================================
// 7. METADATA AND CONFIGURATION
// ============================================================================

// Get all available statuses
const getStatusesExample = {
  tool: "get_statuses",
  parameters: {}
};

// Get project users
const getUsersExample = {
  tool: "get_users",
  parameters: {
    projectId: 1
  }
};

// Get case types and priorities for reference
const getMetadataExample = [
  {
    tool: "get_case_types",
    parameters: {}
  },
  {
    tool: "get_priorities", 
    parameters: {}
  }
];

// ============================================================================
// 8. ADVANCED WORKFLOWS
// ============================================================================

// Complete workflow: Create case, run, and add results
const completeWorkflowExample = {
  steps: [
    {
      description: "Step 1: Create a new test case",
      tool: "create_case",
      parameters: {
        sectionId: 1,
        title: "API - Verify GET /users endpoint returns user list",
        typeId: 6,
        priorityId: 2,
        preconditions: "API server is running and accessible",
        steps: "1. Send GET request to /api/users\n2. Verify response status is 200\n3. Verify response contains user array\n4. Verify user objects have required fields",
        expectedResult: "Response returns 200 OK with valid user list JSON"
      }
    },
    {
      description: "Step 2: Create test run including the new case",
      tool: "create_run",
      parameters: {
        projectId: 1,
        name: "API Integration Test Run",
        includeAll: false,
        caseIds: ["{{step1.result.case.id}}"]  // Reference result from step 1
      }
    },
    {
      description: "Step 3: Execute test and add result",
      tool: "add_result",
      parameters: {
        runId: "{{step2.result.run.id}}",  // Reference result from step 2
        caseId: "{{step1.result.case.id}}",
        statusId: 1,
        comment: "API test passed - endpoint returns expected user data structure",
        version: "api-v1.2.0"
      }
    }
  ]
};

// CI/CD Integration Example
const cicdIntegrationExample = {
  tool: "add_bulk_results",
  parameters: {
    runId: 45,
    results: [
      // Results from Jest/Mocha test execution
      {
        caseId: 201,
        statusId: 1,
        comment: "Unit test: UserService.createUser() - PASSED",
        version: process.env.BUILD_NUMBER || "unknown",
        elapsed: "0.05s"
      },
      {
        caseId: 202,
        statusId: 1,
        comment: "Integration test: User registration API - PASSED",
        version: process.env.BUILD_NUMBER || "unknown", 
        elapsed: "1.2s"
      },
      {
        caseId: 203,
        statusId: 5,
        comment: "E2E test: Full user journey - FAILED. Screenshot saved to artifacts.",
        version: process.env.BUILD_NUMBER || "unknown",
        elapsed: "45s",
        defects: `CI-FAILURE-${process.env.BUILD_NUMBER}`
      }
    ]
  }
};

// Export all examples for reference
module.exports = {
  connection: {
    connectionExample,
    testConnectionExample
  },
  projects: {
    getProjectsExample,
    getProjectExample,
    createProjectExample
  },
  testCases: {
    getCasesExample,
    createCaseExample,
    updateCaseExample
  },
  testRuns: {
    createRunExample,
    createSmokeRunExample,
    getRunsExample
  },
  results: {
    addPassResultExample,
    addFailResultExample,
    addBlockedResultExample,
    addBulkResultsExample
  },
  reporting: {
    generateReportExample,
    generateMilestoneReportExample
  },
  metadata: {
    getStatusesExample,
    getUsersExample,
    getMetadataExample
  },
  workflows: {
    completeWorkflowExample,
    cicdIntegrationExample
  }
};