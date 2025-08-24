/**
 * Unit Tests for ProjectSuiteManager
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ProjectSuiteManager } from '../../src/tools/project-suite-manager';
import { TestRailService } from '../../src/utils/testrail-service';

// Mock TestRailService
jest.mock('../../src/utils/testrail-service');
const MockedTestRailService = TestRailService as jest.MockedClass<typeof TestRailService>;

describe('ProjectSuiteManager', () => {
  let projectSuiteManager: ProjectSuiteManager;
  let mockTestRailService: jest.Mocked<TestRailService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTestRailService = new MockedTestRailService({
      baseUrl: 'https://test.testrail.io',
      username: 'test@example.com',
      apiKey: 'test-key'
    }) as jest.Mocked<TestRailService>;
    
    projectSuiteManager = new ProjectSuiteManager(mockTestRailService);
  });

  describe('createAdvancedProject', () => {
    test('should create project with basic configuration', async () => {
      const mockProject = {
        id: 1,
        name: 'Test Project',
        suite_mode: 1
      };

      mockTestRailService.addProject.mockResolvedValue(mockProject);

      const result = await projectSuiteManager.createAdvancedProject({
        name: 'Test Project',
        suiteMode: 1
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(mockTestRailService.addProject).toHaveBeenCalledWith({
        name: 'Test Project',
        announcement: undefined,
        show_announcement: undefined,
        suite_mode: 1
      });
    });

    test('should create project with default suites when template provided', async () => {
      const mockProject = { id: 1, name: 'Test Project', suite_mode: 3 };
      const mockSuite = { id: 1, name: 'Functional Tests', project_id: 1 };

      mockTestRailService.addProject.mockResolvedValue(mockProject);
      mockTestRailService.addSuite.mockResolvedValue(mockSuite);

      const result = await projectSuiteManager.createAdvancedProject({
        name: 'Test Project',
        suiteMode: 3,
        template: {
          createDefaultSuites: true,
          suiteNames: ['Functional Tests', 'API Tests']
        }
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(mockTestRailService.addSuite).toHaveBeenCalledTimes(2);
    });

    test('should handle API errors gracefully', async () => {
      mockTestRailService.addProject.mockRejectedValue(new Error('API Error'));

      const result = await projectSuiteManager.createAdvancedProject({
        name: 'Test Project'
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.content[0].text).toContain('API Error');
    });
  });

  describe('analyzeProjectStructure', () => {
    test('should analyze project structure successfully', async () => {
      const mockProject = { id: 1, name: 'Test Project', suite_mode: 1 };
      const mockSuites = [
        { id: 1, name: 'Suite 1', project_id: 1 },
        { id: 2, name: 'Suite 2', project_id: 1 }
      ];
      const mockSections = [
        { id: 1, name: 'Section 1', suite_id: 1 },
        { id: 2, name: 'Section 2', suite_id: 1 }
      ];
      const mockCases = [
        { id: 1, title: 'Test Case 1', section_id: 1 },
        { id: 2, title: 'Test Case 2', section_id: 1 }
      ];

      mockTestRailService.getProject.mockResolvedValue(mockProject);
      mockTestRailService.getSuites.mockResolvedValue(mockSuites);
      mockTestRailService.getSections.mockResolvedValue(mockSections);
      mockTestRailService.getCases.mockResolvedValue(mockCases);

      const result = await projectSuiteManager.analyzeProjectStructure({
        projectId: 1,
        includeStatistics: true,
        includeRecommendations: true
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('"suites": 2');
      expect(result.content[0].text).toContain('"sections": 4'); // 2 sections per suite
      expect(result.content[0].text).toContain('"cases": 4'); // 2 cases per suite
    });

    test('should include recommendations when requested', async () => {
      const mockProject = { id: 1, name: 'Test Project', suite_mode: 1 };
      const mockSuites = [{ id: 1, name: 'Empty Suite', project_id: 1 }];

      mockTestRailService.getProject.mockResolvedValue(mockProject);
      mockTestRailService.getSuites.mockResolvedValue(mockSuites);
      mockTestRailService.getSections.mockResolvedValue([]);
      mockTestRailService.getCases.mockResolvedValue([]);

      const result = await projectSuiteManager.analyzeProjectStructure({
        projectId: 1,
        includeRecommendations: true
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('recommendations');
    });
  });

  describe('bulkManageSuites', () => {
    test('should execute create operations successfully', async () => {
      const mockSuite = { id: 1, name: 'New Suite', project_id: 1 };
      mockTestRailService.addSuite.mockResolvedValue(mockSuite);

      const result = await projectSuiteManager.bulkManageSuites({
        projectId: 1,
        operations: [
          {
            type: 'create',
            data: { name: 'New Suite', description: 'Test suite' }
          }
        ]
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('"executed": 1');
      expect(mockTestRailService.addSuite).toHaveBeenCalledWith(1, {
        name: 'New Suite',
        description: 'Test suite'
      });
    });

    test('should validate operations when requested', async () => {
      const result = await projectSuiteManager.bulkManageSuites({
        projectId: 1,
        operations: [
          {
            type: 'update',
            // Missing suiteId - should fail validation
            data: { name: 'Updated Suite' }
          }
        ],
        validateBefore: true
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.content[0].text).toContain('Suite ID required');
    });

    test('should perform dry run without actual changes', async () => {
      const result = await projectSuiteManager.bulkManageSuites({
        projectId: 1,
        operations: [
          {
            type: 'create',
            data: { name: 'Test Suite' }
          }
        ],
        dryRun: true
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('"skipped": 1');
      expect(mockTestRailService.addSuite).not.toHaveBeenCalled();
    });
  });

  describe('createAdvancedSuite', () => {
    test('should create suite with functional template', async () => {
      const mockSuite = { id: 1, name: 'Functional Tests', project_id: 1 };
      const mockSection = { id: 1, name: 'Authentication', suite_id: 1 };

      mockTestRailService.addSuite.mockResolvedValue(mockSuite);
      mockTestRailService.addSection.mockResolvedValue(mockSection);

      const result = await projectSuiteManager.createAdvancedSuite({
        projectId: 1,
        name: 'Functional Tests',
        template: 'functional'
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(mockTestRailService.addSuite).toHaveBeenCalledWith(1, {
        name: 'Functional Tests',
        description: 'Comprehensive functional testing suite covering core application features'
      });
    });

    test('should create suite with custom structure', async () => {
      const mockSuite = { id: 1, name: 'Custom Suite', project_id: 1 };
      const mockSection = { id: 1, name: 'Custom Section', suite_id: 1 };

      mockTestRailService.addSuite.mockResolvedValue(mockSuite);
      mockTestRailService.addSection.mockResolvedValue(mockSection);

      const result = await projectSuiteManager.createAdvancedSuite({
        projectId: 1,
        name: 'Custom Suite',
        structure: {
          sections: [
            {
              name: 'Custom Section',
              description: 'Custom section description'
            }
          ],
          sampleCases: false
        }
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(mockTestRailService.addSection).toHaveBeenCalledWith(1, {
        name: 'Custom Section',
        description: 'Custom section description',
        suite_id: 1
      });
    });

    test('should handle template not found', async () => {
      const mockSuite = { id: 1, name: 'Unknown Template Suite', project_id: 1 };
      mockTestRailService.addSuite.mockResolvedValue(mockSuite);

      const result = await projectSuiteManager.createAdvancedSuite({
        projectId: 1,
        name: 'Unknown Template Suite',
        template: 'nonexistent' as any
      });

      expect(result.content[0].text).toContain('"success": true');
      // Should fall back to default template
    });
  });

  describe('error handling', () => {
    test('should handle network errors', async () => {
      mockTestRailService.getProject.mockRejectedValue(new Error('Network error'));

      const result = await projectSuiteManager.analyzeProjectStructure({
        projectId: 1
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.content[0].text).toContain('Network error');
      expect(result.isError).toBe(true);
    });

    test('should handle validation errors', async () => {
      const result = await projectSuiteManager.bulkManageSuites({
        projectId: 1,
        operations: [
          {
            type: 'delete',
            // Missing suiteId
            data: {}
          }
        ],
        validateBefore: true
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.content[0].text).toContain('validation');
    });
  });

  describe('helper methods', () => {
    test('should calculate section depth correctly', async () => {
      // This would test private helper methods if they were exposed
      // For now, we test through public methods that use them
      const mockProject = { id: 1, name: 'Test Project', suite_mode: 1 };
      const mockSuites = [{ id: 1, name: 'Suite 1', project_id: 1 }];
      const mockSections = [
        { id: 1, name: 'Parent Section', suite_id: 1, parent_id: null, depth: 1 },
        { id: 2, name: 'Child Section', suite_id: 1, parent_id: 1, depth: 2 },
        { id: 3, name: 'Grandchild Section', suite_id: 1, parent_id: 2, depth: 3 }
      ];

      mockTestRailService.getProject.mockResolvedValue(mockProject);
      mockTestRailService.getSuites.mockResolvedValue(mockSuites);
      mockTestRailService.getSections.mockResolvedValue(mockSections);
      mockTestRailService.getCases.mockResolvedValue([]);

      const result = await projectSuiteManager.analyzeProjectStructure({
        projectId: 1,
        includeRecommendations: true
      });

      expect(result.content[0].text).toContain('"success": true');
      // The recommendations should detect deep nesting
      expect(result.content[0].text).toContain('recommendations');
    });
  });
});