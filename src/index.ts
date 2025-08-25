#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TestRailMCPTools } from './tools/testrail-tools';
import { TestRailMCPTool } from './types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * TestRail MCP Server
 * Provides comprehensive TestRail integration via Model Context Protocol
 */
class TestRailMCPServer {
  private server: Server;
  private tools: TestRailMCPTools;

  constructor() {
    this.server = new Server(
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

    this.tools = new TestRailMCPTools();

    // Error handling
    this.server.onerror = (error) => {
      console.error('❌ [TestRail MCP Server Error]', error);
    };

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down TestRail MCP Server...');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down TestRail MCP Server...');
      await this.server.close();
      process.exit(0);
    });

    this.setupToolHandlers();
  }

  /**
   * Define all available TestRail MCP tools
   */
  private getToolDefinitions(): TestRailMCPTool[] {
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

      // Suite Management Tools
      {
        name: 'get_suites',
        description: 'Get all test suites for a project',
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
        name: 'create_suite',
        description: 'Create new test suite',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Suite name',
            },
            description: {
              type: 'string',
              description: 'Suite description',
            },
          },
          required: ['projectId', 'name'],
        },
      },

      // Section Management Tools
      {
        name: 'get_sections',
        description: 'Get all sections for a project/suite',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID (optional)',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'create_section',
        description: 'Create new section',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Section name',
            },
            description: {
              type: 'string',
              description: 'Section description',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID',
            },
            parentId: {
              type: 'number',
              description: 'Parent section ID',
            },
          },
          required: ['projectId', 'name'],
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
              description: 'Suite ID (optional)',
            },
            sectionId: {
              type: 'number',
              description: 'Section ID (optional)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of cases to return',
            },
            offset: {
              type: 'number',
              description: 'Number of cases to skip',
            },
            filter: {
              type: 'object',
              description: 'Filter criteria',
              properties: {
                priority_id: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Priority IDs to filter by',
                },
                type_id: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Type IDs to filter by',
                },
                created_by: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Creator user IDs to filter by',
                },
                milestone_id: {
                  type: 'array',
                  items: { type: 'number' },
                  description: 'Milestone IDs to filter by',
                },
              },
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
              description: 'Section ID where case will be created',
            },
            title: {
              type: 'string',
              description: 'Test case title',
            },
            templateId: {
              type: 'number',
              description: 'Template ID',
            },
            typeId: {
              type: 'number',
              description: 'Case type ID',
            },
            priorityId: {
              type: 'number',
              description: 'Priority ID',
            },
            milestoneId: {
              type: 'number',
              description: 'Milestone ID',
            },
            refs: {
              type: 'string',
              description: 'References (comma-separated)',
            },
            estimate: {
              type: 'string',
              description: 'Time estimate',
            },
            preconditions: {
              type: 'string',
              description: 'Test preconditions',
            },
            steps: {
              type: 'string',
              description: 'Test steps',
            },
            expectedResult: {
              type: 'string',
              description: 'Expected result',
            },
            stepsDetailed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string', description: 'Step content' },
                  expected: { type: 'string', description: 'Expected result for step' },
                },
              },
              description: 'Detailed test steps',
            },
            customFields: {
              type: 'object',
              description: 'Custom field values',
            },
          },
          required: ['sectionId', 'title'],
        },
      },
      {
        name: 'update_case',
        description: 'Update existing test case',
        inputSchema: {
          type: 'object',
          properties: {
            caseId: {
              type: 'number',
              description: 'Test case ID',
            },
            title: { type: 'string', description: 'Test case title' },
            templateId: { type: 'number', description: 'Template ID' },
            typeId: { type: 'number', description: 'Test case type ID' },
            priorityId: { type: 'number', description: 'Priority ID' },
            milestoneId: { type: 'number', description: 'Milestone ID' },
            refs: { type: 'string', description: 'References' },
            estimate: { type: 'string', description: 'Time estimate' },
            preconditions: { type: 'string', description: 'Test preconditions' },
            steps: { type: 'string', description: 'Test steps' },
            expectedResult: { type: 'string', description: 'Expected result' },
            stepsDetailed: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string', description: 'Step content' },
                  expected: { type: 'string', description: 'Expected result for step' },
                },
              },
              description: 'Detailed test steps with individual expected results',
            },
            customFields: { type: 'object', description: 'Custom field values' },
          },
          required: ['caseId'],
        },
      },
      {
        name: 'delete_case',
        description: 'Delete test case',
        inputSchema: {
          type: 'object',
          properties: {
            caseId: {
              type: 'number',
              description: 'Test case ID',
            },
          },
          required: ['caseId'],
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
            suiteId: {
              type: 'number',
              description: 'Suite ID (optional)',
            },
            isCompleted: {
              type: 'boolean',
              description: 'Filter by completion status',
            },
            milestoneId: {
              type: 'number',
              description: 'Milestone ID filter',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of runs to return',
            },
            offset: {
              type: 'number',
              description: 'Number of runs to skip',
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
              description: 'Run name',
            },
            description: {
              type: 'string',
              description: 'Run description',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID',
            },
            milestoneId: {
              type: 'number',
              description: 'Milestone ID',
            },
            assignedToId: {
              type: 'number',
              description: 'Assigned user ID',
            },
            includeAll: {
              type: 'boolean',
              description: 'Include all test cases',
            },
            caseIds: {
              type: 'array',
              items: { type: 'number' },
              description: 'Specific case IDs to include',
            },
            configIds: {
              type: 'array',
              items: { type: 'number' },
              description: 'Configuration IDs',
            },
          },
          required: ['projectId', 'name'],
        },
      },
      {
        name: 'update_run',
        description: 'Update test run',
        inputSchema: {
          type: 'object',
          properties: {
            runId: {
              type: 'number',
              description: 'Run ID',
            },
            name: { type: 'string', description: 'Run name' },
            description: { type: 'string', description: 'Run description' },
            milestoneId: { type: 'number', description: 'Milestone ID' },
            assignedToId: { type: 'number', description: 'Assigned user ID' },
          },
          required: ['runId'],
        },
      },
      {
        name: 'close_run',
        description: 'Close test run',
        inputSchema: {
          type: 'object',
          properties: {
            runId: {
              type: 'number',
              description: 'Run ID',
            },
          },
          required: ['runId'],
        },
      },
      {
        name: 'delete_run',
        description: 'Delete test run',
        inputSchema: {
          type: 'object',
          properties: {
            runId: {
              type: 'number',
              description: 'Run ID',
            },
          },
          required: ['runId'],
        },
      },

      // Test Execution Tools
      {
        name: 'get_tests',
        description: 'Get tests in a run',
        inputSchema: {
          type: 'object',
          properties: {
            runId: {
              type: 'number',
              description: 'Run ID',
            },
            statusId: {
              type: 'number',
              description: 'Filter by status ID',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of tests to return',
            },
            offset: {
              type: 'number',
              description: 'Number of tests to skip',
            },
          },
          required: ['runId'],
        },
      },
      {
        name: 'add_result',
        description: 'Add test result',
        inputSchema: {
          type: 'object',
          properties: {
            testId: {
              type: 'number',
              description: 'Test ID (required if not using runId+caseId)',
            },
            runId: {
              type: 'number',
              description: 'Run ID (required if using caseId)',
            },
            caseId: {
              type: 'number',
              description: 'Case ID (required if using runId)',
            },
            statusId: {
              type: 'number',
              description: 'Status ID (1=Passed, 2=Blocked, 3=Untested, 4=Retest, 5=Failed)',
            },
            comment: {
              type: 'string',
              description: 'Result comment',
            },
            version: {
              type: 'string',
              description: 'Version tested',
            },
            elapsed: {
              type: 'string',
              description: 'Time elapsed (e.g., "1m 30s")',
            },
            defects: {
              type: 'string',
              description: 'Associated defects',
            },
            assignedToId: {
              type: 'number',
              description: 'Assigned user ID',
            },
            stepResults: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string', description: 'Step content' },
                  expected: { type: 'string', description: 'Expected result' },
                  actual: { type: 'string', description: 'Actual result' },
                  statusId: { type: 'number', description: 'Status ID for this step' },
                },
              },
              description: 'Step-by-step results',
            },
            customFields: {
              type: 'object',
              description: 'Custom field values',
            },
          },
          required: ['statusId'],
        },
      },
      {
        name: 'add_bulk_results',
        description: 'Add multiple test results',
        inputSchema: {
          type: 'object',
          properties: {
            runId: {
              type: 'number',
              description: 'Run ID',
            },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  testId: { type: 'number', description: 'Test ID' },
                  caseId: { type: 'number', description: 'Case ID' },
                  statusId: { type: 'number', description: 'Status ID' },
                  comment: { type: 'string', description: 'Test result comment' },
                  version: { type: 'string', description: 'Version tested' },
                  elapsed: { type: 'string', description: 'Time elapsed' },
                  defects: { type: 'string', description: 'Defects found' },
                  assignedToId: { type: 'number', description: 'Assigned user ID' },
                  stepResults: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        content: { type: 'string', description: 'Step content' },
                        expected: { type: 'string', description: 'Expected result' },
                        actual: { type: 'string', description: 'Actual result' },
                        statusId: { type: 'number', description: 'Status ID for this step' },
                      },
                    },
                  },
                  customFields: { type: 'object', description: 'Custom field values' },
                },
                required: ['statusId'],
              },
              description: 'Array of test results',
            },
          },
          required: ['runId', 'results'],
        },
      },
      {
        name: 'get_results',
        description: 'Get test results',
        inputSchema: {
          type: 'object',
          properties: {
            testId: {
              type: 'number',
              description: 'Test ID (required if not using runId+caseId)',
            },
            runId: {
              type: 'number',
              description: 'Run ID (required if using caseId)',
            },
            caseId: {
              type: 'number',
              description: 'Case ID (required if using runId)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip',
            },
          },
        },
      },

      // Metadata Tools
      {
        name: 'get_users',
        description: 'Get TestRail users',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID (optional, gets all users if not specified)',
            },
          },
        },
      },
      {
        name: 'get_statuses',
        description: 'Get available test statuses',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_priorities',
        description: 'Get available test case priorities',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_case_types',
        description: 'Get available test case types',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Advanced Tools
      {
        name: 'generate_report',
        description: 'Generate comprehensive test report',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID (optional)',
            },
            runId: {
              type: 'number',
              description: 'Run ID (optional)',
            },
            planId: {
              type: 'number',
              description: 'Plan ID (optional)',
            },
            milestoneId: {
              type: 'number',
              description: 'Milestone ID (optional)',
            },
            dateRange: {
              type: 'object',
              properties: {
                start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
              },
              description: 'Date range filter',
            },
            format: {
              type: 'string',
              enum: ['summary', 'detailed', 'csv', 'json'],
              description: 'Report format',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'search',
        description: 'Search across TestRail entities',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            query: {
              type: 'string',
              description: 'Search query',
            },
            entityType: {
              type: 'string',
              enum: ['cases', 'runs', 'results', 'plans', 'milestones'],
              description: 'Entity type to search',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip',
            },
          },
          required: ['projectId', 'query'],
        },
      },

      // Advanced Project & Suite Management Tools
      {
        name: 'create_advanced_project',
        description: 'Create a comprehensive project with templates and initial structure',
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
              enum: [1, 2, 3],
              description: 'Suite mode (1=single, 2=single+baselines, 3=multiple)',
            },
            template: {
              type: 'object',
              description: 'Project template configuration',
              properties: {
                createDefaultSuites: {
                  type: 'boolean',
                  description: 'Create default test suites',
                },
                createDefaultSections: {
                  type: 'boolean',
                  description: 'Create default sections',
                },
                createSampleCases: {
                  type: 'boolean',
                  description: 'Create sample test cases',
                },
                suiteNames: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Custom suite names',
                },
                sectionStructure: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Section name' },
                      description: { type: 'string', description: 'Section description' },
                      subsections: {
                        type: 'array',
                        items: { type: 'string', description: 'Subsection name' },
                      },
                    },
                  },
                  description: 'Section structure definition',
                },
              },
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'analyze_project_structure',
        description: 'Analyze project structure and provide health recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID to analyze',
            },
            includeStatistics: {
              type: 'boolean',
              description: 'Include detailed statistics',
            },
            includeCoverage: {
              type: 'boolean',
              description: 'Include test coverage analysis',
            },
            includeRecommendations: {
              type: 'boolean',
              description: 'Include improvement recommendations',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'bulk_manage_suites',
        description: 'Perform bulk operations on test suites with validation',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            operations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['create', 'update', 'delete', 'archive', 'reorganize'],
                    description: 'Operation type',
                  },
                  suiteId: {
                    type: 'number',
                    description: 'Suite ID (for update/delete operations)',
                  },
                  data: {
                    type: 'object',
                    description: 'Operation data',
                  },
                  targetPosition: {
                    type: 'number',
                    description: 'Target position for reorganization',
                  },
                },
              },
              description: 'List of operations to perform',
            },
            validateBefore: {
              type: 'boolean',
              description: 'Validate operations before execution',
            },
            dryRun: {
              type: 'boolean',
              description: 'Perform dry run without actual changes',
            },
          },
          required: ['projectId', 'operations'],
        },
      },
      {
        name: 'create_advanced_suite',
        description: 'Create a comprehensive suite with templates and structure',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            name: {
              type: 'string',
              description: 'Suite name',
            },
            description: {
              type: 'string',
              description: 'Suite description',
            },
            template: {
              type: 'string',
              enum: ['functional', 'api', 'performance', 'security', 'mobile', 'custom'],
              description: 'Suite template type',
            },
            structure: {
              type: 'object',
              description: 'Suite structure configuration',
              properties: {
                sections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Section name' },
                      description: { type: 'string', description: 'Section description' },
                      subsections: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', description: 'Subsection name' },
                            description: { type: 'string', description: 'Subsection description' },
                          },
                        },
                      },
                    },
                  },
                  description: 'Section structure',
                },
                sampleCases: {
                  type: 'boolean',
                  description: 'Create sample test cases',
                },
                caseTemplates: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string', description: 'Case title' },
                      type: { type: 'string', description: 'Case type' },
                      priority: { type: 'string', description: 'Case priority' },
                      steps: { type: 'string', description: 'Test steps' },
                      expected: { type: 'string', description: 'Expected result' },
                    },
                  },
                  description: 'Custom case templates',
                },
              },
            },
          },
          required: ['projectId', 'name'],
        },
      },

      // Reporting & Analytics Tools
      {
        name: 'generate_project_dashboard',
        description: 'Generate comprehensive project dashboard with metrics and trends',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            timeRange: {
              type: 'object',
              properties: {
                start: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD)',
                },
                end: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD)',
                },
              },
              description: 'Time range for analysis',
            },
            includeMetrics: {
              type: 'boolean',
              description: 'Include detailed metrics',
            },
            includeTrends: {
              type: 'boolean',
              description: 'Include trend analysis',
            },
            includeTopFailures: {
              type: 'boolean',
              description: 'Include top failure analysis',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'generate_execution_report',
        description: 'Generate detailed test execution report',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            runId: {
              type: 'number',
              description: 'Test run ID (optional)',
            },
            planId: {
              type: 'number',
              description: 'Test plan ID (optional)',
            },
            format: {
              type: 'string',
              enum: ['summary', 'detailed', 'executive'],
              description: 'Report format',
            },
            includeFailureAnalysis: {
              type: 'boolean',
              description: 'Include failure analysis',
            },
            includePerformanceMetrics: {
              type: 'boolean',
              description: 'Include performance metrics',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'analyze_case_metrics',
        description: 'Analyze test case metrics and health',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID (optional)',
            },
            timeRange: {
              type: 'object',
              properties: {
                start: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD)',
                },
                end: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD)',
                },
              },
              description: 'Time range for analysis',
            },
            includeFlakiness: {
              type: 'boolean',
              description: 'Include flakiness analysis',
            },
            includeExecutionTrends: {
              type: 'boolean',
              description: 'Include execution trends',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'generate_coverage_report',
        description: 'Generate comprehensive test coverage report',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'Project ID',
            },
            suiteId: {
              type: 'number',
              description: 'Suite ID (optional)',
            },
            requirementField: {
              type: 'string',
              description: 'Custom field containing requirements',
            },
            componentField: {
              type: 'string',
              description: 'Custom field containing components',
            },
          },
          required: ['projectId'],
        },
      },

      // Integration Tools
      {
        name: 'autospectra_sync',
        description: 'Synchronize AutoSpectra test results with TestRail',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'number',
              description: 'TestRail project ID',
            },
            testSuite: {
              type: 'object',
              properties: {
                suiteId: { type: 'string', description: 'AutoSpectra suite ID' },
                name: { type: 'string', description: 'Suite name' },
                results: {
                  type: 'array',
                  description: 'Array of test results',
                  items: {
                    type: 'object',
                    properties: {
                      testId: { type: 'string', description: 'Test ID' },
                      title: { type: 'string', description: 'Test title' },
                      status: {
                        type: 'string',
                        enum: ['passed', 'failed', 'skipped', 'blocked'],
                        description: 'Test status',
                      },
                      duration: { type: 'number', description: 'Test duration in seconds' },
                      error: { type: 'string', description: 'Error message if test failed' },
                      metadata: { type: 'object', description: 'Additional test metadata' },
                    },
                  },
                },
                summary: {
                  type: 'object',
                  description: 'Test execution summary',
                  properties: {
                    total: { type: 'number', description: 'Total number of tests' },
                    passed: { type: 'number', description: 'Number of passed tests' },
                    failed: { type: 'number', description: 'Number of failed tests' },
                    skipped: { type: 'number', description: 'Number of skipped tests' },
                    blocked: { type: 'number', description: 'Number of blocked tests' },
                    duration: { type: 'number', description: 'Total execution duration' },
                  },
                },
              },
              description: 'AutoSpectra test suite data',
            },
            options: {
              type: 'object',
              properties: {
                createCasesIfMissing: {
                  type: 'boolean',
                  description: "Create test cases if they don't exist",
                },
                milestoneId: { type: 'number', description: 'Milestone ID to associate with' },
                environment: { type: 'string', description: 'Test environment' },
                buildNumber: { type: 'string', description: 'Build number' },
              },
              description: 'Sync options',
            },
          },
          required: ['projectId', 'testSuite'],
        },
      },

      // Plan Entry Management Tools
      {
        name: 'add_plan_entry',
        description: 'Add entry to test plan',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'number', description: 'Test plan ID' },
            suiteId: { type: 'number', description: 'Suite ID for the entry' },
            name: { type: 'string', description: 'Entry name' },
            description: { type: 'string', description: 'Entry description' },
            assignedToId: { type: 'number', description: 'Assigned user ID' },
            includeAll: { type: 'boolean', description: 'Include all test cases' },
            caseIds: { type: 'array', items: { type: 'number' }, description: 'Specific case IDs' },
            configIds: {
              type: 'array',
              items: { type: 'number' },
              description: 'Configuration IDs',
            },
            runs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  includeAll: { type: 'boolean' },
                  caseIds: { type: 'array', items: { type: 'number' } },
                  configIds: { type: 'array', items: { type: 'number' } },
                  assignedToId: { type: 'number' },
                },
              },
              description: 'Run configurations',
            },
          },
          required: ['planId', 'suiteId'],
        },
      },
      {
        name: 'update_plan_entry',
        description: 'Update test plan entry',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'number', description: 'Test plan ID' },
            entryId: { type: 'string', description: 'Plan entry ID' },
            name: { type: 'string', description: 'Entry name' },
            description: { type: 'string', description: 'Entry description' },
            assignedToId: { type: 'number', description: 'Assigned user ID' },
            includeAll: { type: 'boolean', description: 'Include all test cases' },
            caseIds: { type: 'array', items: { type: 'number' }, description: 'Specific case IDs' },
          },
          required: ['planId', 'entryId'],
        },
      },
      {
        name: 'delete_plan_entry',
        description: 'Delete test plan entry',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'number', description: 'Test plan ID' },
            entryId: { type: 'string', description: 'Plan entry ID' },
          },
          required: ['planId', 'entryId'],
        },
      },
      {
        name: 'get_plan_entries',
        description: 'Get test plan entries',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'number', description: 'Test plan ID' },
          },
          required: ['planId'],
        },
      },
      {
        name: 'close_plan_entry',
        description: 'Close test plan entry',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'number', description: 'Test plan ID' },
            entryId: { type: 'string', description: 'Plan entry ID' },
          },
          required: ['planId', 'entryId'],
        },
      },
      {
        name: 'reopen_plan',
        description: 'Reopen test plan',
        inputSchema: {
          type: 'object',
          properties: {
            planId: { type: 'number', description: 'Test plan ID' },
          },
          required: ['planId'],
        },
      },

      // Enhanced Milestone Management Tools
      {
        name: 'get_milestone',
        description: 'Get specific milestone by ID',
        inputSchema: {
          type: 'object',
          properties: {
            milestoneId: { type: 'number', description: 'Milestone ID' },
          },
          required: ['milestoneId'],
        },
      },
      {
        name: 'create_milestone',
        description: 'Create new milestone (enhanced)',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
            name: { type: 'string', description: 'Milestone name' },
            description: { type: 'string', description: 'Milestone description' },
            dueOn: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
            parentId: { type: 'number', description: 'Parent milestone ID' },
            refs: { type: 'string', description: 'References' },
          },
          required: ['projectId', 'name'],
        },
      },
      {
        name: 'update_milestone',
        description: 'Update milestone (enhanced)',
        inputSchema: {
          type: 'object',
          properties: {
            milestoneId: { type: 'number', description: 'Milestone ID' },
            name: { type: 'string', description: 'Milestone name' },
            description: { type: 'string', description: 'Milestone description' },
            dueOn: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
            isCompleted: { type: 'boolean', description: 'Completion status' },
            isStarted: { type: 'boolean', description: 'Started status' },
            refs: { type: 'string', description: 'References' },
          },
          required: ['milestoneId'],
        },
      },
      {
        name: 'delete_milestone',
        description: 'Delete milestone (enhanced)',
        inputSchema: {
          type: 'object',
          properties: {
            milestoneId: { type: 'number', description: 'Milestone ID' },
          },
          required: ['milestoneId'],
        },
      },
      {
        name: 'get_milestone_dependencies',
        description: 'Get milestone dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            milestoneId: { type: 'number', description: 'Milestone ID' },
          },
          required: ['milestoneId'],
        },
      },
      {
        name: 'update_milestone_dependencies',
        description: 'Update milestone dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            milestoneId: { type: 'number', description: 'Milestone ID' },
            dependencies: {
              type: 'array',
              items: { type: 'number' },
              description: 'Dependency milestone IDs',
            },
          },
          required: ['milestoneId', 'dependencies'],
        },
      },

      // Templates & Configurations Tools
      {
        name: 'get_templates',
        description: 'Get case templates for project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'get_configurations',
        description: 'Get configurations for project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'get_config_groups',
        description: 'Get configuration groups for project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
          },
          required: ['projectId'],
        },
      },

      // Project Administration Tools
      {
        name: 'update_project',
        description: 'Update existing project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
            name: { type: 'string', description: 'Project name' },
            announcement: { type: 'string', description: 'Project announcement' },
            showAnnouncement: { type: 'boolean', description: 'Show announcement' },
            suiteMode: { type: 'number', description: 'Suite mode' },
            isCompleted: { type: 'boolean', description: 'Completion status' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'delete_project',
        description: 'Delete project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'get_project_permissions',
        description: 'Get project permissions',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
            userId: { type: 'number', description: 'User ID (optional)' },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'update_project_permissions',
        description: 'Update project permissions',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
            userId: { type: 'number', description: 'User ID' },
            permissions: { type: 'object', description: 'Permission settings' },
          },
          required: ['projectId', 'userId', 'permissions'],
        },
      },

      // Enhanced Reporting Tools
      {
        name: 'export_cases',
        description: 'Export test cases',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
            suiteId: { type: 'number', description: 'Suite ID (optional)' },
            sectionId: { type: 'number', description: 'Section ID (optional)' },
            format: { type: 'string', enum: ['csv', 'xml', 'excel'], description: 'Export format' },
            filter: {
              type: 'object',
              properties: {
                priority_id: { type: 'array', items: { type: 'number' } },
                type_id: { type: 'array', items: { type: 'number' } },
                created_by: { type: 'array', items: { type: 'number' } },
                milestone_id: { type: 'array', items: { type: 'number' } },
              },
              description: 'Filter criteria',
            },
          },
          required: ['projectId', 'format'],
        },
      },
      {
        name: 'export_runs',
        description: 'Export test runs',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
            runId: { type: 'number', description: 'Specific run ID (optional)' },
            format: {
              type: 'string',
              enum: ['csv', 'xml', 'excel', 'pdf'],
              description: 'Export format',
            },
            includeResults: { type: 'boolean', description: 'Include test results' },
            dateRange: {
              type: 'object',
              description: 'Date range filter for export',
              properties: {
                start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
              },
            },
          },
          required: ['projectId', 'format'],
        },
      },
      {
        name: 'get_reports',
        description: 'Get detailed reports',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: { type: 'number', description: 'Project ID' },
            type: {
              type: 'string',
              enum: ['summary', 'progress', 'activity', 'comparison'],
              description: 'Report type',
            },
            suiteId: { type: 'number', description: 'Suite ID (optional)' },
            runId: { type: 'number', description: 'Run ID (optional)' },
            planId: { type: 'number', description: 'Plan ID (optional)' },
            milestoneId: { type: 'number', description: 'Milestone ID (optional)' },
            dateRange: {
              type: 'object',
              description: 'Date range filter for reports',
              properties: {
                start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
              },
            },
          },
          required: ['projectId', 'type'],
        },
      },

      // Attachments Tools
      {
        name: 'add_attachment',
        description: 'Add attachment to entity',
        inputSchema: {
          type: 'object',
          properties: {
            entityType: {
              type: 'string',
              enum: ['case', 'result', 'plan', 'run', 'test'],
              description: 'Entity type',
            },
            entityId: { type: 'number', description: 'Entity ID' },
            filePath: { type: 'string', description: 'File path' },
            fileName: { type: 'string', description: 'File name (optional)' },
          },
          required: ['entityType', 'entityId', 'filePath'],
        },
      },
      {
        name: 'get_attachments',
        description: 'Get attachments for entity',
        inputSchema: {
          type: 'object',
          properties: {
            entityType: {
              type: 'string',
              enum: ['case', 'result', 'plan', 'run', 'test'],
              description: 'Entity type',
            },
            entityId: { type: 'number', description: 'Entity ID' },
          },
          required: ['entityType', 'entityId'],
        },
      },
      {
        name: 'delete_attachment',
        description: 'Delete attachment',
        inputSchema: {
          type: 'object',
          properties: {
            attachmentId: { type: 'number', description: 'Attachment ID' },
          },
          required: ['attachmentId'],
        },
      },

      // User Management Tools
      {
        name: 'create_user',
        description: 'Create new user',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'User name' },
            email: { type: 'string', description: 'User email' },
            roleId: { type: 'number', description: 'Role ID (optional)' },
            isActive: { type: 'boolean', description: 'Active status (optional)' },
          },
          required: ['name', 'email'],
        },
      },
      {
        name: 'update_user',
        description: 'Update existing user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'number', description: 'User ID' },
            name: { type: 'string', description: 'User name' },
            email: { type: 'string', description: 'User email' },
            roleId: { type: 'number', description: 'Role ID' },
            isActive: { type: 'boolean', description: 'Active status' },
          },
          required: ['userId'],
        },
      },
    ];
  }

  /**
   * Setup tool request handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getToolDefinitions(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        console.log(`🔧 Executing tool: ${name}`);

        // Route to appropriate tool method
        switch (name) {
          // Connection & Authentication
          case 'connect_testrail':
            return await this.tools.connectTestRail(args as any);
          case 'test_connection':
            return await this.tools.testConnection();

          // Project Management
          case 'get_projects':
            return await this.tools.getProjects(args as any);
          case 'get_project':
            return await this.tools.getProject(args as any);
          case 'create_project':
            return await this.tools.createProject(args as any);

          // Suite Management
          case 'get_suites':
            return await this.tools.getSuites(args as any);
          case 'create_suite':
            return await this.tools.createSuite(args as any);

          // Section Management
          case 'get_sections':
            return await this.tools.getSections(args as any);
          case 'create_section':
            return await this.tools.createSection(args as any);

          // Test Case Management
          case 'get_cases':
            return await this.tools.getCases(args as any);
          case 'create_case':
            return await this.tools.createCase(args as any);
          case 'update_case':
            return await this.tools.updateCase(args as any);
          case 'delete_case':
            return await this.tools.deleteCase(args as any);

          // Test Run Management
          case 'get_runs':
            return await this.tools.getRuns(args as any);
          case 'create_run':
            return await this.tools.createRun(args as any);
          case 'update_run':
            return await this.tools.updateRun(args as any);
          case 'close_run':
            return await this.tools.closeRun(args as any);
          case 'delete_run':
            return await this.tools.deleteRun(args as any);

          // Test Execution
          case 'get_tests':
            return await this.tools.getTests(args as any);
          case 'add_result':
            return await this.tools.addResult(args as any);
          case 'add_bulk_results':
            return await this.tools.addBulkResults(args as any);
          case 'get_results':
            return await this.tools.getResults(args as any);

          // Metadata
          case 'get_users':
            return await this.tools.getUsers(args as any);
          case 'get_statuses':
            return await this.tools.getStatuses();
          case 'get_priorities':
            return await this.tools.getPriorities();
          case 'get_case_types':
            return await this.tools.getCaseTypes();

          // Advanced Tools
          case 'generate_report':
            return await this.tools.generateReport(args as any);
          case 'search':
            return await this.tools.search(args as any);

          // Advanced Project & Suite Management
          case 'create_advanced_project':
            return await this.tools.createAdvancedProject(args as any);
          case 'analyze_project_structure':
            return await this.tools.analyzeProjectStructure(args as any);
          case 'bulk_manage_suites':
            return await this.tools.bulkManageSuites(args as any);
          case 'create_advanced_suite':
            return await this.tools.createAdvancedSuite(args as any);

          // Reporting & Analytics
          case 'generate_project_dashboard':
            return await this.tools.generateProjectDashboard(args as any);
          case 'generate_execution_report':
            return await this.tools.generateExecutionReport(args as any);
          case 'analyze_case_metrics':
            return await this.tools.analyzeCaseMetrics(args as any);
          case 'generate_coverage_report':
            return await this.tools.generateCoverageReport(args as any);

          // Integration Tools
          case 'autospectra_sync':
            return await this.tools.autoSpectraSync(args as any);

          // Plan Entry Management
          case 'add_plan_entry':
            return await this.tools.addPlanEntry(args as any);
          case 'update_plan_entry':
            return await this.tools.updatePlanEntry(args as any);
          case 'delete_plan_entry':
            return await this.tools.deletePlanEntry(args as any);
          case 'get_plan_entries':
            return await this.tools.getPlanEntries(args as any);
          case 'close_plan_entry':
            return await this.tools.closePlanEntry(args as any);
          case 'reopen_plan':
            return await this.tools.reopenPlan(args as any);

          // Enhanced Milestone Management
          case 'get_milestone':
            return await this.tools.getMilestone(args as any);
          case 'create_milestone':
            return await this.tools.createMilestone(args as any);
          case 'update_milestone':
            return await this.tools.updateMilestone(args as any);
          case 'delete_milestone':
            return await this.tools.deleteMilestone(args as any);
          case 'get_milestone_dependencies':
            return await this.tools.getMilestoneDependencies(args as any);
          case 'update_milestone_dependencies':
            return await this.tools.updateMilestoneDependencies(args as any);

          // Templates & Configurations
          case 'get_templates':
            return await this.tools.getTemplates(args as any);
          case 'get_configurations':
            return await this.tools.getConfigurations(args as any);
          case 'get_config_groups':
            return await this.tools.getConfigGroups(args as any);

          // Project Administration
          case 'update_project':
            return await this.tools.updateProject(args as any);
          case 'delete_project':
            return await this.tools.deleteProject(args as any);
          case 'get_project_permissions':
            return await this.tools.getProjectPermissions(args as any);
          case 'update_project_permissions':
            return await this.tools.updateProjectPermissions(args as any);

          // Enhanced Reporting
          case 'export_cases':
            return await this.tools.exportCases(args as any);
          case 'export_runs':
            return await this.tools.exportRuns(args as any);
          case 'get_reports':
            return await this.tools.getReports(args as any);

          // Attachments
          case 'add_attachment':
            return await this.tools.addAttachment(args as any);
          case 'get_attachments':
            return await this.tools.getAttachments(args as any);
          case 'delete_attachment':
            return await this.tools.deleteAttachment(args as any);

          // User Management
          case 'create_user':
            return await this.tools.createUser(args as any);
          case 'update_user':
            return await this.tools.updateUser(args as any);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }

        console.error('❌ Error handling tool request:', error);
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : String(error)
        );
      }
    });
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('🚀 TestRail MCP Server running on stdio');
      console.log('📋 Available tools:', this.getToolDefinitions().length);
      console.log('🔗 Ready to connect to TestRail!');
    } catch (error) {
      console.error('❌ Failed to start TestRail MCP Server:', error);
      process.exit(1);
    }
  }
}

// Check if running as main module
if (require.main === module) {
  const server = new TestRailMCPServer();
  server.run().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { TestRailMCPServer };
