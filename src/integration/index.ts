/**
 * TestRail-AutoSpectra Integration Module
 * 
 * This module provides seamless integration between AutoSpectra framework
 * and TestRail test management platform through the MCP server.
 */

// Core bridge functionality
export { AutoSpectraBridge } from './autospectra-bridge';
export type {
  AutoSpectraTestResult,
  AutoSpectraTestSuite
} from './autospectra-bridge';

// Integration examples and utilities
export {
  basicIntegrationExample,
  CIPipelineIntegration,
  RealTimeMonitor,
  generateAdvancedDashboard,
  IntegrationUtils,
  DEFAULT_CONFIG
} from './integration-examples';

// Re-export types for convenience
export type {
  AutoSpectraTestResult as TestResult,
  AutoSpectraTestSuite as TestSuite
} from './autospectra-bridge';