# 🤖 N8N MCP Connector - Configuración para Agentes de IA

## 🎯 Instalación Rápida

### Cursor (VS Code AI)
```bash
# Instalación automática
curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash

# O manual: Copia configs/cursor-config.json a ~/.cursor/mcp/config.json
```

### Claude Desktop
```bash
# NPM Global (Recomendado)
curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-remote.sh | bash

# O copia configs/claude-desktop-npm.json a ~/Library/Application Support/Claude/claude_desktop_config.json
```

### Continue.dev
```bash
# Configuración automática
curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 2 1

# O copia configs/continue-config.json a ~/.continue/config.json
```

### Codeium
```bash
# Instalación automática
curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 3 1
```

### Universal (Cualquier agente)
```bash
npm install -g n8n-mcp-connector
```

## ⚙️ Configuración de Credenciales

### Variables de Entorno Requeridas
```bash
export N8N_BASE_URL="https://tu-instancia-n8n.com"
export N8N_API_KEY="tu_api_key_de_n8n"
```

### Alternativa con Usuario/Contraseña
```bash
export N8N_BASE_URL="https://tu-instancia-n8n.com"
export N8N_USERNAME="tu_usuario"
export N8N_PASSWORD="tu_contraseña"
```

## 🛠 Herramientas Disponibles

### 1. `execute_workflow`
Ejecuta un workflow con datos personalizados

**Ejemplo en Cursor:**
```
@n8n ejecuta el workflow "email-automation" con los datos:
{
  "email": "usuario@ejemplo.com",
  "nombre": "Juan Pérez",
  "producto": "Curso de IA"
}
```

### 2. `list_workflows`
Lista todos los workflows disponibles

**Ejemplo en Claude:**
```
Muéstrame todos los workflows de n8n disponibles
```

### 3. `get_workflow`
Obtiene detalles específicos de un workflow

**Ejemplo en Continue.dev:**
```
/n8n obtener detalles del workflow "data-processing"
```

### 4. `get_execution_status`
Monitorea el estado de una ejecución

**Ejemplo:**
```
Verifica el estado de la ejecución ID: abc123
```

### 5. `list_executions`
Ve el historial de ejecuciones

**Ejemplo:**
```
Muestra las últimas 10 ejecuciones del workflow "backup-system"
```

### 6. `activate_workflow`
Activa o desactiva workflows

**Ejemplo:**
```
Activa el workflow "monitoring-alerts"
```

### 7. `create_webhook`
Crea URLs de webhook para integraciones

**Ejemplo:**
```
Crea un webhook para el workflow "contact-form" con método POST
```

## 🎮 Ejemplos de Uso Prácticos

### Automatización de Email Marketing
```
@n8n ejecuta "email-campaign" con:
{
  "lista": "clientes-premium",
  "template": "oferta-especial",
  "descuento": 20
}
```

### Procesamiento de Datos
```
Ejecuta el workflow "data-etl" para procesar el archivo CSV de ventas de hoy
```

### Monitoreo de Sistema
```
Activa el workflow "health-check" y muestra el estado de las últimas 5 ejecuciones
```

### Integración con APIs
```
Crea un webhook para "api-integration" que reciba datos de Shopify
```

## 🔧 Configuraciones Específicas por Agente

### Cursor - Configuración Avanzada
```json
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "npx",
      "args": ["n8n-mcp-connector@latest"],
      "env": {
        "N8N_BASE_URL": "https://tu-n8n.com",
        "N8N_API_KEY": "tu_key",
        "LOG_LEVEL": "debug",
        "MAX_CONCURRENT_REQUESTS": "5"
      }
    }
  }
}
```

### Continue.dev - Comandos Personalizados
```json
{
  "customCommands": [
    {
      "name": "n8n-deploy",
      "prompt": "Ejecuta el workflow de deployment con la rama {branch}",
      "description": "Despliega código usando n8n"
    }
  ]
}
```

### Claude Desktop - Configuración Completa
```json
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "npx",
      "args": ["n8n-mcp-connector"],
      "env": {
        "N8N_BASE_URL": "https://n8n.tudominio.com",
        "N8N_API_KEY": "n8n_api_key_aqui",
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🐳 Docker para Desarrollo

### Ejecutar con Docker
```bash
docker run -d \
  --name n8n-mcp \
  -e N8N_BASE_URL=https://tu-n8n.com \
  -e N8N_API_KEY=tu_key \
  -p 3000:3000 \
  nazcamedia/n8n-mcp-connector
```

### Docker Compose
```yaml
version: '3.8'
services:
  n8n-mcp:
    image: nazcamedia/n8n-mcp-connector
    environment:
      - N8N_BASE_URL=https://tu-n8n.com
      - N8N_API_KEY=tu_key
      - LOG_LEVEL=info
    ports:
      - "3000:3000"
    restart: unless-stopped
```

## 🔍 Troubleshooting

### Problemas Comunes

#### Error de Conexión
```bash
# Verifica la URL y credenciales
echo $N8N_BASE_URL
echo $N8N_API_KEY

# Prueba la conexión
curl -H "X-N8N-API-KEY: $N8N_API_KEY" $N8N_BASE_URL/api/v1/workflows
```

#### Agente No Reconoce las Herramientas
1. Verifica que el archivo de configuración esté en la ubicación correcta
2. Reinicia tu agente de IA
3. Revisa los logs del conector

#### Timeouts en Ejecuciones
```bash
# Aumenta el timeout
export REQUEST_TIMEOUT=60000
```

### Logs y Debug
```bash
# Habilita logs detallados
export LOG_LEVEL=debug
export ENABLE_CONSOLE_OUTPUT=true

# Ejecuta con logs
npx n8n-mcp-connector
```

## 📚 Recursos Adicionales

- **Documentación Completa:** [README.md](./README.md)
- **Guía de Deployment:** [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
- **Instalación Remota:** [REMOTE-USAGE.md](./REMOTE-USAGE.md)
- **Changelog:** [CHANGELOG.md](./CHANGELOG.md)
- **Issues:** [GitHub Issues](https://github.com/carlosjperez/n8n-mcp-connector/issues)

## 🤝 Contribuir

¿Usas un agente de IA que no está listado? ¡Contribuye con la configuración!

1. Fork el repositorio
2. Añade la configuración en `configs/`
3. Actualiza este README
4. Envía un Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](./LICENSE) para más detalles.

---

**¿Necesitas ayuda?** Abre un [issue](https://github.com/carlosjperez/n8n-mcp-connector/issues) o consulta la [documentación completa](./README.md).