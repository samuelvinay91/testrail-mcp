/**
 * Integration tests for TestRail MCP Server
 * These tests require a real TestRail instance or mock server
 */

import { TestRailMCPServer } from '../../src/index';
import { TestRailService } from '../../src/utils/testrail-service';

// Skip integration tests if not in integration test mode
const describeIntegration = process.env.INTEGRATION_TEST ? describe : describe.skip;

describeIntegration('TestRail MCP Server Integration', () => {
  let server: TestRailMCPServer;
  
  const testConfig = {
    baseUrl: process.env.TESTRAIL_BASE_URL || 'https://demo.testrail.io',
    username: process.env.TESTRAIL_USERNAME || 'demo@testrail.com',
    apiKey: process.env.TESTRAIL_API_KEY || 'demo-api-key'
  };

  beforeAll(async () => {
    if (!process.env.TESTRAIL_BASE_URL) {
      console.warn('⚠️  Integration tests require TESTRAIL_BASE_URL environment variable');
      return;
    }

    server = new TestRailMCPServer();
    console.log('🚀 Starting TestRail MCP Server for integration tests...');
  });

  afterAll(async () => {
    if (server) {
      console.log('🛑 Stopping TestRail MCP Server...');
      // Clean up any test data if needed
    }
  });

  describe('Connection and Authentication', () => {
    it('should connect to TestRail successfully', async () => {
      const service = new TestRailService(testConfig);
      const connectionTest = await service.testConnection();
      
      expect(connectionTest.connected).toBe(true);
      expect(connectionTest.user).toBeDefined();
      expect(connectionTest.user?.email).toBe(testConfig.username);
    }, 10000);

    it('should handle invalid credentials', async () => {
      const invalidConfig = {
        ...testConfig,
        apiKey: 'invalid-key'
      };
      
      const service = new TestRailService(invalidConfig);
      const connectionTest = await service.testConnection();
      
      expect(connectionTest.connected).toBe(false);
      expect(connectionTest.error).toBeDefined();
    });
  });

  describe('Project Operations', () => {
    let service: TestRailService;
    let testProjectId: number;

    beforeAll(async () => {
      service = new TestRailService(testConfig);
      await service.testConnection();
    });

    it('should get existing projects', async () => {
      const projects = await service.getProjects();
      
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      
      // Use the first project for subsequent tests
      testProjectId = projects[0].id;
    });

    it('should get specific project details', async () => {
      const project = await service.getProject(testProjectId);
      
      expect(project).toBeDefined();
      expect(project.id).toBe(testProjectId);
      expect(project.name).toBeDefined();
    });

    it('should handle non-existent project', async () => {
      await expect(service.getProject(99999)).rejects.toThrow();
    });
  });

  describe('Suite and Section Operations', () => {
    let service: TestRailService;
    let testProjectId: number;
    let testSuiteId: number;

    beforeAll(async () => {
      service = new TestRailService(testConfig);
      await service.testConnection();
      
      const projects = await service.getProjects();
      testProjectId = projects[0].id;
    });

    it('should get suites for project', async () => {
      const suites = await service.getSuites(testProjectId);
      
      expect(Array.isArray(suites)).toBe(true);
      
      if (suites.length > 0) {
        testSuiteId = suites[0].id;
        expect(suites[0].project_id).toBe(testProjectId);
      }
    });

    it('should get sections for project', async () => {
      const sections = await service.getSections(testProjectId, testSuiteId);
      
      expect(Array.isArray(sections)).toBe(true);
      // Sections may be empty for new projects
    });
  });

  describe('Test Case Operations', () => {
    let service: TestRailService;
    let testProjectId: number;
    let testSuiteId: number;
    let createdCaseId: number;

    beforeAll(async () => {
      service = new TestRailService(testConfig);
      await service.testConnection();
      
      const projects = await service.getProjects();
      testProjectId = projects[0].id;
      
      const suites = await service.getSuites(testProjectId);
      if (suites.length > 0) {
        testSuiteId = suites[0].id;
      }
    });

    it('should get existing test cases', async () => {
      const cases = await service.getCases(testProjectId, testSuiteId);
      
      expect(Array.isArray(cases)).toBe(true);
      // Cases may be empty for new projects
    });

    // Note: Creating test cases requires write permissions
    // These tests should only run in a test environment
    it.skip('should create new test case', async () => {
      // Get sections first
      const sections = await service.getSections(testProjectId, testSuiteId);
      
      if (sections.length === 0) {
        // Create a section first
        const newSection = await service.addSection(testProjectId, {
          name: 'Integration Test Section',
          description: 'Created by integration tests'
        });
        sections.push(newSection);
      }

      const caseData = {
        title: `Integration Test Case - ${new Date().toISOString()}`,
        template_id: 1,
        type_id: 6, // Functional
        priority_id: 2, // Medium
        custom_preconds: 'Test environment is available',
        custom_steps: '1. Open application\n2. Perform action\n3. Verify result',
        custom_expected: 'Action completes successfully'
      };

      const createdCase = await service.addCase(sections[0].id, caseData);
      createdCaseId = createdCase.id;
      
      expect(createdCase).toBeDefined();
      expect(createdCase.title).toBe(caseData.title);
      expect(createdCase.section_id).toBe(sections[0].id);
    });

    it.skip('should update test case', async () => {
      if (!createdCaseId) {
        pending('No test case created to update');
      }

      const updateData = {
        title: `Updated Test Case - ${new Date().toISOString()}`,
        priority_id: 3 // High priority
      };

      const updatedCase = await service.updateCase(createdCaseId, updateData);
      
      expect(updatedCase.title).toBe(updateData.title);
      expect(updatedCase.priority_id).toBe(updateData.priority_id);
    });

    afterAll(async () => {
      // Clean up created test case
      if (createdCaseId) {
        try {
          await service.deleteCase(createdCaseId);
        } catch (error) {
          console.warn('Failed to clean up test case:', error);
        }
      }
    });
  });

  describe('Test Run and Result Operations', () => {
    let service: TestRailService;
    let testProjectId: number;
    let testSuiteId: number;
    let createdRunId: number;

    beforeAll(async () => {
      service = new TestRailService(testConfig);
      await service.testConnection();
      
      const projects = await service.getProjects();
      testProjectId = projects[0].id;
      
      const suites = await service.getSuites(testProjectId);
      if (suites.length > 0) {
        testSuiteId = suites[0].id;
      }
    });

    it('should get existing test runs', async () => {
      const runs = await service.getRuns(testProjectId);
      
      expect(Array.isArray(runs)).toBe(true);
      // Runs may be empty for new projects
    });

    it.skip('should create new test run', async () => {
      const runData = {
        name: `Integration Test Run - ${new Date().toISOString()}`,
        description: 'Created by integration tests',
        include_all: true
      };

      const createdRun = await service.addRun(testProjectId, runData);
      createdRunId = createdRun.id;
      
      expect(createdRun).toBeDefined();
      expect(createdRun.name).toBe(runData.name);
      expect(createdRun.project_id).toBe(testProjectId);
    });

    it.skip('should get tests in run', async () => {
      if (!createdRunId) {
        pending('No test run created');
      }

      const tests = await service.getTests(createdRunId);
      
      expect(Array.isArray(tests)).toBe(true);
      // Tests array length depends on test cases in the project
    });

    it.skip('should add test results', async () => {
      if (!createdRunId) {
        pending('No test run created');
      }

      const tests = await service.getTests(createdRunId);
      
      if (tests.length === 0) {
        pending('No tests in run to add results to');
      }

      const resultData = {
        status_id: 1, // Passed
        comment: 'Integration test result',
        elapsed: '30s'
      };

      const result = await service.addResult(tests[0].id, resultData);
      
      expect(result).toBeDefined();
      expect(result.status_id).toBe(1);
      expect(result.test_id).toBe(tests[0].id);
    });

    afterAll(async () => {
      // Clean up created test run
      if (createdRunId) {
        try {
          await service.deleteRun(createdRunId);
        } catch (error) {
          console.warn('Failed to clean up test run:', error);
        }
      }
    });
  });

  describe('Metadata Operations', () => {
    let service: TestRailService;

    beforeAll(async () => {
      service = new TestRailService(testConfig);
      await service.testConnection();
    });

    it('should get test statuses', async () => {
      const statuses = await service.getStatuses();
      
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
      
      // Check for standard statuses
      const statusNames = statuses.map(s => s.name.toLowerCase());
      expect(statusNames).toContain('passed');
      expect(statusNames).toContain('failed');
    });

    it('should get case priorities', async () => {
      const priorities = await service.getPriorities();
      
      expect(Array.isArray(priorities)).toBe(true);
      expect(priorities.length).toBeGreaterThan(0);
    });

    it('should get case types', async () => {
      const types = await service.getCaseTypes();
      
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should get users', async () => {
      const users = await service.getUsers();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      
      // Should include the authenticated user
      const currentUser = users.find(u => u.email === testConfig.username);
      expect(currentUser).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    let service: TestRailService;

    beforeAll(async () => {
      service = new TestRailService(testConfig);
      await service.testConnection();
    });

    it('should handle invalid project ID', async () => {
      await expect(service.getProject(99999)).rejects.toMatchObject({
        code: expect.any(Number),
        error: expect.stringContaining('not found')
      });
    });

    it('should handle invalid suite ID', async () => {
      await expect(service.getSuite(99999)).rejects.toMatchObject({
        code: expect.any(Number)
      });
    });

    it('should handle network timeouts', async () => {
      const slowService = new TestRailService({
        ...testConfig,
        timeout: 1 // Very short timeout
      });

      await expect(slowService.getProjects()).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    let service: TestRailService;

    beforeAll(async () => {
      service = new TestRailService(testConfig);
      await service.testConnection();
    });

    it('should handle concurrent requests', async () => {
      const requests = [
        service.getProjects(),
        service.getStatuses(),
        service.getPriorities(),
        service.getCaseTypes()
      ];

      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should complete basic operations within reasonable time', async () => {
      const startTime = Date.now();
      
      await service.getProjects();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });
  });
});