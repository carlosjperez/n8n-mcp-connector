#!/usr/bin/env node
/**
 * Test Runner for N8N MCP Server
 * Executes the complete test suite and handles environment setup
 */

import { runTests } from './test-suite';
import { Logger } from '../utils/logger';

/**
 * Setup test environment
 */
function setupTestEnvironment(): void {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'debug';
  
  // Set default test values if not provided
  if (!process.env.N8N_BASE_URL) {
    process.env.N8N_BASE_URL = 'http://localhost:5678';
  }
  
  if (!process.env.N8N_API_KEY) {
    process.env.N8N_API_KEY = 'test-api-key';
  }
  
  if (!process.env.MCP_SERVER_NAME) {
    process.env.MCP_SERVER_NAME = 'n8n-test-server';
  }
}

/**
 * Main test execution function
 */
async function main(): Promise<void> {
  console.log('🧪 N8N MCP Server Test Runner');
  console.log('==============================\n');
  
  try {
    // Setup environment
    setupTestEnvironment();
    
    // Initialize logger for tests
    const logger = Logger.getInstance();
    logger.info('Test environment initialized', {
      nodeEnv: process.env.NODE_ENV,
      n8nBaseUrl: process.env.N8N_BASE_URL,
      logLevel: process.env.LOG_LEVEL
    });
    
    // Run tests
    await runTests();
    
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️ Test execution interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Test execution terminated');
  process.exit(1);
});

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runTestRunner };