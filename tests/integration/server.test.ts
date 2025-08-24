/**
 * Integration Tests for TestRail MCP Server
 */

import { jest } from '@jest/globals';
import { TestRailMCPServer } from '../../src/index';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

describe('TestRail MCP Server Integration', () => {
  let server: TestRailMCPServer;

  beforeEach(() => {
    server = new TestRailMCPServer();
  });

  afterEach(async () => {
    if (server) {
      await (server as any).server?.close();
    }
  });

  describe('Server Initialization', () => {
    it('should initialize server with correct configuration', () => {
      expect(server).toBeDefined();
      expect((server as any).server).toBeDefined();
      expect((server as any).tools).toBeDefined();
    });

    it('should setup tool handlers', () => {
      const serverInstance = (server as any).server;
      expect(serverInstance.setRequestHandler).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    it('should register all expected tools', async () => {
      const serverInstance = (server as any).server;
      
      // Mock the setRequestHandler calls to capture registered handlers
      const handlers = new Map();
      serverInstance.setRequestHandler = jest.fn((schema, handler) => {
        handlers.set(schema, handler);
      });

      // Re-setup handlers to capture them
      (server as any).setupToolHandlers();

      // Verify ListTools handler was registered
      expect(handlers.has(ListToolsRequestSchema)).toBe(true);
      expect(handlers.has(CallToolRequestSchema)).toBe(true);
    });

    it('should return correct tool definitions', async () => {
      const tools = (server as any).getToolDefinitions();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(20); // We have many tools

      // Check for key tools
      const toolNames = tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('connect_testrail');
      expect(toolNames).toContain('test_connection');
      expect(toolNames).toContain('get_projects');
      expect(toolNames).toContain('create_case');
      expect(toolNames).toContain('add_result');
      expect(toolNames).toContain('generate_report');
    });

    it('should have proper tool schemas', async () => {
      const tools = (server as any).getToolDefinitions();
      
      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
      }
    });
  });

  describe('Tool Execution Flow', () => {
    let mockHandler: jest.Mock;

    beforeEach(() => {
      // Mock the actual tool handler
      mockHandler = jest.fn();
      const serverInstance = (server as any).server;
      serverInstance.setRequestHandler = jest.fn((schema, handler) => {
        if (schema === CallToolRequestSchema) {
          mockHandler = handler;
        }
      });
      (server as any).setupToolHandlers();
    });

    it('should handle connect_testrail tool call', async () => {
      const mockTools = (server as any).tools;
      mockTools.connectTestRail = jest.fn().mockResolvedValue(
        global.testHelpers.createSuccessResponse({ connected: true })
      );

      const request = {
        params: {
          name: 'connect_testrail',
          arguments: {
            baseUrl: 'https://test.testrail.io',
            username: 'test@example.com',
            apiKey: 'test-key'
          }
        }
      };

      const result = await mockHandler(request);

      expect(mockTools.connectTestRail).toHaveBeenCalledWith({
        baseUrl: 'https://test.testrail.io',
        username: 'test@example.com',
        apiKey: 'test-key'
      });
      expect(result.content[0].text).toContain('"connected": true');
    });

    it('should handle get_projects tool call', async () => {
      const mockTools = (server as any).tools;
      mockTools.getProjects = jest.fn().mockResolvedValue(
        global.testHelpers.createSuccessResponse({ 
          projects: [global.testHelpers.createMockProject()],
          total: 1
        })
      );

      const request = {
        params: {
          name: 'get_projects',
          arguments: { isCompleted: false }
        }
      };

      const result = await mockHandler(request);

      expect(mockTools.getProjects).toHaveBeenCalledWith({ isCompleted: false });
      expect(result.content[0].text).toContain('"total": 1');
    });

    it('should handle create_case tool call', async () => {
      const mockTools = (server as any).tools;
      mockTools.createCase = jest.fn().mockResolvedValue(
        global.testHelpers.createSuccessResponse({ 
          case: global.testHelpers.createMockCase()
        })
      );

      const request = {
        params: {
          name: 'create_case',
          arguments: {
            sectionId: 1,
            title: 'Test Case',
            typeId: 6,
            priorityId: 2
          }
        }
      };

      const result = await mockHandler(request);

      expect(mockTools.createCase).toHaveBeenCalledWith({
        sectionId: 1,
        title: 'Test Case',
        typeId: 6,
        priorityId: 2
      });
      expect(result.content[0].text).toContain('"success": true');
    });

    it('should handle add_result tool call', async () => {
      const mockTools = (server as any).tools;
      mockTools.addResult = jest.fn().mockResolvedValue(
        global.testHelpers.createSuccessResponse({ 
          result: global.testHelpers.createMockResult()
        })
      );

      const request = {
        params: {
          name: 'add_result',
          arguments: {
            testId: 1,
            statusId: 1,
            comment: 'Test passed'
          }
        }
      };

      const result = await mockHandler(request);

      expect(mockTools.addResult).toHaveBeenCalledWith({
        testId: 1,
        statusId: 1,
        comment: 'Test passed'
      });
      expect(result.content[0].text).toContain('"success": true');
    });

    it('should handle unknown tool gracefully', async () => {
      const request = {
        params: {
          name: 'unknown_tool',
          arguments: {}
        }
      };

      await expect(mockHandler(request)).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should handle tool execution errors', async () => {
      const mockTools = (server as any).tools;
      mockTools.getProjects = jest.fn().mockRejectedValue(new Error('API Error'));

      const request = {
        params: {
          name: 'get_projects',
          arguments: {}
        }
      };

      await expect(mockHandler(request)).rejects.toThrow('API Error');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', () => {
      const serverInstance = (server as any).server;
      
      // Mock error handler
      const errorHandler = jest.fn();
      serverInstance.onerror = errorHandler;

      // Simulate an error
      const testError = new Error('Test error');
      serverInstance.onerror(testError);

      expect(errorHandler).toHaveBeenCalledWith(testError);
    });
  });

  describe('Server Lifecycle', () => {
    it('should handle graceful shutdown on SIGINT', async () => {
      const serverInstance = (server as any).server;
      serverInstance.close = jest.fn().mockResolvedValue(undefined);

      // Mock process exit
      const originalExit = process.exit;
      process.exit = jest.fn() as any;

      // Simulate SIGINT
      process.emit('SIGINT');

      // Wait for async operations
      await global.testHelpers.waitFor(100);

      expect(serverInstance.close).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(0);

      // Restore process.exit
      process.exit = originalExit;
    });

    it('should handle graceful shutdown on SIGTERM', async () => {
      const serverInstance = (server as any).server;
      serverInstance.close = jest.fn().mockResolvedValue(undefined);

      // Mock process exit
      const originalExit = process.exit;
      process.exit = jest.fn() as any;

      // Simulate SIGTERM
      process.emit('SIGTERM');

      // Wait for async operations
      await global.testHelpers.waitFor(100);

      expect(serverInstance.close).toHaveBeenCalled();
      expect(process.exit).toHaveBeenCalledWith(0);

      // Restore process.exit
      process.exit = originalExit;
    });
  });

  describe('Tool Schema Validation', () => {
    it('should have valid input schemas for all tools', () => {
      const tools = (server as any).getToolDefinitions();

      for (const tool of tools) {
        // Check basic structure
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');

        // Check required fields if they exist
        if (tool.inputSchema.required) {
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
          
          // All required fields should be in properties
          for (const requiredField of tool.inputSchema.required) {
            expect(tool.inputSchema.properties).toHaveProperty(requiredField);
          }
        }

        // Check property definitions
        for (const [propName, propDef] of Object.entries(tool.inputSchema.properties)) {
          expect(propDef).toHaveProperty('type');
          
          // Array properties should have items definition
          if ((propDef as any).type === 'array') {
            expect(propDef).toHaveProperty('items');
          }
          
          // Enum properties should have valid enum values
          if ((propDef as any).enum) {
            expect(Array.isArray((propDef as any).enum)).toBe(true);
            expect((propDef as any).enum.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should have proper descriptions for all tools and properties', () => {
      const tools = (server as any).getToolDefinitions();

      for (const tool of tools) {
        // Tool should have description
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);

        // Properties should have descriptions (except for simple object types)
        for (const [propName, propDef] of Object.entries(tool.inputSchema.properties)) {
          if ((propDef as any).type !== 'object' || (propDef as any).properties) {
            expect(propDef).toHaveProperty('description');
            expect(typeof (propDef as any).description).toBe('string');
          }
        }
      }
    });
  });

  describe('Tool Categories', () => {
    it('should have connection tools', () => {
      const tools = (server as any).getToolDefinitions();
      const connectionTools = tools.filter((t: any) => 
        t.name.includes('connect') || t.name.includes('test_connection')
      );
      
      expect(connectionTools.length).toBeGreaterThanOrEqual(2);
      expect(connectionTools.some((t: any) => t.name === 'connect_testrail')).toBe(true);
      expect(connectionTools.some((t: any) => t.name === 'test_connection')).toBe(true);
    });

    it('should have project management tools', () => {
      const tools = (server as any).getToolDefinitions();
      const projectTools = tools.filter((t: any) => 
        t.name.includes('project')
      );
      
      expect(projectTools.length).toBeGreaterThanOrEqual(3);
      expect(projectTools.some((t: any) => t.name === 'get_projects')).toBe(true);
      expect(projectTools.some((t: any) => t.name === 'get_project')).toBe(true);
      expect(projectTools.some((t: any) => t.name === 'create_project')).toBe(true);
    });

    it('should have test case management tools', () => {
      const tools = (server as any).getToolDefinitions();
      const caseTools = tools.filter((t: any) => 
        t.name.includes('case')
      );
      
      expect(caseTools.length).toBeGreaterThanOrEqual(4);
      expect(caseTools.some((t: any) => t.name === 'get_cases')).toBe(true);
      expect(caseTools.some((t: any) => t.name === 'create_case')).toBe(true);
      expect(caseTools.some((t: any) => t.name === 'update_case')).toBe(true);
      expect(caseTools.some((t: any) => t.name === 'delete_case')).toBe(true);
    });

    it('should have test execution tools', () => {
      const tools = (server as any).getToolDefinitions();
      const executionTools = tools.filter((t: any) => 
        t.name.includes('result') || t.name.includes('run')
      );
      
      expect(executionTools.length).toBeGreaterThanOrEqual(6);
      expect(executionTools.some((t: any) => t.name === 'add_result')).toBe(true);
      expect(executionTools.some((t: any) => t.name === 'add_bulk_results')).toBe(true);
      expect(executionTools.some((t: any) => t.name === 'create_run')).toBe(true);
    });

    it('should have metadata tools', () => {
      const tools = (server as any).getToolDefinitions();
      const metadataTools = tools.filter((t: any) => 
        t.name.includes('get_users') || 
        t.name.includes('get_statuses') || 
        t.name.includes('get_priorities') ||
        t.name.includes('get_case_types')
      );
      
      expect(metadataTools.length).toBeGreaterThanOrEqual(4);
    });

    it('should have advanced tools', () => {
      const tools = (server as any).getToolDefinitions();
      const advancedTools = tools.filter((t: any) => 
        t.name.includes('generate_report') || t.name.includes('search')
      );
      
      expect(advancedTools.length).toBeGreaterThanOrEqual(2);
    });
  });
});