# N8N MCP Connector v2.0.0

A high-performance Model Context Protocol (MCP) server that provides seamless integration with N8N automation platform. This connector enables AI assistants and other MCP clients to interact with N8N workflows, executions, and automation capabilities with enterprise-grade reliability and performance.

## ✨ Features

### Core Capabilities
- **Workflow Management**: Execute, list, and manage N8N workflows with advanced filtering
- **Execution Monitoring**: Real-time tracking of workflow execution status and results
- **Advanced Operations**: Create nodes, manage connections, and configure webhooks
- **Node Management**: Full CRUD operations for individual workflow nodes

### Performance & Reliability
- **Intelligent Caching**: Multi-tier caching system with TTL and LRU eviction
- **Connection Pooling**: Optimized HTTP connections for better performance
- **Circuit Breaker**: Resilience patterns for external API failures
- **Metrics & Monitoring**: Comprehensive performance tracking and health checks
- **Rate Limiting**: Built-in protection against API abuse

### Developer Experience
- **Type Safety**: Full TypeScript implementation with strict typing
- **Modular Architecture**: Clean, maintainable, and extensible codebase
- **Comprehensive Testing**: Unit, integration, and E2E test coverage
- **Rich Documentation**: Detailed guides and API documentation
- **Configuration Management**: Centralized, validated configuration system

