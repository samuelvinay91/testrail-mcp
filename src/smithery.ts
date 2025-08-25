import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TestRailMCPTools } from './tools/testrail-tools';
import { TestRailMCPTool } from './types';
import { z } from 'zod';

/**
 * Configuration schema for TestRail MCP Server
 * This is used by Smithery to generate configuration forms for users
 */
export const configSchema = z.object({
  baseUrl: z.string().describe('TestRail instance URL (e.g., https://yourcompany.testrail.io)'),
  username: z.string().describe('TestRail username (email address)'),
  apiKey: z.string().describe('TestRail API key'),
  defaultProjectId: z.number().default(1).describe('Default project ID'),
  defaultSuiteId: z.number().default(1).describe('Default suite ID'),
  rateLimitRequestsPerMinute: z.number().default(60).describe('Rate limit requests per minute'),
  cacheTtl: z.number().default(300).describe('Cache TTL in seconds'),
  timeout: z.number().default(30000).describe('Request timeout in milliseconds'),
});

/**
 * Create TestRail MCP Server instance
 * Required by Smithery TypeScript deployment
 */
export default function createServer({ config }: { config: z.infer<typeof configSchema> }) {
  const server = new Server(
    {
      name: 'testrail-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const tools = new TestRailMCPTools();

  // Initialize with user configuration
  if (config) {
    // Set environment variables from config for the tools to use
    process.env.TESTRAIL_BASE_URL = config.baseUrl;
    process.env.TESTRAIL_USERNAME = config.username;
    process.env.TESTRAIL_API_KEY = config.apiKey;
    process.env.DEFAULT_PROJECT_ID = config.defaultProjectId?.toString();
    process.env.DEFAULT_SUITE_ID = config.defaultSuiteId?.toString();
    process.env.RATE_LIMIT_REQUESTS_PER_MINUTE = config.rateLimitRequestsPerMinute?.toString();
    process.env.CACHE_TTL = config.cacheTtl?.toString();
  }

  // Define all available TestRail MCP tools
  const getToolDefinitions = (): TestRailMCPTool[] => {
    return [
      // Connection & Authentication Tools
      {
        name: 'connect_testrail',
        description: 'Connect to TestRail instance with credentials',
        inputSchema: {
          type: 'object',
          properties: {
            baseUrl: {
              type: 'string',
              description: 'TestRail instance URL (e.g., https://yourcompany.testrail.io)',
            },
            username: {
              type: 'string',
              description: 'TestRail username (email address)',
            },
            apiKey: {
              type: 'string',
              description: 'TestRail API key',
            },
            timeout: {
              type: 'number',
              description: 'Request timeout in milliseconds (default: 30000)',
            },
          },
          required: ['baseUrl', 'username', 'apiKey'],
        },
      },
      {
        name: 'test_connection',
        description: 'Test TestRail connection and validate credentials',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Project Management Tools
      {
        name: 'get_projects',
        description: 'Get all TestRail projects',
        inputSchema: {
          type: 'object',
          properties: {
            isCompleted: {
              type: 'boolean',
              description: 'Filter by completion status',
            },
          },
        },
      },
      {
        name: 'get_project',
        description: 'Get specific TestRail project by ID',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'create_project',
        description: 'Create new TestRail project',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name',
            },
            announcement: {
              type: 'string',
              description: 'Project announcement',
            },
            showAnnouncement: {
              type: 'boolean',
              description: 'Show announcement to users',
            },
            suiteMode: {
              type: 'number',
              description: 'Suite mode (1=single, 2=single+baselines, 3=multiple)',
            },
          },
          required: ['name'],
        },
      },

      // Test Case Management Tools
      {
        name: 'get_cases',
        description: 'Get test cases for a project/suite',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID',
            },
            sectionId: {
              type: 'number',
              description: 'Section ID (optional)',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'create_case',
        description: 'Create new test case',
        inputSchema: {
          type: 'object',
          properties: {
            sectionId: {
              type: 'number',
              description: 'Section ID',
            },
            title: {
              type: 'string',
              description: 'Test case title',
            },
            typeId: {
              type: 'number',
              description: 'Test case type ID',
            },
            priorityId: {
              type: 'number',
              description: 'Priority ID',
            },
            estimate: {
              type: 'string',
              description: 'Time estimate',
            },
            milestone_id: {
              type: 'number',
              description: 'Milestone ID',
            },
            refs: {
              type: 'string',
              description: 'References (requirements)',
            },
          },
          required: ['sectionId', 'title'],
        },
      },

      // Test Run Management Tools
      {
        name: 'get_runs',
        description: 'Get test runs for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            createdAfter: {
              type: 'number',
              description: 'Created after timestamp',
            },
            createdBefore: {
              type: 'number',
              description: 'Created before timestamp',
            },
            createdBy: {
              type: 'array',
              items: { type: 'number' },
              description: 'Created by user IDs',
            },
            isCompleted: {
              type: 'boolean',
              description: 'Filter by completion status',
            },
            limit: {
              type: 'number',
              description: 'Limit results',
            },
            offset: {
              type: 'number',
              description: 'Offset for pagination',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'create_run',
        description: 'Create new test run',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Test run name',
            },
            description: {
              type: 'string',
              description: 'Test run description',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID',
            },
            milestoneId: {
              type: 'number',
              description: 'Milestone ID',
            },
            assignedtoId: {
              type: 'number',
              description: 'Assigned user ID',
            },
            caseIds: {
              type: 'array',
              items: { type: 'number' },
              description: 'Test case IDs to include',
            },
          },
          required: ['projectId', 'name'],
        },
      },

      // Reporting Tools
      {
        name: 'generate_project_dashboard',
        description: 'Generate comprehensive project dashboard with metrics and analytics',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            timeframe: {
              type: 'string',
              enum: ['7d', '30d', '90d', 'all'],
              description: 'Time frame for analytics',
            },
            includeCharts: {
              type: 'boolean',
              description: 'Include chart data',
            },
          },
          required: ['projectId'],
        },
      },
    ];
  };

  // Setup tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const toolDefinitions = getToolDefinitions();
    return {
      tools: toolDefinitions.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const toolDefinitions = getToolDefinitions();
      const tool = toolDefinitions.find((t) => t.name === name);

      if (!tool) {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      // Route to appropriate tool method
      let result;
      switch (name) {
        // Connection & Authentication
        case 'connect_testrail':
          result = await tools.connectTestRail(args as any);
          break;
        case 'test_connection':
          result = await tools.testConnection();
          break;

        // Project Management
        case 'get_projects':
          result = await tools.getProjects(args as any);
          break;
        case 'get_project':
          result = await tools.getProject(args as any);
          break;
        case 'create_project':
          result = await tools.createProject(args as any);
          break;

        // Test Case Management
        case 'get_cases':
          result = await tools.getCases(args as any);
          break;
        case 'create_case':
          result = await tools.createCase(args as any);
          break;

        // Test Run Management
        case 'get_runs':
          result = await tools.getRuns(args as any);
          break;
        case 'create_run':
          result = await tools.createRun(args as any);
          break;

        // Reporting
        case 'generate_project_dashboard':
          result = await tools.generateProjectDashboard(args as any);
          break;

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }

      // Return the result from the tool method
      return result;
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);

      if (error instanceof McpError) {
        throw error;
      }

      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Return the server instance as required by Smithery
  return server;
}
