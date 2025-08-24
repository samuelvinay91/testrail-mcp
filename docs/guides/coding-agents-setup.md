# TestRail MCP Server - Coding Agents & Tools Integration Guide

This guide explains how to set up and integrate the TestRail MCP Server with various coding agents and development tools.

## Table of Contents
- [Claude Desktop](#claude-desktop)
- [Cursor IDE](#cursor-ide)
- [Windsurf IDE](#windsurf-ide)
- [Continue (VS Code Extension)](#continue-vs-code-extension)
- [Cody (Sourcegraph)](#cody-sourcegraph)
- [GitHub Copilot Chat](#github-copilot-chat)
- [JetBrains AI Assistant](#jetbrains-ai-assistant)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up with any coding agent, ensure you have:

1. **TestRail MCP Server installed and running**:
   ```bash
   git clone https://github.com/samuelvinay91/testrail-mcp.git
   cd testrail-mcp
   npm install
   npm run build
   ```

2. **TestRail credentials configured**:
   ```bash
   cp .env.example .env
   # Edit .env with your TestRail instance details
   ```

3. **Server running**:
   ```bash
   npm start
   # Server will be available on stdio transport
   ```

---

## Claude Desktop

### Setup Instructions

1. **Install Claude Desktop** from [Anthropic's website](https://claude.ai/desktop)

2. **Configure MCP Server** in Claude Desktop settings:
   
   **Location**: `~/.claude-desktop/config.json` (macOS/Linux) or `%APPDATA%\Claude\config.json` (Windows)

   ```json
   {
     "mcpServers": {
       "testrail": {
         "command": "node",
         "args": ["path/to/testrail-mcp-server/dist/index.js"],
         "env": {
           "TESTRAIL_BASE_URL": "https://yourcompany.testrail.io",
           "TESTRAIL_USERNAME": "your.email@company.com",
           "TESTRAIL_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Usage Examples

```
Hey Claude, can you help me:
1. Connect to TestRail and get all projects
2. Create a new test run for project ID 5
3. Generate a project dashboard for the QA team
```

---

## Cursor IDE

### Setup Instructions

1. **Install Cursor IDE** from [cursor.sh](https://cursor.sh)

2. **Configure MCP Integration**:
   
   Open Cursor Settings (`Cmd/Ctrl + ,`) → Extensions → MCP Configuration

   ```json
   {
     "mcp": {
       "servers": [
         {
           "name": "testrail",
           "command": "node",
           "args": ["./dist/index.js"],
           "cwd": "/path/to/testrail-mcp-server",
           "env": {
             "TESTRAIL_BASE_URL": "https://yourcompany.testrail.io",
             "TESTRAIL_USERNAME": "your.email@company.com",
             "TESTRAIL_API_KEY": "your-api-key"
           }
         }
       ]
     }
   }
   ```

3. **Enable MCP in Cursor Chat**:
   - Open Cursor Chat (`Cmd/Ctrl + L`)
   - Type `@testrail` to access TestRail tools

### Usage Examples

```
@testrail create a comprehensive test plan for our new mobile app feature

@testrail analyze the test case coverage for project "E-commerce Platform"

@testrail sync test results from our latest CI/CD pipeline
```

---

## Windsurf IDE

### Setup Instructions

1. **Install Windsurf IDE** from [codeium.com/windsurf](https://codeium.com/windsurf)

2. **Configure MCP Server**:
   
   Create `.windsurf/mcp-config.json` in your project root:

   ```json
   {
     "servers": {
       "testrail": {
         "command": "node",
         "args": ["path/to/testrail-mcp-server/dist/index.js"],
         "env": {
           "TESTRAIL_BASE_URL": "https://yourcompany.testrail.io",
           "TESTRAIL_USERNAME": "your.email@company.com",
           "TESTRAIL_API_KEY": "your-api-key"
         },
         "transport": "stdio"
       }
     }
   }
   ```

3. **Activate MCP Integration**:
   - Open Windsurf Chat panel
   - Use `/mcp testrail` to interact with TestRail

### Usage Examples

```
/mcp testrail get all active test runs for project "API Testing"

/mcp testrail create a test suite for user authentication flows

/mcp testrail generate a test execution report for the last sprint
```

---

## Continue (VS Code Extension)

### Setup Instructions

1. **Install Continue Extension** in VS Code

2. **Configure MCP Integration**:
   
   Edit `~/.continue/config.json`:

   ```json
   {
     "models": [
       {
         "title": "Claude 3.5 Sonnet",
         "provider": "anthropic",
         "model": "claude-3-5-sonnet-20241022",
         "apiKey": "your-anthropic-api-key"
       }
     ],
     "mcpServers": [
       {
         "name": "testrail",
         "command": "node",
         "args": ["path/to/testrail-mcp-server/dist/index.js"],
         "env": {
           "TESTRAIL_BASE_URL": "https://yourcompany.testrail.io",
           "TESTRAIL_USERNAME": "your.email@company.com",
           "TESTRAIL_API_KEY": "your-api-key"
         }
       }
     ]
   }
   ```

3. **Restart VS Code**

### Usage Examples

```
Can you help me create test cases in TestRail for this React component?

Use TestRail to track the test results for this API endpoint

Generate a test coverage report for our current sprint
```

---

## Cody (Sourcegraph)

### Setup Instructions

1. **Install Cody Extension** for your IDE (VS Code, JetBrains, etc.)

2. **Configure MCP Support**:
   
   Create `cody-mcp-config.json`:

   ```json
   {
     "mcpServers": {
       "testrail": {
         "command": "node",
         "args": ["path/to/testrail-mcp-server/dist/index.js"],
         "env": {
           "TESTRAIL_BASE_URL": "https://yourcompany.testrail.io",
           "TESTRAIL_USERNAME": "your.email@company.com",
           "TESTRAIL_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

3. **Enable MCP in Cody Settings**

### Usage Examples

```
@cody use TestRail to create test cases for this database migration

@cody analyze test failure patterns using TestRail data

@cody generate test documentation based on TestRail test cases
```

---

## GitHub Copilot Chat

### Setup Instructions

Since GitHub Copilot doesn't natively support MCP, you can use it indirectly:

1. **Create a wrapper script** (`testrail-wrapper.js`):

   ```javascript
   const { TestRailMCPTools } = require('./dist/tools/testrail-tools.js');
   
   class TestRailWrapper {
     constructor() {
       this.tools = new TestRailMCPTools();
     }
   
     async executeCommand(command, args) {
       try {
         const result = await this.tools[command](args);
         return JSON.stringify(result, null, 2);
       } catch (error) {
         return `Error: ${error.message}`;
       }
     }
   }
   
   module.exports = TestRailWrapper;
   ```

2. **Use in VS Code with Copilot Chat**:

   ```javascript
   // Ask Copilot to help you interact with TestRail
   const TestRailWrapper = require('./testrail-wrapper');
   const testrail = new TestRailWrapper();
   
   // Copilot can help generate these calls
   await testrail.executeCommand('getProjects', {});
   await testrail.executeCommand('createTestRun', {
     projectId: 1,
     name: 'API Tests - Sprint 23'
   });
   ```

---

## JetBrains AI Assistant

### Setup Instructions

1. **Enable AI Assistant** in your JetBrains IDE

2. **Create a TestRail integration plugin**:

   Create `testrail-plugin.kt` for IntelliJ:

   ```kotlin
   class TestRailMCPIntegration {
       private val mcpServer = ProcessBuilder(
           "node", 
           "path/to/testrail-mcp-server/dist/index.js"
       ).start()
   
       fun executeTestRailCommand(command: String, args: Map<String, Any>): String {
           // Implementation for MCP communication
           return sendMCPRequest(command, args)
       }
   }
   ```

3. **Configure environment variables** in IDE settings

### Usage Examples

```
Create TestRail test cases for this Java class

Update test results in TestRail for this test suite

Generate TestRail reports for code coverage analysis
```

---

## Docker-based Setup

For consistent environment across all tools:

### 1. Create Docker Compose for MCP Server

```yaml
# docker-compose.mcp.yml
version: '3.8'
services:
  testrail-mcp:
    build: .
    environment:
      - TESTRAIL_BASE_URL=${TESTRAIL_BASE_URL}
      - TESTRAIL_USERNAME=${TESTRAIL_USERNAME}
      - TESTRAIL_API_KEY=${TESTRAIL_API_KEY}
    ports:
      - "3000:3000"
    volumes:
      - ./logs:/app/logs
```

### 2. Universal Configuration

For any MCP-compatible tool:

```json
{
  "mcpServers": {
    "testrail": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", ".env",
        "testrail-mcp-server"
      ]
    }
  }
}
```

---

## Environment Variables

### Required Variables

```bash
# .env file
TESTRAIL_BASE_URL=https://yourcompany.testrail.io
TESTRAIL_USERNAME=your.email@company.com
TESTRAIL_API_KEY=your-api-key-here

# Optional
TESTRAIL_TIMEOUT=30000
LOG_LEVEL=info
MCP_SERVER_PORT=3000
```

### Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** or secure credential stores
3. **Rotate API keys** regularly
4. **Limit API key permissions** in TestRail
5. **Use HTTPS** for all TestRail communications

---

## Common Integration Patterns

### 1. Test Case Generation

```javascript
// Pattern for generating test cases from code
async function generateTestCasesFromCode(codeSnippet, projectId) {
  const testCases = await analyzeCodeForTestScenarios(codeSnippet);
  
  for (const testCase of testCases) {
    await testrail.createCase({
      sectionId: await getOrCreateSection(projectId, testCase.category),
      title: testCase.title,
      steps: testCase.steps,
      expectedResult: testCase.expected
    });
  }
}
```

### 2. CI/CD Integration

```javascript
// Pattern for CI/CD test result reporting
async function reportTestResults(projectId, runName, testResults) {
  const run = await testrail.createRun({
    projectId,
    name: runName,
    description: `Automated test run - ${new Date().toISOString()}`
  });
  
  const results = testResults.map(result => ({
    caseId: result.testCaseId,
    statusId: result.passed ? 1 : 5, // 1=Passed, 5=Failed
    comment: result.error || 'Test passed successfully'
  }));
  
  await testrail.addBulkResults({
    runId: run.id,
    results
  });
}
```

### 3. Real-time Monitoring

```javascript
// Pattern for monitoring test health
async function monitorTestHealth(projectId) {
  const dashboard = await testrail.generateProjectDashboard({
    projectId,
    includeTrends: true,
    includeTopFailures: true
  });
  
  if (dashboard.trends.trend_direction === 'declining') {
    await notifyTeam('Test health declining', dashboard);
  }
}
```

---

## Troubleshooting

### Common Issues

1. **Server not starting**:
   ```bash
   # Check Node.js version
   node --version  # Should be >= 16.0.0
   
   # Check dependencies
   npm install
   npm run build
   ```

2. **Authentication failures**:
   ```bash
   # Test connection manually
   curl -u "username:api_key" "https://yourcompany.testrail.io/index.php?/api/v2/get_user_by_email&email=your.email@company.com"
   ```

3. **MCP communication issues**:
   ```bash
   # Enable debug logging
   export LOG_LEVEL=debug
   npm start
   ```

4. **Tool-specific issues**:
   - **Claude Desktop**: Check config file syntax and restart
   - **Cursor**: Verify MCP extension is enabled
   - **Windsurf**: Ensure project-level config is correct
   - **VS Code**: Check Continue extension logs

### Debug Commands

```bash
# Test MCP server directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js

# Validate configuration
npm run validate-config

# Check logs
tail -f logs/testrail-mcp.log
```

### Performance Optimization

1. **Enable caching**:
   ```bash
   export ENABLE_CACHE=true
   export CACHE_TTL=300  # 5 minutes
   ```

2. **Batch operations**:
   ```javascript
   // Use bulk operations when possible
   await testrail.addBulkResults({ runId, results });
   ```

3. **Rate limiting**:
   ```bash
   export RATE_LIMIT_REQUESTS=100
   export RATE_LIMIT_WINDOW=60000  # 1 minute
   ```

---

## Advanced Configuration

### Custom Tool Development

Extend the MCP server with custom tools:

```typescript
// src/tools/custom-testrail-tools.ts
export class CustomTestRailTools extends TestRailMCPTools {
  async customAnalytics(input: CustomAnalyticsInput): Promise<CallToolResult> {
    // Your custom implementation
    return this.createSuccessResponse(results);
  }
}
```

### Webhook Integration

Set up real-time updates:

```javascript
// Webhook endpoint for TestRail events
app.post('/webhook/testrail', async (req, res) => {
  const event = req.body;
  
  // Process TestRail webhook and notify connected clients
  await notifyConnectedClients(event);
  
  res.status(200).send('OK');
});
```

### Multi-tenant Setup

Support multiple TestRail instances:

```json
{
  "mcpServers": {
    "testrail-prod": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "TESTRAIL_BASE_URL": "https://prod.testrail.io",
        "TESTRAIL_USERNAME": "prod@company.com",
        "TESTRAIL_API_KEY": "prod-api-key"
      }
    },
    "testrail-staging": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "TESTRAIL_BASE_URL": "https://staging.testrail.io",
        "TESTRAIL_USERNAME": "staging@company.com",
        "TESTRAIL_API_KEY": "staging-api-key"
      }
    }
  }
}
```

---

## Best Practices

1. **Version Management**: Pin MCP server version in production
2. **Monitoring**: Set up health checks and alerting
3. **Backup**: Regular backup of TestRail configuration
4. **Documentation**: Maintain tool-specific usage guides
5. **Testing**: Test integrations with each tool update

---

For more information, visit:
- [TestRail MCP Server GitHub Repository](https://github.com/samuelvinay91/testrail-mcp)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [TestRail API Documentation](https://www.gurock.com/testrail/docs/api)