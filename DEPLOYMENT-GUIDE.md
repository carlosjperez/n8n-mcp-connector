# 🚀 Guía de Despliegue - N8N MCP Connector

## Opciones de Alojamiento Remoto

### 1. 📦 Publicación en NPM (Recomendado)

#### Preparación del Paquete

```bash
# 1. Actualizar package.json para publicación
npm version patch  # o minor/major según cambios

# 2. Crear cuenta en npmjs.com si no tienes
npm adduser

# 3. Publicar el paquete
npm publish
```

#### Configuración de Claude Desktop para NPM

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

### 2. ☁️ Alojamiento en MCP.so

#### Configuración para mcp.so

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

### 3. 🐳 Docker Container (Alternativa)

#### Dockerfile optimizado

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### Docker Compose para desarrollo

```yaml
version: '3.8'
services:
  n8n-mcp:
    build: .
    environment:
      - N8N_BASE_URL=${N8N_BASE_URL}
      - N8N_API_KEY=${N8N_API_KEY}
    ports:
      - "3000:3000"
```

## 🔧 Configuración de Variables de Entorno

### Para Instancia N8N Remota

```bash
# .env para producción
N8N_BASE_URL=https://tu-instancia-n8n.com
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxx
N8N_TIMEOUT=30000
N8N_RETRIES=3
```

### Para N8N Cloud

```bash
N8N_BASE_URL=https://app.n8n.cloud
N8N_API_KEY=tu_cloud_api_key
```

## 📋 Pasos de Implementación

### Opción A: NPM Global (Más Simple)

1. **Publicar en NPM:**
   ```bash
   npm run build
   npm publish
   ```

2. **Configurar Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "n8n-workflows": {
         "command": "npx",
         "args": ["n8n-mcp-connector"],
         "env": {
           "N8N_BASE_URL": "https://tu-n8n.com",
           "N8N_API_KEY": "tu_api_key"
         }
       }
     }
   }
   ```

3. **Usar desde cualquier máquina:**
   - No necesitas clonar el repo
   - Se descarga automáticamente desde NPM
   - Siempre la última versión

### Opción B: Servicio en la Nube

1. **Deploy en Railway/Render/Heroku:**
   ```bash
   # Configurar variables de entorno en el servicio
   N8N_BASE_URL=https://tu-n8n.com
   N8N_API_KEY=tu_api_key
   PORT=3000
   ```

2. **Configurar Claude Desktop:**
   ```json
   {
     "mcpServers": {
       "n8n-workflows": {
         "command": "curl",
         "args": ["-s", "https://tu-servicio.railway.app/mcp"],
         "env": {}
       }
     }
   }
   ```

## 🔒 Consideraciones de Seguridad

### Variables de Entorno Seguras

```bash
# Nunca hardcodear credenciales
# Usar variables de entorno o servicios de secretos
N8N_API_KEY=${N8N_API_KEY}
N8N_BASE_URL=${N8N_BASE_URL}
```

### Autenticación Robusta

```typescript
// Validación de credenciales
if (!process.env.N8N_API_KEY && !process.env.N8N_USERNAME) {
  throw new Error('Credenciales de N8N requeridas');
}
```

## 📊 Monitoreo y Logs

### Logging Estructurado

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'MCP Server iniciado',
  service: 'n8n-mcp-connector'
}));
```

### Health Check Endpoint

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

## 🚀 Ventajas de Cada Opción

| Método | Ventajas | Desventajas |
|--------|----------|-------------|
| **NPM Global** | ✅ Fácil instalación<br>✅ Actualizaciones automáticas<br>✅ No requiere servidor | ❌ Ejecuta localmente<br>❌ Requiere Node.js |
| **MCP.so** | ✅ Totalmente remoto<br>✅ Sin instalación local<br>✅ Gestión centralizada | ❌ Dependes del servicio<br>❌ Menos control |
| **Docker/Cloud** | ✅ Control total<br>✅ Escalable<br>✅ Monitoreo avanzado | ❌ Más complejo<br>❌ Costos de hosting |

## 📝 Próximos Pasos Recomendados

1. **Inmediato:** Publicar en NPM para uso global
2. **Corto plazo:** Configurar en mcp.so para máxima simplicidad
3. **Largo plazo:** Deploy en cloud para producción enterprise

---

**Recomendación:** Comenzar con NPM global para desarrollo y mcp.so para producción.