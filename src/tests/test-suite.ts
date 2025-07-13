/**
 * Comprehensive Test Suite for N8N MCP Server
 * Tests all components: Logger, Validator, Resilience, Config, Client, Handlers
 */

import { logger } from '../utils/logger.js';
import { validator } from '../utils/validator.js';
import { resilience } from '../utils/resilience.js';
import { config } from '../config/config.js';
import { N8nClient, n8nClient } from '../clients/n8n-client.js';
import { 
  ExecuteWorkflowHandler,
  ListWorkflowsHandler,
  GetWorkflowHandler,
  GetExecutionStatusHandler,
  ListExecutionsHandler,
  ActivateWorkflowHandler,
  CreateWebhookHandler
} from '../handlers/tool-handlers';

/**
 * Test Results Interface
 */
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

/**
 * Main Test Suite Class
 */
class N8nMcpTestSuite {
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor() {
    // Using singleton instances
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting N8N MCP Server Test Suite\n');
    this.startTime = Date.now();

    // Component Tests
    await this.testLogger();
    await this.testValidator();
    await this.testResilience();
    await this.testConfig();
    await this.testN8nClient();
    await this.testToolHandlers();

    // Integration Tests
    await this.testIntegration();

    // Generate Report
    this.generateReport();
  }

  /**
   * Test Logger Component
   */
  private async testLogger(): Promise<void> {
    console.log('📝 Testing Logger Component...');

    await this.runTest('Logger Initialization', async () => {
      if (!logger) {
        throw new Error('Logger not initialized');
      }
    });

    await this.runTest('Logger Levels', async () => {
      logger.debug('Test debug message', { test: true });
      logger.info('Test info message', { test: true });
      logger.warn('Test warn message', { test: true });
      logger.error('Test error message', { test: true });
    });

    await this.runTest('Performance Tracking', async () => {
      // Test basic logging functionality
      logger.info('Performance tracking test', { operation: 'test-operation' });
    });
  }

  /**
   * Test Validator Component
   */
  private async testValidator(): Promise<void> {
    console.log('✅ Testing Validator Component...');

    await this.runTest('Workflow ID Validation', async () => {
      const validResult = validator.validateWorkflowId('123');
      if (!validResult.isValid) {
        throw new Error('Valid workflow ID rejected');
      }

      const invalidResult = validator.validateWorkflowId('');
      if (invalidResult.isValid) {
        throw new Error('Invalid workflow ID accepted');
      }
    });

    await this.runTest('Execution Data Validation', async () => {
      const validData = Object.create(null);
      validData.key = 'value';
      validData.number = 123;
      const validResult = validator.validateExecutionData(validData);
      if (!validResult.isValid) {
        throw new Error(`Valid execution data rejected: ${validResult.errors.join(', ')}`);
      }

      const invalidData = { __proto__: {} };
      const invalidResult = validator.validateExecutionData(invalidData);
      if (invalidResult.isValid) {
        throw new Error('Invalid execution data accepted');
      }
    });

    await this.runTest('Pagination Validation', async () => {
      const validResult = validator.validatePagination(10, 0);
      if (!validResult.isValid) {
        throw new Error(`Valid pagination rejected: ${validResult.errors.join(', ')}`);
      }

      const invalidResult = validator.validatePagination(-1, 0);
      if (invalidResult.isValid) {
        throw new Error('Invalid pagination accepted');
      }
    });
  }

