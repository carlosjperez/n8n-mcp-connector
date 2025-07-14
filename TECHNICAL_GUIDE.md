# N8N MCP Connector - Technical Guide

## Table of Contents

1. [Development Setup](#development-setup)
2. [Architecture Overview](#architecture-overview)
3. [Configuration Management](#configuration-management)
4. [Performance Optimization](#performance-optimization)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Caching Strategy](#caching-strategy)
7. [Error Handling](#error-handling)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Guide](#deployment-guide)
10. [Contributing Guidelines](#contributing-guidelines)
11. [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- N8N instance (local or remote)
- TypeScript knowledge

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd n8n-mcp-connector

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Configure your N8N instance
# Edit .env file with your N8N_BASE_URL and N8N_API_KEY

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm test             # Run test suite
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

## Architecture Overview

### Core Components

```
src/
├── config/           # Configuration management
│   └── index.ts      # Centralized configuration
├── clients/          # External service clients
│   └── n8n-client.ts # N8N API client with caching
├── handlers/         # MCP tool handlers
│   ├── tool-handlers.ts
│   └── advanced-tool-handlers.ts
├── utils/            # Utility modules
│   ├── cache.ts      # Intelligent caching system
│   ├── metrics.ts    # Metrics and monitoring
│   ├── logger.ts     # Structured logging
│   ├── validator.ts  # Input validation
│   └── resilience.ts # Circuit breaker & retry logic
└── index.ts          # Main server entry point
```

### Design Patterns

- **Singleton Pattern**: Configuration and client instances
- **Factory Pattern**: Tool handler creation
- **Observer Pattern**: Event-driven metrics collection
- **Circuit Breaker**: Resilience for external API calls
- **Cache-Aside**: Intelligent caching with TTL

## Configuration Management

### Environment Variables

The connector uses a hierarchical configuration system:

1. **Default values** in `src/config/index.ts`
2. **Environment variables** from `.env` file
3. **Runtime overrides** (if needed)

### Configuration Sections

```typescript
// N8N Configuration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_api_key
N8N_TIMEOUT=30000

// Cache Configuration
CACHE_DEFAULT_TTL=600000
CACHE_MAX_SIZE=1000

// Performance Configuration
CONNECTION_POOL_SIZE=10
CIRCUIT_BREAKER_THRESHOLD=5

// Monitoring Configuration
MONITORING_ENABLED=true
METRICS_INTERVAL=30000
```

### Configuration Validation

All configuration is validated at startup:

- Required fields are checked
- URL formats are validated
- Numeric ranges are enforced
- Type safety is maintained

## Performance Optimization

### Caching Strategy

#### Cache Types

1. **Workflow Cache**: Stores workflow details and lists
2. **Execution Cache**: Caches execution status and results
3. **Node Cache**: Stores node configurations

#### Cache Configuration

```typescript
// Different TTL for different data types
workflows: {
  listTtl: 300000,     // 5 minutes for lists
  detailsTtl: 600000,  // 10 minutes for details
},
executions: {
  completedTtl: 1800000, // 30 minutes for completed
  runningTtl: 30000,     // 30 seconds for running
}
```

#### Cache Invalidation

- **Time-based**: Automatic TTL expiration
- **Size-based**: LRU eviction when max size reached
- **Manual**: Explicit cache clearing for updates

### Connection Pooling

```typescript
// HTTP connection pooling for N8N API
const connectionPool = {
  maxSockets: 10,
  keepAlive: true,
  timeout: 30000
};
```

### Request Optimization

- **Batch requests** where possible
- **Compression** for large responses
- **Streaming** for large data sets
- **Pagination** for list operations

## Monitoring & Metrics

### Metrics Collection

```typescript
// Available metrics
metrics.incrementCounter('requests_total', 1, { method: 'GET' });
metrics.recordHistogram('request_duration', duration, { endpoint: '/workflows' });
metrics.setGauge('active_connections', connectionCount);
```

### Health Checks

```typescript
// Health check endpoints
GET /health          # Basic health status
GET /health/detailed # Detailed health information
GET /metrics         # Prometheus-compatible metrics
```

### Performance Monitoring

- **Request latency** tracking
- **Error rate** monitoring
- **Cache hit/miss** ratios
- **Memory usage** tracking
- **Connection pool** status

## Caching Strategy

### Cache Implementation

```typescript
// Cache with TTL and LRU eviction
class IntelligentCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Map<string, number>();
  
  set(key: string, value: T, ttl?: number): void
  get(key: string): T | undefined
  delete(key: string): boolean
  clear(): void
  getStats(): CacheStats
}
```

### Cache Strategies

1. **Cache-Aside**: Application manages cache
2. **Write-Through**: Updates cache on write
3. **Write-Behind**: Asynchronous cache updates
4. **Refresh-Ahead**: Proactive cache refresh

### Cache Monitoring

```typescript
// Cache metrics
cache_hits_total
cache_misses_total
cache_size_current
cache_evictions_total
cache_memory_usage
```

## Error Handling

### Error Categories

1. **Validation Errors**: Input validation failures
2. **Network Errors**: N8N API connectivity issues
3. **Authentication Errors**: API key or permission issues
4. **Rate Limit Errors**: API rate limiting
5. **Internal Errors**: Application logic errors

### Error Response Format

```typescript
{
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow with ID 'abc123' not found",
    "details": {
      "workflowId": "abc123",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Circuit Breaker

```typescript
// Circuit breaker configuration
circuitBreaker: {
  threshold: 5,        // Failure threshold
  timeout: 60000,      // Reset timeout
  monitoringPeriod: 10000 // Monitoring window
}
```

## Testing Strategy

### Test Structure

```
tests/
├── unit/             # Unit tests
│   ├── clients/
│   ├── handlers/
│   └── utils/
├── integration/      # Integration tests
│   ├── n8n-api/
│   └── mcp-server/
├── e2e/             # End-to-end tests
└── fixtures/        # Test data
```

### Test Categories

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Component interaction testing
3. **E2E Tests**: Full workflow testing
4. **Performance Tests**: Load and stress testing
5. **Security Tests**: Vulnerability testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Deployment Guide

### Production Configuration

```bash
# Production environment variables
NODE_ENV=production
LOG_LEVEL=warn
MONITORING_ENABLED=true
CACHE_WORKFLOWS_DETAILS_TTL=1800000
CONNECTION_POOL_SIZE=20
```

### Docker Deployment

```dockerfile
# Multi-stage build for optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Health Checks

```yaml
# Docker health check
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Contributing Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Write comprehensive JSDoc comments
- Maintain test coverage above 80%

### Commit Convention

```
type(scope): description

feat(cache): add intelligent caching system
fix(client): resolve connection pool leak
docs(readme): update installation guide
test(handlers): add unit tests for workflow handlers
```

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation
6. Submit pull request

## Troubleshooting

### Common Issues

#### Connection Errors

```bash
# Check N8N connectivity
curl -H "X-N8N-API-KEY: your_key" http://localhost:5678/api/v1/workflows

# Verify environment variables
echo $N8N_BASE_URL
echo $N8N_API_KEY
```

#### Performance Issues

```bash
# Check cache statistics
GET /metrics | grep cache

# Monitor memory usage
GET /health/detailed

# Check connection pool
GET /metrics | grep connection
```

#### Authentication Issues

```bash
# Verify API key format
# Should be: n8n_api_[random_string]

# Check API key permissions in N8N
# Settings > API Keys > Permissions
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=n8n-mcp:* npm run dev

# Verbose logging
LOG_LEVEL=debug npm start

# Performance profiling
NODE_ENV=development VERBOSE=true npm run dev
```

### Log Analysis

```bash
# Filter error logs
grep "ERROR" logs/app.log

# Monitor request patterns
grep "request_duration" logs/app.log | tail -100

# Cache performance
grep "cache_" logs/app.log
```

## Performance Benchmarks

### Expected Performance

- **Request latency**: < 100ms (cached), < 500ms (uncached)
- **Throughput**: > 1000 requests/minute
- **Cache hit ratio**: > 80% for repeated requests
- **Memory usage**: < 512MB under normal load
- **CPU usage**: < 50% under normal load

### Optimization Tips

1. **Enable caching** for frequently accessed workflows
2. **Increase connection pool** size for high load
3. **Tune cache TTL** values based on usage patterns
4. **Monitor metrics** regularly for performance insights
5. **Use pagination** for large result sets

---

*For more information, see the [Architecture Documentation](ARCHITECTURE.md) and [API Reference](API.md).*