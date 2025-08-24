/**
 * Unit Tests for TestRail MCP Tools
 */

import { jest } from '@jest/globals';
import { TestRailMCPTools } from '../../src/tools/testrail-tools';
import { TestRailService } from '../../src/utils/testrail-service';
import { TestRailErrorCodes } from '../../src/types';

// Mock the TestRail service
jest.mock('../../src/utils/testrail-service');

describe('TestRailMCPTools', () => {
  let tools: TestRailMCPTools;
  let mockTestRailService: jest.Mocked<TestRailService>;

  beforeEach(() => {
    tools = new TestRailMCPTools();
    mockTestRailService = {
      testConnection: jest.fn(),
      getProjects: jest.fn(),
      addProject: jest.fn(),
      getCases: jest.fn(),
      addCase: jest.fn(),
      updateCase: jest.fn(),
      deleteCase: jest.fn(),
      addRun: jest.fn(),
      closeRun: jest.fn(),
      addResult: jest.fn(),
      addResultForCase: jest.fn(),
      addResults: jest.fn(),
      addResultsForCases: jest.fn(),
      getUsers: jest.fn(),
      getStatuses: jest.fn()
    } as any;

    // Mock the private testRailService property
    (tools as any).testRailService = mockTestRailService;
  });

  describe('Connection Management', () => {
    describe('connectTestRail', () => {
      it('should connect successfully', async () => {
        const connectionTest = {
          connected: true,
          user: global.testHelpers.createMockUser(),
          api_version: 'v2'
        };

        mockTestRailService.testConnection.mockResolvedValue(connectionTest);

        const result = await tools.connectTestRail({
          baseUrl: 'https://test.testrail.io',
          username: 'test@example.com',
          apiKey: 'test-key'
        });

        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('"connected": true');
      });

      it('should handle connection failure', async () => {
        const connectionTest = {
          connected: false,
          error: 'Invalid credentials'
        };

        mockTestRailService.testConnection.mockResolvedValue(connectionTest);

        const result = await tools.connectTestRail({
          baseUrl: 'https://test.testrail.io',
          username: 'test@example.com',
          apiKey: 'invalid-key'
        });

        expect(result.content[0].text).toContain('"success": false');
        expect(result.content[0].text).toContain('Invalid credentials');
        expect(result.isError).toBe(true);
      });
    });

    describe('testConnection', () => {
      it('should test connection when service is connected', async () => {
        const connectionResult = {
          connected: true,
          user: global.testHelpers.createMockUser()
        };

        mockTestRailService.testConnection.mockResolvedValue(connectionResult);

        const result = await tools.testConnection();

        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('"connected": true');
      });

      it('should fail when service is not connected', async () => {
        (tools as any).testRailService = null;

        const result = await tools.testConnection();

        expect(result.content[0].text).toContain('"success": false');
        expect(result.content[0].text).toContain('TestRail service not connected');
        expect(result.isError).toBe(true);
      });
    });
  });

  describe('Project Management', () => {
    describe('getProjects', () => {
      it('should get projects successfully', async () => {
        const mockProjects = [
          global.testHelpers.createMockProject({ id: 1, name: 'Project 1' }),
          global.testHelpers.createMockProject({ id: 2, name: 'Project 2' })
        ];

        mockTestRailService.getProjects.mockResolvedValue(mockProjects);

        const result = await tools.getProjects({ isCompleted: false });

        expect(mockTestRailService.getProjects).toHaveBeenCalledWith({ is_completed: 0 });
        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('"total": 2');
      });
    });

    describe('createProject', () => {
      it('should create project successfully', async () => {
        const mockProject = global.testHelpers.createMockProject({ name: 'New Project' });
        mockTestRailService.addProject.mockResolvedValue(mockProject);

        const result = await tools.createProject({
          name: 'New Project',
          announcement: 'Test announcement',
          showAnnouncement: true,
          suiteMode: 1
        });

        expect(mockTestRailService.addProject).toHaveBeenCalledWith({
          name: 'New Project',
          announcement: 'Test announcement',
          show_announcement: true,
          suite_mode: 1
        });
        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('Project created successfully');
      });
    });
  });

  describe('Test Case Management', () => {
    describe('createCase', () => {
      it('should create test case with all fields', async () => {
        const mockCase = global.testHelpers.createMockCase({ title: 'New Test Case' });
        mockTestRailService.addCase.mockResolvedValue(mockCase);

        const result = await tools.createCase({
          sectionId: 1,
          title: 'New Test Case',
          typeId: 6,
          priorityId: 2,
          preconditions: 'Test preconditions',
          steps: 'Test steps',
          expectedResult: 'Expected result'
        });

        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('Test case created successfully');
      });
    });

    describe('addResult', () => {
      it('should add result by test ID', async () => {
        const mockResult = global.testHelpers.createMockResult();
        mockTestRailService.addResult.mockResolvedValue(mockResult);

        const result = await tools.addResult({
          testId: 1,
          statusId: 1,
          comment: 'Test passed',
          version: '1.0.0'
        });

        expect(result.content[0].text).toContain('"success": true');
        expect(result.content[0].text).toContain('Test result added successfully');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service not connected error', async () => {
      (tools as any).testRailService = null;

      const result = await tools.getProjects({});

      expect(result.content[0].text).toContain('"success": false');
      expect(result.content[0].text).toContain('TestRail service not connected');
      expect(result.isError).toBe(true);
    });
  });
});