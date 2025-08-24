/**
 * Jest Test Setup for TestRail MCP Server
 * Configures test environment and mocks
 */

import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during testing
process.env.TESTRAIL_BASE_URL = 'https://test.testrail.io';
process.env.TESTRAIL_USERNAME = 'test@example.com';
process.env.TESTRAIL_API_KEY = 'test-api-key';

// Global test timeout
jest.setTimeout(30000);

// Mock axios for API calls
jest.mock('axios', () => ({
  create: jest.fn(() => ({
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
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock console methods to reduce noise during testing
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup global test helpers
global.testHelpers = {
  // Create mock TestRail entities
  createMockProject: (overrides = {}) => ({
    id: 1,
    name: 'Test Project',
    is_completed: false,
    suite_mode: 1,
    url: 'https://test.testrail.io/projects/1',
    ...overrides
  }),

  createMockSuite: (overrides = {}) => ({
    id: 1,
    name: 'Test Suite',
    description: 'Test suite description',
    project_id: 1,
    is_master: true,
    is_baseline: false,
    is_completed: false,
    url: 'https://test.testrail.io/suites/1',
    ...overrides
  }),

  createMockCase: (overrides = {}) => ({
    id: 1,
    title: 'Test Case Title',
    section_id: 1,
    template_id: 1,
    type_id: 6,
    priority_id: 2,
    suite_id: 1,
    created_by: 1,
    created_on: 1609459200,
    updated_by: 1,
    updated_on: 1609459200,
    ...overrides
  }),

  createMockRun: (overrides = {}) => ({
    id: 1,
    name: 'Test Run',
    description: 'Test run description',
    project_id: 1,
    suite_id: 1,
    is_completed: false,
    include_all: true,
    passed_count: 0,
    blocked_count: 0,
    untested_count: 5,
    retest_count: 0,
    failed_count: 0,
    created_on: 1609459200,
    created_by: 1,
    url: 'https://test.testrail.io/runs/1',
    ...overrides
  }),

  createMockTest: (overrides = {}) => ({
    id: 1,
    case_id: 1,
    status_id: 3,
    run_id: 1,
    title: 'Test Case Title',
    template_id: 1,
    type_id: 6,
    priority_id: 2,
    ...overrides
  }),

  createMockResult: (overrides = {}) => ({
    id: 1,
    test_id: 1,
    status_id: 1,
    created_by: 1,
    created_on: 1609459200,
    comment: 'Test passed',
    version: '1.0.0',
    elapsed: '1m 30s',
    ...overrides
  }),

  createMockUser: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    is_active: true,
    role_id: 1,
    role: 'Admin',
    ...overrides
  }),

  // Create mock MCP responses
  createSuccessResponse: (data, message = 'Success') => ({
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        data,
        message
      }, null, 2)
    }]
  }),

  createErrorResponse: (error, code = 'INTERNAL_ERROR') => ({
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error,
        code,
        timestamp: new Date().toISOString()
      }, null, 2)
    }],
    isError: true
  }),

  // Async test helper
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});