# TestRail MCP Server - Usage Examples with Coding Agents

This document provides practical examples of how to interact with TestRail through various AI coding agents and tools.

## Common Usage Patterns

### 1. Project Management

**Query**: "Connect to TestRail and show me all active projects"

**Expected Response**: List of all active TestRail projects with details like ID, name, suite mode, and completion status.

**Query**: "Create a new project called 'Mobile App Testing' with multiple suite mode"

**Expected Response**: Confirmation of project creation with project details and ID.

---

### 2. Test Case Management

**Query**: "Get all test cases for project ID 5 and show me the ones with high priority"

**Expected Response**: Filtered list of high-priority test cases with titles, IDs, and current status.

**Query**: "Create test cases for this React component I'm working on"

**Expected Response**: Generated test cases based on the component's functionality, including positive and negative test scenarios.

---

### 3. Test Execution & Reporting

**Query**: "Create a test run for the latest sprint and include all critical test cases"

**Expected Response**: New test run created with relevant test cases included.

**Query**: "Generate a project dashboard showing test trends for the last 30 days"

**Expected Response**: Comprehensive dashboard with metrics, pass rates, failure trends, and recommendations.

---

## Agent-Specific Examples

### Claude Desktop

#### Basic Project Exploration
```
Me: Can you help me explore my TestRail projects and find the one with the most active test runs?

Claude: I'll help you explore your TestRail projects and identify the most active one. Let me start by connecting to TestRail and getting all your projects.

[Uses connect_testrail and get_projects tools]

Based on the results, here are your projects:
1. E-commerce Platform (ID: 1) - 15 active runs
2. Mobile App (ID: 2) - 8 active runs  
3. API Testing (ID: 3) - 23 active runs

Project "API Testing" (ID: 3) has the most active test runs with 23 ongoing runs. Would you like me to get more details about these runs or generate a dashboard for this project?
```

#### Test Case Creation
```
Me: I need to create comprehensive test cases for user authentication. Can you help?

Claude: I'll help you create comprehensive test cases for user authentication. Let me create a structured set of test cases covering various authentication scenarios.

[Uses create_case tool multiple times]

I've created 12 comprehensive test cases for user authentication:

**Positive Test Cases:**
- Valid login with correct credentials
- Successful logout functionality
- Password reset with valid email
- Session persistence across browser sessions

**Negative Test Cases:**
- Login with invalid password
- Login with non-existent user
- SQL injection attempts in login fields
- Session timeout handling

**Edge Cases:**
- Special characters in password
- Maximum login attempts handling
- Concurrent login sessions

Would you like me to add more specific test cases or create a test run with these cases?
```

### Cursor IDE

#### Code-Driven Test Generation
```
@testrail analyze this TypeScript function and create appropriate test cases

// Example function
function calculateTax(income: number, taxRate: number): number {
  if (income < 0) throw new Error('Income cannot be negative');
  if (taxRate < 0 || taxRate > 1) throw new Error('Tax rate must be between 0 and 1');
  return income * taxRate;
}

// Cursor with TestRail integration will:
// 1. Analyze the function structure
// 2. Identify edge cases and validation logic
// 3. Create corresponding test cases in TestRail
// 4. Include both positive and negative scenarios
```

#### CI/CD Integration
```
@testrail sync our latest test results from GitHub Actions to TestRail

// Cursor will:
// 1. Parse test results from CI/CD output
// 2. Map test names to TestRail cases
// 3. Create a new test run
// 4. Update results in TestRail
// 5. Generate a summary report
```

### Windsurf IDE

#### Bulk Operations
```
/mcp testrail create a comprehensive test suite for our REST API with these endpoints:
- GET /users
- POST /users  
- PUT /users/{id}
- DELETE /users/{id}
- GET /users/{id}/profile

// Windsurf will create:
// 1. A new test suite named "REST API Testing"
// 2. Sections for each HTTP method
// 3. Test cases for each endpoint including:
//    - Success scenarios (200, 201 responses)
//    - Error scenarios (400, 401, 404, 500)
//    - Input validation tests
//    - Authentication tests
```

#### Project Analysis
```
/mcp testrail analyze project health for project ID 7 and provide recommendations

// Expected comprehensive analysis including:
// - Test case coverage metrics
// - Execution trend analysis
// - Failure pattern identification
// - Recommendations for improvement
```

### Continue (VS Code)

