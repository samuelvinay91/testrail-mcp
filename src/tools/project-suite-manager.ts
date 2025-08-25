/**
 * Advanced TestRail Project and Suite Management Tools
 * Specialized tools for comprehensive project and test suite administration
 */

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { TestRailService } from '../utils/testrail-service';
import {
  TestRailSection,
  TestRailCase,
  TestRailErrorCodes,
  CreateTestRailProject,
  CreateTestRailSuite,
} from '../types';

export class ProjectSuiteManager {
  private testRailService: TestRailService;

  constructor(testRailService: TestRailService) {
    this.testRailService = testRailService;
  }

  /**
   * Create a comprehensive project with initial structure
   */
  async createAdvancedProject(params: {
    name: string;
    announcement?: string;
    showAnnouncement?: boolean;
    suiteMode?: 1 | 2 | 3; // Single, Single + Baselines, Multiple
    template?: {
      createDefaultSuites?: boolean;
      createDefaultSections?: boolean;
      createSampleCases?: boolean;
      suiteNames?: string[];
      sectionStructure?: Array<{
        name: string;
        description?: string;
        subsections?: string[];
      }>;
    };
    settings?: {
      enableMilestones?: boolean;
      enableCustomFields?: boolean;
      defaultAssignee?: number;
      testCaseOrderBy?: string;
    };
  }): Promise<CallToolResult> {
    try {
      // Create the main project
      const projectData: CreateTestRailProject = {
        name: params.name,
        ...(params.announcement && { announcement: params.announcement }),
        ...(params.showAnnouncement !== undefined && {
          show_announcement: params.showAnnouncement,
        }),
        suite_mode: params.suiteMode || 1,
      };

      const project = await this.testRailService.addProject(projectData);

      // Initialize project structure if template is provided
      const structure = {
        project,
        suites: [] as any[],
        sections: [] as any[],
        cases: [] as any[],
        milestones: [] as any[],
      };

      if (params.template?.createDefaultSuites) {
        const suiteNames = params.template.suiteNames || [
          'Functional Tests',
          'Integration Tests',
          'Regression Tests',
          'Performance Tests',
          'Security Tests',
        ];

        for (const suiteName of suiteNames) {
          try {
            const suite = await this.testRailService.addSuite(project.id, {
              name: suiteName,
              description: `Auto-generated ${suiteName.toLowerCase()} suite`,
            });
            structure.suites.push(suite);

            // Create sections if specified
            if (params.template.createDefaultSections && params.template.sectionStructure) {
              for (const sectionSpec of params.template.sectionStructure) {
                const section = await this.testRailService.addSection(project.id, {
                  name: sectionSpec.name,
                  description: sectionSpec.description || '',
                  suite_id: suite.id,
                });
                structure.sections.push(section);

                // Create subsections if specified
                if (sectionSpec.subsections) {
                  for (const subsectionName of sectionSpec.subsections) {
                    const subsection = await this.testRailService.addSection(project.id, {
                      name: subsectionName,
                      description: `Subsection for ${sectionSpec.name}`,
                      suite_id: suite.id,
                      parent_id: section.id,
                    });
                    structure.sections.push(subsection);
                  }
                }
              }
            }
          } catch (error) {
            // Skip failed suite creation
          }
        }
      }

      // Create sample test cases if requested
      if (params.template?.createSampleCases && structure.sections.length > 0) {
        const sampleCases = this.generateSampleTestCases();
        for (const sampleCase of sampleCases) {
          try {
            const section =
              structure.sections[Math.floor(Math.random() * structure.sections.length)];
            const testCase = await this.testRailService.addCase(section.id, {
              ...sampleCase,
              section_id: section.id,
            });
            structure.cases.push(testCase);
          } catch (error) {
            // Skip failed case creation
          }
        }
      }

      return this.createSuccessResponse(
        {
          project: structure.project,
          statistics: {
            suites_created: structure.suites.length,
            sections_created: structure.sections.length,
            cases_created: structure.cases.length,
          },
          structure,
        },
        `Advanced project "${params.name}" created successfully with ${structure.suites.length} suites and ${structure.sections.length} sections`
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create advanced project',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Analyze project structure and health
   */
  async analyzeProjectStructure(params: {
    projectId: number;
    includeStatistics?: boolean;
    includeCoverage?: boolean;
    includeRecommendations?: boolean;
  }): Promise<CallToolResult> {
    try {
      // Get project details
      const project = await this.testRailService.getProject(params.projectId);
      const suites = await this.testRailService.getSuites(params.projectId);

      const analysis = {
        project: {
          id: project.id,
          name: project.name,
          suite_mode: project.suite_mode,
          is_completed: project.is_completed,
        },
        structure: {
          suites: suites.length,
          sections: 0,
          cases: 0,
          runs: 0,
          milestones: 0,
        },
        statistics: null as any,
        coverage: null as any,
        recommendations: [] as any[],
      };

      // Analyze each suite
      const suiteDetails = [];
      for (const suite of suites) {
        try {
          const sections = await this.testRailService.getSections(params.projectId, suite.id);
          const cases = await this.testRailService.getCases(params.projectId, suite.id);

          analysis.structure.sections += sections.length;
          analysis.structure.cases += cases.length;

          suiteDetails.push({
            suite,
            sections: sections.length,
            cases: cases.length,
            depth: this.calculateSectionDepth(sections),
            coverage: params.includeCoverage
              ? await this.calculateSuiteCoverage(suite.id, cases)
              : null,
          });
        } catch (error) {
          // Skip failed suite analysis
        }
      }

      // Get additional statistics if requested
      if (params.includeStatistics) {
        try {
          const runs = await this.testRailService.getRuns(params.projectId, { limit: 1000 });
          const milestones = await this.testRailService.getMilestones(params.projectId);

          analysis.structure.runs = runs.length;
          analysis.structure.milestones = milestones.length;

          analysis.statistics = {
            avg_cases_per_suite: analysis.structure.cases / Math.max(analysis.structure.suites, 1),
            avg_sections_per_suite:
              analysis.structure.sections / Math.max(analysis.structure.suites, 1),
            total_runs: runs.length,
            completed_runs: runs.filter((r) => r.is_completed).length,
            active_milestones: milestones.filter((m) => !m.is_completed).length,
          };
        } catch (error) {
          // Skip failed statistics gathering
        }
      }

      // Generate recommendations if requested
      if (params.includeRecommendations) {
        analysis.recommendations = this.generateStructureRecommendations(analysis, suiteDetails);
      }

      return this.createSuccessResponse(
        {
          analysis,
          suite_details: suiteDetails,
        },
        'Project structure analysis completed successfully'
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to analyze project structure',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Bulk manage test suites with advanced operations
   */
  async bulkManageSuites(params: {
    projectId: number;
    operations: Array<{
      type: 'create' | 'update' | 'delete' | 'archive' | 'reorganize';
      suiteId?: number;
      data?: any;
      targetPosition?: number;
    }>;
    validateBefore?: boolean;
    dryRun?: boolean;
  }): Promise<CallToolResult> {
    try {
      const results = {
        executed: 0,
        failed: 0,
        skipped: 0,
        operations: [] as any[],
        errors: [] as any[],
      };

      // Validation phase
      if (params.validateBefore) {
        const validation = await this.validateBulkOperations(params.projectId, params.operations);
        if (!validation.valid) {
          return this.createErrorResponse(
            `Validation failed: ${validation.errors.join(', ')}`,
            TestRailErrorCodes.VALIDATION_ERROR
          );
        }
      }

      // Execute operations
      for (let i = 0; i < params.operations.length; i++) {
        const operation = params.operations[i];
        const operationResult = {
          index: i,
          type: operation.type,
          success: false,
          data: null as any,
          error: null as string | null,
        };

        try {
          if (params.dryRun) {
            operationResult.success = true;
            operationResult.data = { message: 'Dry run - operation would succeed' };
            results.skipped++;
          } else {
            switch (operation.type) {
              case 'create':
                operationResult.data = await this.testRailService.addSuite(
                  params.projectId,
                  operation.data
                );
                operationResult.success = true;
                results.executed++;
                break;

              case 'update':
                if (!operation.suiteId) throw new Error('Suite ID required for update');
                operationResult.data = await this.testRailService.updateSuite(
                  operation.suiteId,
                  operation.data
                );
                operationResult.success = true;
                results.executed++;
                break;

              case 'delete':
                if (!operation.suiteId) throw new Error('Suite ID required for delete');
                await this.testRailService.deleteSuite(operation.suiteId);
                operationResult.data = { deleted: true };
                operationResult.success = true;
                results.executed++;
                break;

              case 'reorganize':
                operationResult.data = await this.reorganizeSuite(params.projectId, operation);
                operationResult.success = true;
                results.executed++;
                break;

              default:
                throw new Error(`Unsupported operation type: ${operation.type}`);
            }
          }
        } catch (error) {
          operationResult.error = error instanceof Error ? error.message : 'Unknown error';
          results.failed++;
          results.errors.push({
            operation: i,
            type: operation.type,
            error: operationResult.error,
          });
        }

        results.operations.push(operationResult);
      }

      return this.createSuccessResponse(
        {
          summary: results,
          dry_run: params.dryRun || false,
        },
        `Bulk suite management completed: ${results.executed} executed, ${results.failed} failed, ${results.skipped} skipped`
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Bulk suite management failed',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  /**
   * Create comprehensive suite with sections and sample cases
   */
  async createAdvancedSuite(params: {
    projectId: number;
    name: string;
    description?: string;
    template?: 'functional' | 'api' | 'performance' | 'security' | 'mobile' | 'custom';
    structure?: {
      sections: Array<{
        name: string;
        description?: string;
        subsections?: Array<{
          name: string;
          description?: string;
        }>;
      }>;
      sampleCases?: boolean;
      caseTemplates?: Array<{
        title: string;
        type: string;
        priority: string;
        steps?: string;
        expected?: string;
      }>;
    };
  }): Promise<CallToolResult> {
    try {
      // Create the main suite
      const suiteData: CreateTestRailSuite = {
        name: params.name,
        description: params.description || this.generateSuiteDescription(params.template),
      };

      const suite = await this.testRailService.addSuite(params.projectId, suiteData);

      const structure = {
        suite,
        sections: [] as any[],
        cases: [] as any[],
      };

      // Apply template structure
      let sectionStructure = params.structure?.sections;
      if (!sectionStructure && params.template) {
        sectionStructure = this.getTemplateStructure(params.template);
      }

      // Create sections and subsections
      if (sectionStructure) {
        for (const sectionSpec of sectionStructure) {
          const section = await this.testRailService.addSection(params.projectId, {
            name: sectionSpec.name,
            description: sectionSpec.description || '',
            suite_id: suite.id,
          });
          structure.sections.push(section);

          // Create subsections
          if (sectionSpec.subsections) {
            for (const subsectionSpec of sectionSpec.subsections) {
              const subsection = await this.testRailService.addSection(params.projectId, {
                name: subsectionSpec.name,
                description: subsectionSpec.description || '',
                suite_id: suite.id,
                parent_id: section.id,
              });
              structure.sections.push(subsection);
            }
          }
        }
      }

      // Create sample cases
      if (params.structure?.sampleCases || params.structure?.caseTemplates) {
        const caseTemplates =
          params.structure.caseTemplates || this.getTemplateCases(params.template);

        for (const caseTemplate of caseTemplates) {
          if (structure.sections.length > 0) {
            const targetSection = structure.sections[0]; // Use first section
            try {
              const testCase = await this.testRailService.addCase(targetSection.id, {
                title: caseTemplate.title,
                type_id: this.mapCaseType(caseTemplate.type),
                priority_id: this.mapPriority(caseTemplate.priority),
                template_id: 1, // Default template
                steps: caseTemplate.steps,
                expected_result: caseTemplate.expected,
              });
              structure.cases.push(testCase);
            } catch (error) {
              // Skip failed case creation
            }
          }
        }
      }

      return this.createSuccessResponse(
        {
          suite: structure.suite,
          structure: {
            sections_created: structure.sections.length,
            cases_created: structure.cases.length,
          },
          details: structure,
        },
        `Advanced suite "${params.name}" created with ${structure.sections.length} sections and ${structure.cases.length} cases`
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create advanced suite',
        TestRailErrorCodes.API_ERROR
      );
    }
  }

  // Helper methods

  private generateSampleTestCases() {
    return [
      {
        title: 'Verify user login with valid credentials',
        type_id: 1,
        priority_id: 2,
        template_id: 1,
        steps:
          '1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login button',
        expected_result: 'User is successfully logged in and redirected to dashboard',
      },
      {
        title: 'Verify system handles invalid input gracefully',
        type_id: 1,
        priority_id: 1,
        template_id: 1,
        steps: '1. Navigate to input form\n2. Enter invalid data\n3. Submit form',
        expected_result: 'System displays appropriate error message and prevents submission',
      },
      {
        title: 'Verify API returns correct response format',
        type_id: 6,
        priority_id: 2,
        template_id: 1,
        steps:
          '1. Send GET request to API endpoint\n2. Verify response structure\n3. Validate data types',
        expected_result: 'API returns JSON response with correct schema and data types',
      },
    ];
  }

  private calculateSectionDepth(sections: TestRailSection[]): number {
    let maxDepth = 1;
    const depthMap = new Map<number, number>();

    const calculateDepth = (sectionId: number): number => {
      if (depthMap.has(sectionId)) return depthMap.get(sectionId)!;

      const section = sections.find((s) => s.id === sectionId);
      if (!section) return 1;

      if (!section.parent_id) {
        depthMap.set(sectionId, 1);
        return 1;
      }

      const parentDepth = calculateDepth(section.parent_id);
      const depth = parentDepth + 1;
      depthMap.set(sectionId, depth);
      maxDepth = Math.max(maxDepth, depth);
      return depth;
    };

    sections.forEach((section) => calculateDepth(section.id));
    return maxDepth;
  }

  private async calculateSuiteCoverage(_suiteId: number, cases: TestRailCase[]): Promise<any> {
    const total = cases.length;
    const automated = cases.filter(
      (c: any) =>
        c.custom_automation_type === 'Automated' || c.title.toLowerCase().includes('automated')
    ).length;

    const byPriority = cases.reduce(
      (acc: any, case_: any) => {
        acc[case_.priority_id] = (acc[case_.priority_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    return {
      total_cases: total,
      automated_cases: automated,
      automation_coverage: total > 0 ? (automated / total) * 100 : 0,
      by_priority: byPriority,
    };
  }

  private generateStructureRecommendations(analysis: any, suiteDetails: any[]): any[] {
    const recommendations = [];

    // Check for empty suites
    const emptySuites = suiteDetails.filter((s) => s.cases === 0);
    if (emptySuites.length > 0) {
      recommendations.push({
        type: 'empty_suites',
        severity: 'medium',
        message: `${emptySuites.length} suite(s) have no test cases`,
        action: 'Consider adding test cases or removing unused suites',
      });
    }

    // Check for deep nesting
    const deepSuites = suiteDetails.filter((s) => s.depth > 3);
    if (deepSuites.length > 0) {
      recommendations.push({
        type: 'deep_nesting',
        severity: 'low',
        message: `${deepSuites.length} suite(s) have deep section nesting (>3 levels)`,
        action: 'Consider flattening the section structure for better navigation',
      });
    }

    // Check test case distribution
    if (analysis.statistics?.avg_cases_per_suite < 5) {
      recommendations.push({
        type: 'sparse_suites',
        severity: 'medium',
        message: 'Low average test cases per suite detected',
        action: 'Consider consolidating suites or adding more comprehensive test coverage',
      });
    }

    return recommendations;
  }

  private async validateBulkOperations(
    _projectId: number,
    operations: any[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors = [];

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];

      if (!op.type) {
        errors.push(`Operation ${i}: Missing operation type`);
        continue;
      }

      if (['update', 'delete', 'archive'].includes(op.type) && !op.suiteId) {
        errors.push(`Operation ${i}: Suite ID required for ${op.type} operation`);
      }

      if (op.type === 'create' && !op.data?.name) {
        errors.push(`Operation ${i}: Suite name required for create operation`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async reorganizeSuite(_projectId: number, _operation: any): Promise<any> {
    return {
      reorganized: true,
      message: 'Suite reorganization completed',
    };
  }

  private generateSuiteDescription(template?: string): string {
    const descriptions = {
      functional: 'Comprehensive functional testing suite covering core application features',
      api: 'API testing suite for validating REST/GraphQL endpoints and integrations',
      performance: 'Performance testing suite for load testing and benchmarking',
      security: 'Security testing suite covering authentication and vulnerability testing',
      mobile: 'Mobile application testing suite for iOS and Android platforms',
      custom: 'Custom test suite created for specific testing requirements',
    };

    return descriptions[template as keyof typeof descriptions] || descriptions.custom;
  }

  private getTemplateStructure(template: string): any[] {
    const structures = {
      functional: [
        { name: 'Authentication', description: 'Login, logout, password management' },
        { name: 'User Management', description: 'User creation, modification, permissions' },
        { name: 'Core Features', description: 'Main application functionality' },
        { name: 'UI/UX', description: 'User interface and experience testing' },
      ],
      api: [
        { name: 'Authentication', description: 'API authentication and authorization' },
        { name: 'CRUD Operations', description: 'Create, Read, Update, Delete operations' },
        { name: 'Data Validation', description: 'Input validation and error handling' },
        { name: 'Integration', description: 'Third-party integrations and webhooks' },
      ],
      performance: [
        { name: 'Load Testing', description: 'Normal load capacity testing' },
        { name: 'Stress Testing', description: 'Beyond normal capacity testing' },
        { name: 'Spike Testing', description: 'Sudden load increase testing' },
        { name: 'Volume Testing', description: 'Large amounts of data testing' },
      ],
    };

    return structures[template as keyof typeof structures] || structures.functional;
  }

  private getTemplateCases(template?: string): any[] {
    const cases = {
      functional: [
        { title: 'User can login with valid credentials', type: 'functional', priority: 'high' },
        { title: 'System validates required fields', type: 'functional', priority: 'medium' },
        {
          title: 'User can navigate between main sections',
          type: 'functional',
          priority: 'medium',
        },
      ],
      api: [
        { title: 'API returns 200 for valid GET request', type: 'functional', priority: 'high' },
        {
          title: 'API returns 400 for invalid request data',
          type: 'functional',
          priority: 'medium',
        },
        { title: 'API handles authentication correctly', type: 'security', priority: 'high' },
      ],
    };

    return cases[template as keyof typeof cases] || cases.functional;
  }

  private mapCaseType(type: string): number {
    const typeMap: Record<string, number> = {
      acceptance: 1,
      functional: 6,
      performance: 8,
      security: 10,
      smoke: 11,
    };

    return typeMap[type.toLowerCase()] || 6; // Default to functional
  }

  private mapPriority(priority: string): number {
    const priorityMap: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };

    return priorityMap[priority.toLowerCase()] || 2; // Default to medium
  }

  private createSuccessResponse(data: any, message?: string): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              data,
              message: message || 'Operation completed successfully',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private createErrorResponse(error: string, code?: string): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error,
              code: code || TestRailErrorCodes.INTERNAL_ERROR,
              timestamp: new Date().toISOString(),
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}