[![CI/CD](https://github.com/carlosjperez/n8n-mcp-connector/actions/workflows/ci.yml/badge.svg)](https://github.com/carlosjperez/n8n-mcp-connector/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## 🚀 Quick Start

### Prerequisites
- Active n8n instance
- API access configured in n8n
- Claude Desktop installed

### 📦 Instalación Remota (Recomendado)

Nuestros scripts de instalación ahora detectan automáticamente el mejor ejecutor de paquetes (`uvx`, `npx`, `npm`) disponible en tu sistema para una experiencia más fluida y un rendimiento óptimo.

Puedes anular el ejecutor detectado configurando la variable de entorno `RUNNER`. Por ejemplo: `RUNNER=npm ./install-remote.sh`.

#### Opción A: Ejecución Remota con Runner Dinámico
```bash
# Instalación automática
curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-remote.sh | bash
# Selecciona la opción 1
```

#### Opción B: MCP.so
```bash
# Instalación automática
curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-remote.sh | bash
# Selecciona opción 2 (MCP.so)
```

### 🔧 Instalación Local (Desarrollo)

```bash
# Clone repository
git clone https://github.com/carlosjperez/n8n-mcp-connector.git
cd n8n-mcp-connector

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your n8n credentials

# Build and start
npm run build
npm start
```

### Environment Configuration

```bash
# Required: n8n instance URL
N8N_BASE_URL=http://localhost:5678

# Option 1: API Key authentication (recommended)
N8N_API_KEY=your_api_key_here

# Option 2: Username/Password authentication
N8N_USERNAME=your_username
N8N_PASSWORD=your_password
```

### Claude Desktop Integration

**Nota:** Los scripts de instalación se encargan de esto automáticamente. La siguiente configuración es un ejemplo. El campo `command` será rellenado por el script de instalación con el ejecutor de paquetes detectado (`uvx`, `npx`, o `npm`).

#### 📦 Configuración de Ejecución Remota (Ejemplo)

```json
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "npx",
      "args": ["n8n-mcp-connector"],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

#### ☁️ Configuración MCP.so (Totalmente remoto)

```json
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "mcp",
      "args": ["install", "n8n-workflows/carlosjperez"],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

#### 🔧 Configuración Local (Desarrollo)

```json
{
  "mcpServers": {
    "n8n-automation": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/absolute/path/to/n8n-mcp-connector",
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 🛠️ Available Tools

The MCP server provides comprehensive tools for N8N automation:

### Core Workflow Tools

- `execute_workflow`: Execute workflows with advanced options and monitoring
- `list_workflows`: List workflows with filtering, pagination, and caching
- `get_workflow`: Get detailed workflow information with intelligent caching
- `get_execution_status`: Real-time execution status with performance metrics
- `list_executions`: List executions with filtering and statistics
- `activate_workflow`: Activate/deactivate workflows with validation
- `create_webhook`: Create webhook endpoints with security options

### Advanced Node Management

- `create_node`: Create new nodes with validation and type checking
- `update_node`: Update existing nodes with conflict detection
- `delete_node`: Safely remove nodes with dependency checking
- `create_connection`: Create connections with validation
- `delete_connection`: Remove connections with impact analysis

### Monitoring & Diagnostics

- Built-in health checks and status monitoring
- Performance metrics and cache statistics
- Error tracking and debugging tools
- Connection pool and resource monitoring

## 🧪 Testing

Comprehensive testing strategy with multiple test types:

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Performance testing
npm run test:performance
```

## 🔧 Development

```bash
# Start development server with hot reload
npm run dev

# Development with debug logging
DEBUG=n8n-mcp:* npm run dev

# Code quality
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # TypeScript

# Build optimization
npm run build:analyze    # Bundle analysis
npm run build:production # Optimized build
```

## 🏗️ Architecture

The connector follows a modern, scalable architecture with performance optimizations:

```
src/
├── config/           # Centralized configuration management
│   └── index.ts      # Validated configuration with defaults
├── clients/          # External service clients
│   └── n8n-client.ts # N8N API client with caching & pooling
├── handlers/         # MCP tool handlers
│   ├── tool-handlers.ts
│   └── advanced-tool-handlers.ts
├── utils/            # Utility modules
│   ├── cache.ts      # Intelligent caching system
│   ├── metrics.ts    # Metrics and monitoring
│   ├── logger.ts     # Structured logging
│   ├── validator.ts  # Input validation
│   └── resilience.ts # Circuit breaker & retry logic
└── index.ts          # Main server with monitoring
```

### Key Design Patterns

- **Singleton Pattern**: Configuration and client instances
- **Factory Pattern**: Tool handler creation
- **Observer Pattern**: Event-driven metrics collection
- **Circuit Breaker**: Resilience for external API calls
- **Cache-Aside**: Intelligent caching with TTL and LRU eviction

### Performance Features

- **Multi-tier Caching**: Different TTL for different data types
- **Connection Pooling**: Optimized HTTP connections
- **Request Batching**: Efficient API usage
- **Lazy Loading**: On-demand resource initialization
- **Memory Management**: Automatic cleanup and optimization

## 📊 Performance Metrics

### Expected Performance

- **Request Latency**: < 100ms (cached), < 500ms (uncached)
- **Throughput**: > 1000 requests/minute
- **Cache Hit Ratio**: > 80% for repeated requests
- **Memory Usage**: < 512MB under normal load
- **Uptime**: > 99.9% availability

### Monitoring

```bash
# Health check
curl http://localhost:3000/health

# Detailed metrics
curl http://localhost:3000/metrics

# Cache statistics
curl http://localhost:3000/health/detailed
```

## 📚 Documentation

- [Technical Guide](TECHNICAL_GUIDE.md) - Comprehensive development guide
- [Architecture Documentation](ARCHITECTURE.md) - System architecture details
- [API Reference](API.md) - Complete API documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions

## ⚙️ Configuration

The connector uses a hierarchical configuration system with environment variables. Copy `.env.example` to `.env` and configure:

### Required Settings

- `N8N_BASE_URL`: Your N8N instance URL (e.g., `http://localhost:5678`)
- `N8N_API_KEY`: Your N8N API key (get from N8N Settings > API Keys)

### Performance Settings

```bash
# Cache Configuration
CACHE_DEFAULT_TTL=600000          # 10 minutes default TTL
CACHE_WORKFLOWS_DETAILS_TTL=600000 # Workflow details cache
CACHE_EXECUTIONS_COMPLETED_TTL=1800000 # Completed executions cache

# Connection Settings
CONNECTION_POOL_SIZE=10           # HTTP connection pool size
REQUEST_TIMEOUT=30000             # Request timeout
CIRCUIT_BREAKER_THRESHOLD=5       # Circuit breaker threshold

# Monitoring
MONITORING_ENABLED=true           # Enable metrics collection
METRICS_INTERVAL=30000            # Metrics collection interval
```

### Environment-Specific Settings

```bash
# Development
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=n8n-mcp:*

# Production
NODE_ENV=production
LOG_LEVEL=warn
MONITORING_ENABLED=true
```

## 🔒 Security

- Environment-based credential management
- Input validation and sanitization
- Rate limiting and timeout protection
- Error isolation without information leakage

## 📚 Usage Examples

### Basic Workflow Execution
```
Ask Claude: "Execute the data-processing workflow with customer ID 12345"
```

### Monitoring Active Workflows
```
Ask Claude: "Show me all running workflows and their current status"
```

### Webhook Creation
```
Ask Claude: "Create a webhook for the order-processing workflow"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤖 Sistema de Automatización

**¡NUEVO!** Sistema automatizado de gestión de errores CI/CD con integración Linear:

- ✅ **Detección automática** de fallos en CI/CD
- 🎯 **Asignación inteligente** de agentes especializados  
- 📊 **Sincronización** GitHub ↔ Linear
- 📈 **Métricas** y seguimiento automatizado

### 🚀 Configuración Rápida
```bash
# Configuración automática del sistema
./setup-automation-system.sh

# Verificar funcionamiento
./verify-automation-system.sh
```

📖 **Documentación completa**: [README-AUTOMATION.md](./README-AUTOMATION.md)

---

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/carlosjperez/n8n-mcp-connector/issues)
- 💬 [Discussions](https://github.com/carlosjperez/n8n-mcp-connector/discussions)

## 🛣 Roadmap

- [ ] Advanced workflow templates
- [ ] Bulk operations support
- [ ] Real-time monitoring dashboard
- [ ] Integration with additional automation platforms
- [ ] Enhanced error reporting and analytics
