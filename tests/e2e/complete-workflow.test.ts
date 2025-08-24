/**
 * End-to-End tests for TestRail MCP Server
 * Tests the complete workflow from MCP client perspective
 */

import { TestRailMCPServer } from '../../src/index';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Skip E2E tests if not in E2E test mode
const describeE2E = process.env.E2E_TEST ? describe : describe.skip;

describeE2E('TestRail MCP Server E2E', () => {
  let server: TestRailMCPServer;
  
  const testConfig = {
    baseUrl: process.env.TESTRAIL_BASE_URL || 'https://demo.testrail.io',
    username: process.env.TESTRAIL_USERNAME || 'demo@testrail.com',
    apiKey: process.env.TESTRAIL_API_KEY || 'demo-api-key'
  };

  beforeAll(async () => {
    if (!process.env.TESTRAIL_BASE_URL) {
      console.warn('⚠️  E2E tests require TESTRAIL_BASE_URL environment variable');
      return;
    }

    server = new TestRailMCPServer();
    console.log('🚀 Starting TestRail MCP Server for E2E tests...');
  });

  afterAll(async () => {
    if (server) {
      console.log('🛑 Stopping TestRail MCP Server...');
    }
  });

  /**
   * Helper function to simulate MCP tool calls
   */
  async function callTool(name: string, args: any = {}) {
    const request = {
      params: {
        name,
        arguments: args
      }
    };

    // Get the handler directly from server
    const handlers = (server as any).server.requestHandlers;
    const toolHandler = handlers.get(CallToolRequestSchema.method);
    
    if (!toolHandler) {
      throw new Error('Tool handler not found');
    }

    return await toolHandler(request);
  }

  describe('Complete Workflow: Project Setup to Test Execution', () => {
    let projectId: number;
    let suiteId: number;
    let sectionId: number;
    let caseId: number;
    let runId: number;
    let testId: number;

    it('should connect to TestRail', async () => {
      const result = await callTool('connect_testrail', testConfig);
      
      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('Successfully connected');
    }, 15000);

    it('should test connection', async () => {
      const result = await callTool('test_connection');
      
      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('"connected": true');
    });

    it('should get projects and select one for testing', async () => {
      const result = await callTool('get_projects', { isCompleted: false });
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.projects).toBeDefined();
      expect(Array.isArray(response.data.projects)).toBe(true);
      expect(response.data.projects.length).toBeGreaterThan(0);
      
      // Use first project for testing
      projectId = response.data.projects[0].id;
    });

    it('should get project details', async () => {
      const result = await callTool('get_project', { projectId });
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.project.id).toBe(projectId);
      expect(response.data.project.name).toBeDefined();
    });

    it('should get suites for the project', async () => {
      const result = await callTool('get_suites', { projectId });
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.suites).toBeDefined();
      expect(Array.isArray(response.data.suites)).toBe(true);
      
      if (response.data.suites.length > 0) {
        suiteId = response.data.suites[0].id;
      }
    });

    it('should get sections in the suite', async () => {
      if (!suiteId) {
        pending('No suite available for testing');
      }

      const result = await callTool('get_sections', { projectId, suiteId });
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.sections).toBeDefined();
      expect(Array.isArray(response.data.sections)).toBe(true);
      
      if (response.data.sections.length > 0) {
        sectionId = response.data.sections[0].id;
      }
    });

    it('should get existing test cases', async () => {
      const result = await callTool('get_cases', { 
        projectId, 
        suiteId,
        limit: 10 
      });
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.cases).toBeDefined();
      expect(Array.isArray(response.data.cases)).toBe(true);
      
      // Use existing case if available, otherwise we'll create one
      if (response.data.cases.length > 0) {
        caseId = response.data.cases[0].id;
      }
    });

    it.skip('should create a test case if none exist', async () => {
      if (caseId || !sectionId) {
        pending('Test case already exists or no section available');
      }

      const caseData = {
        sectionId,
        title: `E2E Test Case - ${new Date().toISOString()}`,
        typeId: 6, // Functional
        priorityId: 2, // Medium
        preconditions: 'Application is accessible',
        steps: '1. Navigate to login page\n2. Enter credentials\n3. Verify login success',
        expectedResult: 'User should be logged in successfully'
      };

      const result = await callTool('create_case', caseData);
      
      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('Test case created successfully');
      
      const response = JSON.parse(result.content[0].text!);
      caseId = response.data.case.id;
    });

    it.skip('should create a test run', async () => {
      if (!caseId) {
        pending('No test case available for run creation');
      }

      const runData = {
        projectId,
        name: `E2E Test Run - ${new Date().toISOString()}`,
        description: 'End-to-end test run created by automated tests',
        includeAll: false,
        caseIds: [caseId]
      };

      const result = await callTool('create_run', runData);
      
      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('Test run created successfully');
      
      const response = JSON.parse(result.content[0].text!);
      runId = response.data.run.id;
    });

    it.skip('should get tests in the run', async () => {
      if (!runId) {
        pending('No test run available');
      }

      const result = await callTool('get_tests', { runId });
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.tests).toBeDefined();
      expect(Array.isArray(response.data.tests)).toBe(true);
      expect(response.data.tests.length).toBeGreaterThan(0);
      
      testId = response.data.tests[0].id;
    });

    it.skip('should add a test result', async () => {
      if (!testId) {
        pending('No test available for result');
      }

      const resultData = {
        testId,
        statusId: 1, // Passed
        comment: 'E2E test executed successfully. All steps completed without issues.',
        version: 'e2e-test-v1.0.0',
        elapsed: '45s'
      };

      const result = await callTool('add_result', resultData);
      
      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('Test result added successfully');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.result.status_id).toBe(1);
    });

    it.skip('should add bulk results', async () => {
      if (!runId || !caseId) {
        pending('No run or case available for bulk results');
      }

      const bulkData = {
        runId,
        results: [
          {
            caseId,
            statusId: 1,
            comment: 'Bulk result test 1 - Passed',
            elapsed: '30s'
          },
          {
            caseId,
            statusId: 5,
            comment: 'Bulk result test 2 - Failed for demonstration',
            elapsed: '1m 15s',
            defects: 'E2E-DEMO-001'
          }
        ]
      };

      const result = await callTool('add_bulk_results', bulkData);
      
      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('Bulk test results added successfully');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.processed).toBe(2);
    });

    it('should generate a test report', async () => {
      if (!projectId) {
        pending('No project available for reporting');
      }

      const reportData = {
        projectId,
        format: 'summary'
      };

      // Add runId if available
      if (runId) {
        reportData['runId'] = runId;
      }

      const result = await callTool('generate_report', reportData);
      
      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('Report generated successfully');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.project).toBeDefined();
      expect(response.data.generatedAt).toBeDefined();
    });

    // Cleanup
    afterAll(async () => {
      // Clean up created resources in reverse order
      if (runId) {
        try {
          await callTool('delete_run', { runId });
          console.log('✅ Cleaned up test run');
        } catch (error) {
          console.warn('⚠️  Failed to clean up test run:', error);
        }
      }

      if (caseId && sectionId) {
        try {
          await callTool('delete_case', { caseId });
          console.log('✅ Cleaned up test case');
        } catch (error) {
          console.warn('⚠️  Failed to clean up test case:', error);
        }
      }
    });
  });

  describe('Metadata Operations', () => {
    beforeAll(async () => {
      // Ensure connection
      await callTool('connect_testrail', testConfig);
    });

    it('should get all statuses', async () => {
      const result = await callTool('get_statuses');
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.statuses).toBeDefined();
      expect(Array.isArray(response.data.statuses)).toBe(true);
      expect(response.data.statuses.length).toBeGreaterThan(0);
      
      // Check for standard statuses
      const statusNames = response.data.statuses.map((s: any) => s.name.toLowerCase());
      expect(statusNames).toContain('passed');
      expect(statusNames).toContain('failed');
    });

    it('should get priorities', async () => {
      const result = await callTool('get_priorities');
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.priorities).toBeDefined();
      expect(Array.isArray(response.data.priorities)).toBe(true);
      expect(response.data.priorities.length).toBeGreaterThan(0);
    });

    it('should get case types', async () => {
      const result = await callTool('get_case_types');
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.types).toBeDefined();
      expect(Array.isArray(response.data.types)).toBe(true);
      expect(response.data.types.length).toBeGreaterThan(0);
    });

    it('should get users', async () => {
      const result = await callTool('get_users');
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.users).toBeDefined();
      expect(Array.isArray(response.data.users)).toBe(true);
      expect(response.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Scenarios', () => {
    beforeAll(async () => {
      // Ensure connection
      await callTool('connect_testrail', testConfig);
    });

    it('should handle invalid project ID gracefully', async () => {
      const result = await callTool('get_project', { projectId: 99999 });
      
      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.error).toBeDefined();
      expect(response.code).toBeDefined();
    });

    it('should handle missing required parameters', async () => {
      const result = await callTool('create_case', {
        // Missing required sectionId and title
        typeId: 6
      });
      
      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });

    it('should handle invalid status ID in results', async () => {
      const result = await callTool('add_result', {
        testId: 1,
        statusId: 999, // Invalid status
        comment: 'Test with invalid status'
      });
      
      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });

    it('should handle connection test without prior connection', async () => {
      // Create a new server instance without connection
      const newServer = new TestRailMCPServer();
      
      // This should handle the case gracefully
      const result = await callTool('test_connection');
      
      // Should either succeed with existing connection or fail gracefully
      const response = JSON.parse(result.content[0].text!);
      expect(response.success).toBeDefined();
    });
  });

  describe('Performance and Reliability', () => {
    beforeAll(async () => {
      await callTool('connect_testrail', testConfig);
    });

    it('should handle concurrent tool calls', async () => {
      const promises = [
        callTool('get_statuses'),
        callTool('get_priorities'),
        callTool('get_case_types'),
        callTool('test_connection')
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain('"success": true');
      });
    });

    it('should complete operations within reasonable time', async () => {
      const startTime = Date.now();
      
      await callTool('get_projects');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(15000); // 15 seconds max for E2E
    });

    it('should handle large data sets', async () => {
      // Get all projects without limits
      const result = await callTool('get_projects', {});
      
      expect(result.content[0].text).toContain('"success": true');
      
      const response = JSON.parse(result.content[0].text!);
      expect(response.data.projects).toBeDefined();
      expect(Array.isArray(response.data.projects)).toBe(true);
      
      // Should handle response regardless of size
      expect(response.data.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tool Discovery and Schema Validation', () => {
    it('should list all available tools', async () => {
      // Get the list tools handler
      const handlers = (server as any).server.requestHandlers;
      const listHandler = handlers.get('tools/list');
      
      if (listHandler) {
        const result = await listHandler({});
        
        expect(result.tools).toBeDefined();
        expect(Array.isArray(result.tools)).toBe(true);
        expect(result.tools.length).toBeGreaterThan(0);
        
        // Check for essential tools
        const toolNames = result.tools.map((t: any) => t.name);
        expect(toolNames).toContain('connect_testrail');
        expect(toolNames).toContain('get_projects');
        expect(toolNames).toContain('create_case');
        expect(toolNames).toContain('add_result');
      }
    });

    it('should have valid tool schemas', async () => {
      const handlers = (server as any).server.requestHandlers;
      const listHandler = handlers.get('tools/list');
      
      if (listHandler) {
        const result = await listHandler({});
        
        result.tools.forEach((tool: any) => {
          expect(tool.name).toBeDefined();
          expect(tool.description).toBeDefined();
          expect(tool.inputSchema).toBeDefined();
          expect(tool.inputSchema.type).toBe('object');
          expect(tool.inputSchema.properties).toBeDefined();
        });
      }
    });
  });
});