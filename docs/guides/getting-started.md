# Getting Started with TestRail MCP Server

This guide will help you get up and running with the TestRail MCP Server quickly.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 16+** installed on your system
2. **TestRail instance** with API access enabled
3. **TestRail API key** (generated from your TestRail user account)
4. **MCP-compatible client** (such as Claude Desktop, Cline, or other MCP clients)

## Installation

### Option 1: Clone and Build

```bash
# Clone the repository
git clone https://github.com/your-username/testrail-mcp-server.git
cd testrail-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Option 2: Install from NPM (when published)

```bash
npm install -g testrail-mcp-server
```

## Configuration

### 1. Environment Setup

Create a `.env` file in the project root:

```env
# Required: TestRail connection
TESTRAIL_BASE_URL=https://your-company.testrail.io
TESTRAIL_USERNAME=your.email@company.com
TESTRAIL_API_KEY=your-api-key-here

# Optional: Server configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Optional: Default project settings
DEFAULT_PROJECT_ID=1
DEFAULT_SUITE_ID=1
```

### 2. Get Your TestRail API Key

1. Log into your TestRail instance
2. Go to **My Settings** (top-right corner)
3. Click on the **API Keys** tab
4. Generate a new API key
5. Copy the key to your `.env` file

## Quick Start

### 1. Start the Server

```bash
# Development mode
npm run dev

# Or production mode
npm start
```

You should see output like:
```
🚀 TestRail MCP Server running on stdio
📋 Available tools: 25
🔗 Ready to connect to TestRail!
```

### 2. Configure Your MCP Client

#### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "testrail": {
      "command": "node",
      "args": ["/path/to/testrail-mcp-server/dist/index.js"]
    }
  }
}
```

#### For Cline

Add to your MCP server configuration:

```json
{
  "name": "testrail",
  "type": "stdio",
  "command": "node",
  "args": ["/path/to/testrail-mcp-server/dist/index.js"]
}
```

### 3. Connect to TestRail

Use the `connect_testrail` tool with your credentials:

```json
{
  "baseUrl": "https://your-company.testrail.io",
  "username": "your.email@company.com",
  "apiKey": "your-api-key-here"
}
```

### 4. Test Your Connection

Use the `test_connection` tool to verify everything is working:

```json
{}
```

You should receive a successful response with your user information.

## Basic Workflow Examples

### Example 1: Create a New Test Case

1. **Get your project structure:**
   ```json
   // get_projects
   {}
   ```

2. **Get sections in your project:**
   ```json
   // get_sections
   {
     "projectId": 1
   }
   ```

3. **Create a new test case:**
   ```json
   // create_case
   {
     "sectionId": 1,
     "title": "Test user login functionality",
     "typeId": 6,
     "priorityId": 2,
     "preconditions": "User account exists",
     "steps": "1. Open login page\n2. Enter credentials\n3. Click login",
     "expectedResult": "User is logged in successfully"
   }
   ```

### Example 2: Create and Execute a Test Run

1. **Create a test run:**
   ```json
   // create_run
   {
     "projectId": 1,
     "name": "Sprint 15 Testing",
     "includeAll": false,
     "caseIds": [1, 2, 3]
   }
   ```

2. **Add test results:**
   ```json
   // add_result
   {
     "runId": 1,
     "caseId": 1,
     "statusId": 1,
     "comment": "Test passed successfully",
     "version": "1.2.3"
   }
   ```

3. **Add multiple results at once:**
   ```json
   // add_bulk_results
   {
     "runId": 1,
     "results": [
       {
         "caseId": 2,
         "statusId": 1,
         "comment": "Test 2 passed"
       },
       {
         "caseId": 3,
         "statusId": 5,
         "comment": "Test 3 failed",
         "defects": "BUG-123"
       }
     ]
   }
   ```

### Example 3: Generate Test Reports

```json
// generate_report
{
  "projectId": 1,
  "runId": 1,
  "format": "detailed"
}
```

## Common Use Cases

### 1. CI/CD Integration

Use the TestRail MCP Server to automatically update test results from your CI/CD pipeline:

```json
// add_bulk_results - Example from CI/CD
{
  "runId": 123,
  "results": [
    {
      "caseId": 1,
      "statusId": 1,
      "comment": "Automated test passed in build #456",
      "version": "1.2.3-build456",
      "elapsed": "30s"
    }
  ]
}
```

### 2. Test Planning

Create comprehensive test plans:

```json
// create_run
{
  "projectId": 1,
  "name": "Release 2.0 Testing",
  "description": "Comprehensive testing for release 2.0",
  "milestoneId": 5,
  "includeAll": true
}
```

### 3. Reporting and Analytics

Generate detailed reports for stakeholders:

```json
// generate_report
{
  "projectId": 1,
  "milestoneId": 5,
  "format": "summary",
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Connection Failed
```
Error: CONNECTION_FAILED - Unable to reach TestRail server
```

**Solutions:**
- Verify your `baseUrl` is correct and accessible
- Check your network connection
- Ensure TestRail instance is online

#### 2. Authentication Failed
```
Error: AUTHENTICATION_FAILED - Invalid credentials
```

**Solutions:**
- Verify your username (email) is correct
- Check that your API key is valid and not expired
- Ensure your user has API access enabled

#### 3. Permission Denied
```
Error: PERMISSION_DENIED - Insufficient permissions
```

**Solutions:**
- Check your user permissions in TestRail
- Ensure you have access to the project you're trying to modify
- Contact your TestRail administrator

#### 4. Tool Not Found
```
Error: Unknown tool: tool_name
```

**Solutions:**
- Check the tool name spelling
- Ensure you're using the latest version
- Refer to the API documentation for correct tool names

### Debug Mode

Enable debug logging for troubleshooting:

```env
LOG_LEVEL=debug
```

This will show detailed request/response information.

### Validation Errors

The server provides detailed validation errors:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "field": "title",
        "message": "Field 'title' is required"
      }
    ]
  }
}
```

## Best Practices

### 1. Error Handling

Always check the `success` field in responses:

```javascript
const response = await callTool('get_projects', {});
if (response.success) {
  // Handle success
  const projects = response.data.projects;
} else {
  // Handle error
  console.error('Error:', response.error);
}
```

### 2. Batch Operations

Use bulk operations when possible:

```json
// Good: Add multiple results at once
{
  "tool": "add_bulk_results",
  "runId": 1,
  "results": [/* multiple results */]
}

// Avoid: Multiple individual calls
// add_result, add_result, add_result...
```

### 3. Filtering and Pagination

Use filters to reduce response size:

```json
{
  "projectId": 1,
  "limit": 100,
  "filter": {
    "priority_id": [3, 4]  // Only high/critical priority
  }
}
```

### 4. Status ID Reference

Remember the standard TestRail status IDs:
- `1` = Passed
- `2` = Blocked
- `3` = Untested
- `4` = Retest
- `5` = Failed

## Next Steps

- Explore the [API Documentation](../api/README.md) for detailed tool reference
- Check out [Advanced Examples](../examples/) for complex scenarios
- Review [Best Practices](./best-practices.md) for optimal usage
- Join our community for support and discussions

## Support

- **Documentation**: [docs/](../)
- **Examples**: [examples/](../../examples/)
- **Issues**: [GitHub Issues](https://github.com/your-username/testrail-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/testrail-mcp-server/discussions)