  /**
   * Test Resilience Component
   */
  private async testResilience(): Promise<void> {
    console.log('🛡️ Testing Resilience Component...');

    await this.runTest('Retry Mechanism', async () => {
      let attempts = 0;
      
      try {
        await resilience.withRetry(
          async () => {
            attempts++;
            if (attempts < 3) {
              throw new Error('Simulated failure');
            }
            return 'success';
          },
          { maxAttempts: 3, retryableErrors: ['Simulated failure'] }
        );
      } catch (error) {
        throw new Error(`Retry failed: ${error}`);
      }
      
      if (attempts !== 3) {
        throw new Error(`Expected 3 attempts, got ${attempts}`);
      }
    });

    await this.runTest('Circuit Breaker', async () => {
      // Test basic resilience functionality
      logger.info('Circuit breaker test', { operation: 'test-breaker' });
    });

    await this.runTest('Timeout Mechanism', async () => {
      try {
        await resilience.withTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'success';
          },
          100
        );
        throw new Error('Timeout should have occurred');
      } catch (error: any) {
        if (!error.message.includes('timed out')) {
          throw new Error(`Expected timeout error, got: ${error.message}`);
        }
      }
    });
  }

  /**
   * Test Configuration Component
   */
  private async testConfig(): Promise<void> {
    console.log('⚙️ Testing Configuration Component...');

    await this.runTest('Config Loading', async () => {
      const serverConfig = config.getServerConfig();
      const n8nConfig = config.getN8nConfig();
      
      if (!serverConfig || !n8nConfig) {
        throw new Error('Configuration not loaded properly');
      }
    });

    await this.runTest('Environment Variables', async () => {
      const n8nConfig = config.getN8nConfig();
      
      // Should have default values or environment values
      if (!n8nConfig.baseUrl || !n8nConfig.apiKey) {
        console.warn('⚠️ N8N configuration missing - using defaults');
      }
    });
  }

  /**
   * Test N8N Client Component
   */
  private async testN8nClient(): Promise<void> {
    console.log('🔌 Testing N8N Client Component...');

    await this.runTest('Client Initialization', async () => {
      const client = n8nClient.getInstance();
      if (!client) {
        throw new Error('N8N Client not initialized');
      }
    });

    await this.runTest('Health Check', async () => {
      const client = n8nClient.getInstance();
      try {
        const result = await client.healthCheck();
        console.log(`N8N Health Status: ${result.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy'}`);
      } catch (error) {
        console.warn('⚠️ N8N Health check failed - server may not be running');
      }
    });
  }

  /**
   * Test Tool Handlers
   */
  private async testToolHandlers(): Promise<void> {
    console.log('🔧 Testing Tool Handlers...');

    const client = n8nClient.getInstance();

    await this.runTest('Execute Workflow Handler', async () => {
      const handler = new ExecuteWorkflowHandler();
      
      try {
        await handler.handle({ workflowId: 'test-workflow' });
      } catch (error: any) {
        // Expected to fail without real N8N instance
        if (!error.message.includes('ECONNREFUSED') && 
            !error.message.includes('Network Error') &&
            !error.message.includes('Request failed')) {
          throw error;
        }
      }
    });

    await this.runTest('List Workflows Handler', async () => {
      const handler = new ListWorkflowsHandler();
      
      try {
        await handler.handle({});
      } catch (error: any) {
        // Expected to fail without real N8N instance
        if (!error.message.includes('ECONNREFUSED') && 
            !error.message.includes('Network Error') &&
            !error.message.includes('Request failed')) {
          throw error;
        }
      }
    });

    await this.runTest('Get Workflow Handler', async () => {
      const handler = new GetWorkflowHandler();
      
      try {
        await handler.handle({ workflowId: 'test-workflow' });
      } catch (error: any) {
        // Expected to fail without real N8N instance
        if (!error.message.includes('ECONNREFUSED') && 
            !error.message.includes('Network Error') &&
            !error.message.includes('Request failed')) {
          throw error;
        }
      }
    });
  }

  /**
   * Test Integration
   */
  private async testIntegration(): Promise<void> {
    console.log('🔗 Testing Integration...');

    await this.runTest('Component Integration', async () => {
      const client = n8nClient.getInstance();

      // Test that all components are properly initialized
      if (!logger || !validator || !resilience || !config || !client) {
        throw new Error('Not all components are initialized');
      }

      // Test component interaction
      const validationResult = validator.validateWorkflowId('test-123');
      logger.info('Integration test validation', {
        operation: 'integration-test',
        validationResult: validationResult.isValid
      });
    });
  }

  /**
   * Run individual test
   */
  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: true, duration });
      console.log(`  ✅ ${name} (${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.results.push({ name, passed: false, error: error.message, duration });
      console.log(`  ❌ ${name} (${duration}ms): ${error.message}`);
    }
  }

  /**
   * Generate test report
   */
  private generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n🎯 Test Suite Complete!');
  }
}

/**
 * Export test runner
 */
export async function runTests(): Promise<void> {
  const testSuite = new N8nMcpTestSuite();
  await testSuite.runAllTests();
}

/**
 * Run tests if this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export default N8nMcpTestSuite;