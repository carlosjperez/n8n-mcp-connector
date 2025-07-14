# N8N MCP Connector v2.0.0

Advanced Model Context Protocol server for complete n8n workflow automation and programmatic management. Now with full node and connection management capabilities!

[![CI/CD](https://github.com/carlosjperez/n8n-mcp-connector/actions/workflows/ci.yml/badge.svg)](https://github.com/carlosjperez/n8n-mcp-connector/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

## 🚀 Quick Start

### Prerequisites
- Active n8n instance
- API access configured in n8n
- Claude Desktop installed

### 📦 Instalación Remota (Recomendado)

#### Opción A: NPM Global
```bash
# Instalación automática
curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-remote.sh | bash
# Selecciona opción 1 (NPM Global)
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

#### 📦 Configuración NPM Global (Sin instalación local)

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

## 📋 Available Operations

### Workflow Management
- `execute_workflow` - Execute workflows with custom data
- `list_workflows` - List and filter available workflows
- `get_workflow` - Get detailed workflow information
- `activate_workflow` - Enable/disable workflows

### Execution Monitoring
- `get_execution_status` - Check execution progress
- `list_executions` - View recent execution history

### Integration Features
- `create_webhook` - Generate webhook URLs for automation

## 🛠 Development

```bash
# Development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 🔧 Configuration

### Performance Tuning
```bash
N8N_TIMEOUT=30000      # Request timeout (ms)
N8N_RETRIES=3          # Retry attempts
N8N_RETRY_DELAY=1000   # Delay between retries (ms)
```

### Debug Mode
```bash
DEBUG=n8n-connector:* npm start
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
