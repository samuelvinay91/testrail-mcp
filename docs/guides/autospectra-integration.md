# AutoSpectra-TestRail Integration Guide

This guide demonstrates how to integrate AutoSpectra test automation framework with TestRail using the TestRail MCP Server.

## 🚀 Quick Start

### 1. Setup TestRail MCP Server

```bash
cd testrail-mcp-server
npm install
cp .env.example .env
```

Edit `.env` with your TestRail credentials:
```env
TESTRAIL_BASE_URL=https://yourcompany.testrail.io
TESTRAIL_USERNAME=automation@yourcompany.com
TESTRAIL_API_KEY=your-api-key-here
```

### 2. Basic AutoSpectra Integration

```typescript
import { AutoSpectraBridge } from './src/integration/autospectra-bridge';

// Initialize the bridge
const bridge = new AutoSpectraBridge();

// Connect to TestRail
await bridge.connect({
  baseUrl: 'https://yourcompany.testrail.io',
  username: 'automation@yourcompany.com',
  apiKey: 'your-api-key',
  projectId: 1
});

// Sync test results
const result = await bridge.autoSync(projectId, testSuite, {
  createCasesIfMissing: true,
  milestoneId: 15,
  environment: 'staging'
});
```

## 📋 AutoSpectra Test Suite Format

Your AutoSpectra test results should follow this format:

```typescript
interface AutoSpectraTestSuite {
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

interface AutoSpectraTestResult {
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
```

## 🔧 Integration Examples

### Example 1: Basic Test Result Sync

```typescript
import { AutoSpectraBridge } from 'testrail-mcp-server/integration';

async function syncTestResults() {
  const bridge = new AutoSpectraBridge();
  
  // Connect to TestRail
  await bridge.connect({
    baseUrl: process.env.TESTRAIL_URL,
    username: process.env.TESTRAIL_USERNAME,
    apiKey: process.env.TESTRAIL_API_KEY,
    projectId: 1
  });

  // Prepare test suite data
  const testSuite = {
    suiteId: 'login-tests-001',
    name: 'Login Functionality Tests',
    results: [
      {
        testId: 'login-valid-001',
        title: 'User can login with valid credentials',
        status: 'passed',
        duration: 2500,
        metadata: {
          framework: 'Playwright',
          browser: 'Chrome',
          environment: 'staging',
          buildNumber: 'v1.2.3-456'
        }
      },
      {
        testId: 'login-invalid-001',
        title: 'User cannot login with invalid credentials',
        status: 'failed',
        duration: 1800,
        error: 'Expected error message not displayed',
        screenshots: ['login-failed.png'],
        metadata: {
          framework: 'Playwright',
          browser: 'Chrome',
          environment: 'staging'
        }
      }
    ],
    summary: {
      total: 2,
      passed: 1,
      failed: 1,
      skipped: 0,
      blocked: 0,
      duration: 4300
    }
  };

  // Sync with TestRail
  const result = await bridge.autoSync(1, testSuite, {
    createCasesIfMissing: true,
    milestoneId: 15,
    environment: 'staging',
    buildNumber: 'v1.2.3-456'
  });

  console.log('Sync Result:', result);
}
```

### Example 2: CI/CD Pipeline Integration

#### GitHub Actions

```yaml
name: Test Execution with TestRail Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm ci
        cd testrail-mcp-server && npm ci
        
    - name: Run AutoSpectra tests
      run: npm test
      
    - name: Sync results to TestRail
      env:
        TESTRAIL_URL: ${{ secrets.TESTRAIL_URL }}
        TESTRAIL_USERNAME: ${{ secrets.TESTRAIL_USERNAME }}
        TESTRAIL_API_KEY: ${{ secrets.TESTRAIL_API_KEY }}
        GITHUB_RUN_NUMBER: ${{ github.run_number }}
        GITHUB_REF_NAME: ${{ github.ref_name }}
        GITHUB_SHA: ${{ github.sha }}
        GITHUB_ACTOR: ${{ github.actor }}
      run: |
        node -e "
        const { CIPipelineIntegration } = require('./testrail-mcp-server/src/integration/integration-examples');
        const pipeline = new CIPipelineIntegration(1);
        
        (async () => {
          await pipeline.initializeForPipeline();
          await pipeline.processTestResults('./test-results.json', {
            buildNumber: process.env.GITHUB_RUN_NUMBER,
            branch: process.env.GITHUB_REF_NAME,
            commit: process.env.GITHUB_SHA,
            environment: 'ci'
          });
        })().catch(console.error);
        "
```

#### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    environment {
        TESTRAIL_PROJECT_ID = '1'
        TESTRAIL_URL = credentials('testrail-url')
        TESTRAIL_USERNAME = credentials('testrail-username')
        TESTRAIL_API_KEY = credentials('testrail-api-key')
    }
    
    stages {
        stage('Test') {
            steps {
                script {
                    // Run AutoSpectra tests
                    sh 'npm test'
                    
                    // Sync with TestRail
                    sh '''
                        node -e "
                        const { CIPipelineIntegration } = require('./testrail-mcp-server/src/integration/integration-examples');
                        const pipeline = new CIPipelineIntegration(${TESTRAIL_PROJECT_ID});
                        
                        (async () => {
                          await pipeline.initializeForPipeline();
                          await pipeline.processTestResults('./test-results.json', {
                            buildNumber: '${BUILD_NUMBER}',
                            branch: '${BRANCH_NAME}',
                            commit: '${GIT_COMMIT}',
                            environment: 'jenkins'
                          });
                        })().catch(console.error);
                        "
                    '''
                }
            }
        }
    }
    
    post {
        always {
            // Archive test results
            archiveArtifacts artifacts: 'test-results.json', fingerprint: true
        }
    }
}
```

### Example 3: Real-time Test Monitoring

```typescript
import { RealTimeMonitor } from 'testrail-mcp-server/integration';