#### Test-Driven Development
```
Can you help me implement TDD for this feature using TestRail integration?

// Continue will:
// 1. Create test cases in TestRail based on requirements
// 2. Generate corresponding unit test code
// 3. Help implement the feature to make tests pass
// 4. Update TestRail with execution results
```

#### Documentation Generation
```
Generate test documentation from our TestRail test cases for this component

// Continue will:
// 1. Fetch relevant test cases from TestRail
// 2. Generate markdown documentation
// 3. Include test scenarios, expected results
// 4. Create usage examples and edge cases
```

## Advanced Usage Scenarios

### 1. Automated Test Health Monitoring

```javascript
// Set up automated monitoring
const monitoringPrompt = `
Monitor our TestRail project health and alert if:
- Pass rate drops below 85%
- More than 10 tests fail in a single run
- Test execution time increases by 50%
- Critical test cases start failing

Check every hour and provide recommendations.
`;
```

### 2. Smart Test Case Recommendations

```javascript
// Get intelligent test case suggestions
const recommendationPrompt = `
Based on our recent code changes in the payment module:
1. Suggest new test cases to add
2. Identify existing test cases that need updates
3. Recommend test cases for regression testing
4. Highlight areas with insufficient coverage
`;
```

### 3. Cross-Project Test Insights

```javascript
// Analyze patterns across multiple projects
const insightPrompt = `
Compare test patterns across our three main projects:
- E-commerce Platform
- Mobile App  
- Admin Dashboard

Identify:
- Common failure patterns
- Best performing test strategies
- Opportunities for test reuse
- Resource allocation recommendations
`;
```

## Best Practices for Agent Interactions

### 1. Be Specific with Context
```
❌ "Create test cases"
✅ "Create test cases for user registration including email validation, password strength checks, and duplicate email handling"
```

### 2. Provide Project Context
```
❌ "Show me test results"
✅ "Show me test results for project 'E-commerce Platform' from the last sprint focusing on checkout functionality"
```

### 3. Request Actionable Insights
```
❌ "Generate a report"
✅ "Generate a dashboard showing test coverage gaps and provide specific recommendations for improving automation coverage"
```

### 4. Iterate and Refine
```
Initial: "Create a test plan"
Follow-up: "Add performance test scenarios to that plan"
Refinement: "Include load testing for 1000 concurrent users"
```

## Troubleshooting Common Issues

### Connection Problems
```
Query: "I'm getting connection errors to TestRail"
Agent Response: "Let me test the TestRail connection and diagnose the issue"
- Checks API credentials
- Validates base URL format
- Tests network connectivity
- Provides specific error resolution steps
```

### Permission Issues
```
Query: "I can't create test cases in this project"
Agent Response: "Let me check your TestRail permissions"
- Verifies user permissions in TestRail
- Identifies required permission levels
- Suggests contacting TestRail admin if needed
```

### Data Inconsistencies
```
Query: "The test results don't match what I see in TestRail"
Agent Response: "Let me sync and verify the data"
- Refreshes data from TestRail
- Compares timestamps and versions
- Identifies any caching issues
- Provides data validation report
```

## Integration Patterns

### 1. Code Review Integration
```
// During code review
"Analyze this pull request and suggest TestRail test cases that should be updated or created"
```

### 2. Sprint Planning Integration
```
// At sprint start
"Based on our sprint backlog, create a test plan in TestRail and estimate testing effort"
```

### 3. Release Preparation
```
// Before release
"Generate a comprehensive test execution report for all critical test cases and identify any blocking issues"
```

### 4. Post-Release Analysis
```
// After release
"Analyze production issues against our test coverage and recommend additional test cases"
```

## Performance Tips

1. **Batch Operations**: Request multiple related operations together
2. **Use Filters**: Be specific about what data you need
3. **Cache Results**: Agent will automatically cache frequently accessed data
4. **Async Operations**: Long-running operations will provide progress updates

## Security Considerations

1. **API Keys**: Never share API keys in chat history
2. **Sensitive Data**: Be cautious about including sensitive test data
3. **Permissions**: Verify you have appropriate access before bulk operations
4. **Audit Trail**: All operations are logged for audit purposes

---

For more detailed configuration and setup information, see:
- [Coding Agents Setup Guide](./coding-agents-setup.md)
- [Getting Started Guide](./getting-started.md)
- [API Documentation](../api/)