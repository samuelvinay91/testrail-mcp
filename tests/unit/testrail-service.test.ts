/**
 * Unit Tests for TestRail Service
 */

import { jest } from '@jest/globals';
import axios from 'axios';
import { TestRailService } from '../../src/utils/testrail-service';
import { TestRailConfig } from '../../src/types';

// Mock axios
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TestRailService', () => {
  let service: TestRailService;
  let config: TestRailConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Setup mock axios instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: {
        baseURL: '',
        timeout: 30000,
        headers: {},
        auth: {}
      },
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Setup test configuration
    config = {
      baseUrl: 'https://test.testrail.io',
      username: 'test@example.com',
      apiKey: 'test-api-key',
      timeout: 30000
    };

    service = new TestRailService(config);
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://test.testrail.io/index.php?/api/v2',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TestRail-MCP-Server/1.0.0'
        },
        auth: {
          username: 'test@example.com',
          password: 'test-api-key'
        }
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      const mockUser = global.testHelpers.createMockUser();
      const mockApiInfo = { version: 'v2' };

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockApiInfo });

      const result = await service.testConnection();

      expect(result.connected).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.api_version).toBe('v2');
    });

    it('should handle connection failure', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await service.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Project Management', () => {
    describe('getProjects', () => {
      it('should get all projects', async () => {
        const mockProjects = [
          global.testHelpers.createMockProject({ id: 1, name: 'Project 1' }),
          global.testHelpers.createMockProject({ id: 2, name: 'Project 2' })
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockProjects });

        const result = await service.getProjects();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_projects', undefined);
        expect(result).toEqual(mockProjects);
      });

      it('should filter completed projects', async () => {
        const mockProjects = [
          global.testHelpers.createMockProject({ id: 1, is_completed: false })
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockProjects });

        await service.getProjects({ is_completed: 0 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_projects', { is_completed: 0 });
      });
    });

    describe('getProject', () => {
      it('should get project by ID', async () => {
        const mockProject = global.testHelpers.createMockProject();
        mockAxiosInstance.get.mockResolvedValue({ data: mockProject });

        const result = await service.getProject(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_project/1');
        expect(result).toEqual(mockProject);
      });
    });

    describe('addProject', () => {
      it('should create new project', async () => {
        const mockProject = global.testHelpers.createMockProject();
        const projectData = {
          name: 'New Project',
          announcement: 'Test announcement',
          show_announcement: true,
          suite_mode: 1
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockProject });

        const result = await service.addProject(projectData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/add_project', projectData);
        expect(result).toEqual(mockProject);
      });
    });

    describe('updateProject', () => {
      it('should update existing project', async () => {
        const mockProject = global.testHelpers.createMockProject({ name: 'Updated Project' });
        const updateData = { name: 'Updated Project' };

        mockAxiosInstance.post.mockResolvedValue({ data: mockProject });

        const result = await service.updateProject(1, updateData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/update_project/1', updateData);
        expect(result).toEqual(mockProject);
      });
    });

    describe('deleteProject', () => {
      it('should delete project', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: undefined });

        await service.deleteProject(1);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/delete_project/1', {});
      });
    });
  });

  describe('Test Case Management', () => {
    describe('getCases', () => {
      it('should get test cases for project', async () => {
        const mockCases = [
          global.testHelpers.createMockCase({ id: 1, title: 'Case 1' }),
          global.testHelpers.createMockCase({ id: 2, title: 'Case 2' })
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockCases });

        const result = await service.getCases(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_cases/1', {});
        expect(result).toEqual(mockCases);
      });

      it('should get test cases for suite with filters', async () => {
        const mockCases = [global.testHelpers.createMockCase()];
        const options = {
          filter: { priority_id: [1, 2] },
          limit: 50,
          offset: 0
        };

        mockAxiosInstance.get.mockResolvedValue({ data: mockCases });

        await service.getCases(1, 2, options);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_cases/1&suite_id=2', {
          priority_id: [1, 2],
          limit: 50,
          offset: 0
        });
      });
    });

    describe('addCase', () => {
      it('should create new test case', async () => {
        const mockCase = global.testHelpers.createMockCase();
        const caseData = {
          title: 'New Test Case',
          type_id: 6,
          priority_id: 2,
          custom_steps: 'Test steps',
          custom_expected: 'Expected result'
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockCase });

        const result = await service.addCase(1, caseData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/add_case/1', caseData);
        expect(result).toEqual(mockCase);
      });
    });

    describe('updateCase', () => {
      it('should update existing test case', async () => {
        const mockCase = global.testHelpers.createMockCase({ title: 'Updated Case' });
        const updateData = { title: 'Updated Case' };

        mockAxiosInstance.post.mockResolvedValue({ data: mockCase });

        const result = await service.updateCase(1, updateData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/update_case/1', updateData);
        expect(result).toEqual(mockCase);
      });
    });

    describe('deleteCase', () => {
      it('should delete test case', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: undefined });

        await service.deleteCase(1);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/delete_case/1', {});
      });
    });
  });

  describe('Test Run Management', () => {
    describe('getRuns', () => {
      it('should get test runs for project', async () => {
        const mockRuns = [
          global.testHelpers.createMockRun({ id: 1, name: 'Run 1' }),
          global.testHelpers.createMockRun({ id: 2, name: 'Run 2' })
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockRuns });

        const result = await service.getRuns(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_runs/1', {});
        expect(result).toEqual(mockRuns);
      });
    });

    describe('addRun', () => {
      it('should create new test run', async () => {
        const mockRun = global.testHelpers.createMockRun();
        const runData = {
          name: 'New Test Run',
          description: 'Test run description',
          include_all: true
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockRun });

        const result = await service.addRun(1, runData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/add_run/1', runData);
        expect(result).toEqual(mockRun);
      });
    });

    describe('closeRun', () => {
      it('should close test run', async () => {
        const mockRun = global.testHelpers.createMockRun({ is_completed: true });
        mockAxiosInstance.post.mockResolvedValue({ data: mockRun });

        const result = await service.closeRun(1);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/close_run/1', {});
        expect(result).toEqual(mockRun);
      });
    });
  });

  describe('Result Management', () => {
    describe('addResult', () => {
      it('should add test result', async () => {
        const mockResult = global.testHelpers.createMockResult();
        const resultData = {
          status_id: 1,
          comment: 'Test passed',
          version: '1.0.0'
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResult });

        const result = await service.addResult(1, resultData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/add_result/1', resultData);
        expect(result).toEqual(mockResult);
      });
    });

    describe('addResultForCase', () => {
      it('should add result for case', async () => {
        const mockResult = global.testHelpers.createMockResult();
        const resultData = {
          status_id: 1,
          comment: 'Test passed'
        };

        mockAxiosInstance.post.mockResolvedValue({ data: mockResult });

        const result = await service.addResultForCase(1, 1, resultData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/add_result_for_case/1/1', resultData);
        expect(result).toEqual(mockResult);
      });
    });

    describe('addResults', () => {
      it('should add bulk results', async () => {
        const mockResults = [
          global.testHelpers.createMockResult({ id: 1 }),
          global.testHelpers.createMockResult({ id: 2 })
        ];
        const results = [
          { test_id: 1, status_id: 1, comment: 'Test 1 passed' },
          { test_id: 2, status_id: 5, comment: 'Test 2 failed' }
        ];

        mockAxiosInstance.post.mockResolvedValue({ data: mockResults });

        const result = await service.addResults(1, results);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/add_results/1', { results });
        expect(result).toEqual(mockResults);
      });
    });
  });

  describe('Metadata', () => {
    describe('getUsers', () => {
      it('should get all users', async () => {
        const mockUsers = [
          global.testHelpers.createMockUser({ id: 1, name: 'User 1' }),
          global.testHelpers.createMockUser({ id: 2, name: 'User 2' })
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockUsers });

        const result = await service.getUsers();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_users');
        expect(result).toEqual(mockUsers);
      });

      it('should get users for project', async () => {
        const mockUsers = [global.testHelpers.createMockUser()];
        mockAxiosInstance.get.mockResolvedValue({ data: mockUsers });

        await service.getUsers(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_users/1');
      });
    });

    describe('getStatuses', () => {
      it('should get all statuses', async () => {
        const mockStatuses = [
          { id: 1, name: 'Passed', label: 'Passed', is_final: true },
          { id: 5, name: 'Failed', label: 'Failed', is_final: true }
        ];

        mockAxiosInstance.get.mockResolvedValue({ data: mockStatuses });

        const result = await service.getStatuses();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/get_statuses');
        expect(result).toEqual(mockStatuses);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors correctly', async () => {
      const apiError = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid project ID' }
        }
      };

      mockAxiosInstance.get.mockRejectedValue(apiError);

      await expect(service.getProject(999)).rejects.toEqual({
        error: 'Invalid project ID',
        code: 400,
        details: { error: 'Invalid project ID' }
      });
    });

    it('should handle network errors', async () => {
      const networkError = {
        request: {},
        message: 'Network Error'
      };

      mockAxiosInstance.get.mockRejectedValue(networkError);

      await expect(service.getProjects()).rejects.toEqual({
        error: 'Network error - unable to reach TestRail server',
        details: 'Network Error'
      });
    });

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error');
      mockAxiosInstance.get.mockRejectedValue(unknownError);

      await expect(service.getProjects()).rejects.toEqual({
        error: 'Unknown error',
        details: unknownError
      });
    });
  });

  describe('Configuration Management', () => {
    describe('updateConfig', () => {
      it('should update configuration', () => {
        const newConfig = {
          baseUrl: 'https://new.testrail.io',
          username: 'new@example.com',
          timeout: 60000
        };

        service.updateConfig(newConfig);

        expect(mockAxiosInstance.defaults.baseURL).toBe('https://new.testrail.io/index.php?/api/v2');
        expect(mockAxiosInstance.defaults.auth.username).toBe('new@example.com');
        expect(mockAxiosInstance.defaults.timeout).toBe(60000);
      });
    });

    describe('getConfig', () => {
      it('should return safe configuration', () => {
        const config = service.getConfig();

        expect(config).toEqual({
          baseUrl: 'https://test.testrail.io',
          username: 'test@example.com',
          timeout: 30000
        });
        expect(config).not.toHaveProperty('apiKey');
      });
    });
  });
});