async function startRealTimeMonitoring() {
  const monitor = new RealTimeMonitor();
  
  // Start monitoring project
  await monitor.startMonitoring(1);
  
  // Monitor will automatically sync test results as they complete
  console.log('Real-time monitoring started...');
}

// Start monitoring
startRealTimeMonitoring().catch(console.error);
```

## 🔧 Advanced Configuration

### Custom Case Mapping

```typescript
import { IntegrationUtils } from 'testrail-mcp-server/integration';

// Define mapping between AutoSpectra test IDs and TestRail case IDs
const caseMapping = IntegrationUtils.generateCaseMapping({
  'login-valid-001': 101,
  'login-invalid-001': 102,
  'dashboard-load-001': 201,
  'user-profile-001': 301
});

// Use in manual sync
await bridge.submitResults(testSuite, caseMapping, {
  closeRun: true,
  addDefects: true
});
```

### Environment-specific Configuration

```typescript
const integrationConfig = {
  development: {
    testrail: {
      projectId: 1,
      milestoneId: null,
      autoCreateCases: true,
      autoCloseRuns: false
    },
    autospectra: {
      outputPath: './dev-test-results',
      environment: 'development'
    }
  },
  staging: {
    testrail: {
      projectId: 1,
      milestoneId: 10,
      autoCreateCases: true,
      autoCloseRuns: true
    },
    autospectra: {
      outputPath: './staging-test-results',
      environment: 'staging'
    }
  },
  production: {
    testrail: {
      projectId: 2,
      milestoneId: 20,
      autoCreateCases: false,
      autoCloseRuns: true
    },
    autospectra: {
      outputPath: './prod-test-results',
      environment: 'production'
    }
  }
};
```

## 📊 Dashboard Integration

### Generate TestRail Dashboard

```typescript
import { generateAdvancedDashboard } from 'testrail-mcp-server/integration';

async function createDashboard() {
  const dashboard = await generateAdvancedDashboard(1);
  
  console.log('Project Statistics:', dashboard.statistics);
  console.log('Test Trends:', dashboard.trends);
  console.log('Top Failures:', dashboard.top_failures);
}
```

## 🐛 Troubleshooting

### Common Issues

**1. Connection Failed**
```
Error: Failed to connect to TestRail
```
- Verify TestRail URL, username, and API key
- Check network connectivity
- Ensure API access is enabled in TestRail

**2. Case Creation Failed**
```
Error: Failed to create test case
```
- Check project permissions
- Verify section ID exists
- Ensure required fields are provided

**3. Result Submission Failed**
```
Error: Test case not found
```
- Verify case mapping is correct
- Check if cases exist in TestRail
- Enable auto-creation of missing cases

### Debug Mode

Enable debug logging:

```typescript
// Set debug environment variable
process.env.DEBUG = 'testrail-mcp:*';

// Or enable in code
const bridge = new AutoSpectraBridge();
bridge.enableDebugMode();
```

### Validation

Validate TestRail connection:

```typescript
import { IntegrationUtils } from 'testrail-mcp-server/integration';

const isValid = await IntegrationUtils.validateConnection({
  baseUrl: 'https://yourcompany.testrail.io',
  username: 'automation@yourcompany.com',
  apiKey: 'your-api-key',
  projectId: 1
});

console.log('Connection valid:', isValid);
```

## 📈 Best Practices

### 1. Test Organization
- Use descriptive test IDs that map to requirements
- Group related tests in logical suites
- Include comprehensive test metadata

### 2. Error Handling
- Implement retry logic for network failures
- Log detailed error information
- Use graceful degradation for non-critical failures

### 3. Performance
- Use bulk operations for multiple results
- Implement rate limiting for API calls
- Cache frequently accessed data

### 4. Security
- Store credentials securely (environment variables)
- Use encrypted connections (HTTPS)
- Implement audit logging

### 5. Maintenance
- Regular cleanup of old test runs
- Monitor API rate limits
- Keep test case mappings updated

## 🔗 Related Documentation

- [TestRail API Documentation](https://www.gurock.com/testrail/docs/api)
- [AutoSpectra Framework](../autospectra/)
- [MCP Server Configuration](./configuration.md)
- [Advanced Reporting](./reporting.md)

## 💡 Examples Repository

Check out the [examples directory](../../examples/) for more integration examples:

- [Basic Integration](../../examples/basic/common-operations.js)
- [Advanced Workflows](../../examples/advanced/enterprise-workflows.js)
- [CI/CD Templates](../../examples/cicd/)
- [Custom Reporters](../../examples/reporters/)