# 🚀 N8N MCP Connector - Uso Remoto

## ✅ Paquete Publicado en NPM

**Paquete:** `n8n-mcp-connector@1.0.0`  
**NPM URL:** https://www.npmjs.com/package/n8n-mcp-connector  
**Estado:** ✅ Disponible públicamente

## 🔧 Configuración Inmediata para Claude Desktop

### Opción 1: NPM Global (Sin instalación local)

```json
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "npx",
      "args": ["n8n-mcp-connector@latest"],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

### Opción 2: Instalación Global

```bash
# Instalar globalmente
npm install -g n8n-mcp-connector
```

```json
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "n8n-mcp-connector",
      "args": [],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
```

## 📋 Pasos de Configuración

### 1. Configurar Claude Desktop

**Archivo:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```bash
# Crear/editar configuración
open "~/Library/Application Support/Claude/claude_desktop_config.json"
```

### 2. Agregar Configuración

Copia una de las configuraciones anteriores y actualiza:
- `N8N_BASE_URL`: URL de tu instancia de n8n
- `N8N_API_KEY`: Tu API key de n8n

### 3. Reiniciar Claude Desktop

Cierra y abre Claude Desktop para cargar la nueva configuración.

## 🛠 Herramientas Disponibles

Una vez configurado, tendrás acceso a:

| Herramienta | Descripción |
|-------------|-------------|
| `execute_workflow` | Ejecutar workflows con datos personalizados |
| `list_workflows` | Listar todos los workflows disponibles |
| `get_workflow` | Obtener información detallada de un workflow |
| `get_execution_status` | Verificar estado de ejecución |
| `list_executions` | Ver historial de ejecuciones |
| `activate_workflow` | Activar/desactivar workflows |
| `create_webhook` | Generar URLs de webhook |

## 💡 Ejemplos de Uso

### Ejecutar un Workflow
```
"Ejecuta el workflow 'procesar-datos' con el ID de cliente 12345"
```

### Listar Workflows Activos
```
"Muéstrame todos los workflows activos"
```

### Verificar Estado de Ejecución
```
"¿Cuál es el estado de la ejecución abc123?"
```

## 🔒 Configuración de Credenciales

### Para n8n Self-hosted
```json
"env": {
  "N8N_BASE_URL": "https://tu-n8n.ejemplo.com",
  "N8N_API_KEY": "n8n_api_xxxxxxxxxxxxxxxxxx"
}
```

### Para n8n Cloud
```json
"env": {
  "N8N_BASE_URL": "https://app.n8n.cloud",
  "N8N_API_KEY": "tu_cloud_api_key"
}
```

### Autenticación Alternativa (Usuario/Contraseña)
```json
"env": {
  "N8N_BASE_URL": "https://tu-n8n.ejemplo.com",
  "N8N_USERNAME": "tu_usuario",
  "N8N_PASSWORD": "tu_contraseña"
}
```

## 🚀 Ventajas del Uso Remoto

✅ **Sin instalación local** - No necesitas clonar el repositorio  
✅ **Actualizaciones automáticas** - Siempre la última versión desde NPM  
✅ **Multiplataforma** - Funciona en cualquier sistema con Node.js  
✅ **Configuración única** - Una vez configurado, funciona siempre  
✅ **Sin mantenimiento** - No necesitas gestionar dependencias locales  

## 🔄 Actualizaciones

El paquete se actualiza automáticamente cuando uses `@latest`. Para forzar una actualización:

```bash
# Limpiar caché de npx
npx clear-npx-cache

# O usar versión específica
npx n8n-mcp-connector@1.0.0
```

## 🆘 Solución de Problemas

### Error: "Command not found"
- Asegúrate de tener Node.js instalado
- Verifica que npx esté disponible: `npx --version`

### Error: "N8N authentication required"
- Verifica que `N8N_BASE_URL` sea correcta
- Confirma que `N8N_API_KEY` sea válida
- Asegúrate de que n8n esté accesible desde tu red

### Claude no muestra las herramientas
- Reinicia Claude Desktop completamente
- Verifica la sintaxis JSON del archivo de configuración
- Revisa los logs de Claude Desktop en Console.app

## 📊 Información del Paquete

- **Nombre:** n8n-mcp-connector
- **Versión:** 1.0.0
- **Autor:** nazcamedia
- **Licencia:** MIT
- **Dependencias:** @modelcontextprotocol/sdk, axios, dotenv
- **Tamaño:** 24.9 kB (descomprimido)

---

**¡Listo para usar! 🎉**  
**No más instalaciones locales, no más servidores que levantar.**