# 🔧 N8N MCP Connector - Instalación para Claude Desktop

## Estado del Proyecto ✅

**Servidor MCP verificado y funcionando correctamente**

- ✅ Dependencias instaladas
- ✅ Código compilado exitosamente
- ✅ Servidor MCP ejecutándose sin errores
- ✅ Configuración de entorno funcional
- ✅ Herramientas MCP disponibles

## 🚀 Instalación Automática

### Opción 1: Script de Instalación (Recomendado)

```bash
# Ejecutar desde el directorio del proyecto
./install-mcp.sh
```

Este script:
- Configura automáticamente Claude Desktop
- Crea backup de configuración existente
- Establece las rutas correctas
- Proporciona instrucciones de siguiente paso

### Opción 2: Configuración Manual

1. **Localizar archivo de configuración de Claude Desktop:**
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. **Agregar configuración del servidor MCP:**
   ```json
   {
     "mcpServers": {
       "n8n-workflows": {
         "command": "node",
         "args": ["./dist/index.js"],
         "cwd": "/Users/nazcamedia/Documents/GitHub/n8n-mcp-connector",
         "env": {
           "N8N_BASE_URL": "http://localhost:5678",
           "N8N_USERNAME": "admin",
           "N8N_PASSWORD": "admin"
         }
       }
     }
   }
   ```

## ⚙️ Configuración de Credenciales

### Opción A: API Key (Recomendado)
```json
"env": {
  "N8N_BASE_URL": "http://localhost:5678",
  "N8N_API_KEY": "tu_api_key_aqui"
}
```

### Opción B: Usuario/Contraseña
```json
"env": {
  "N8N_BASE_URL": "http://localhost:5678",
  "N8N_USERNAME": "tu_usuario",
  "N8N_PASSWORD": "tu_contraseña"
}
```

## 🛠 Herramientas Disponibles

Una vez configurado, tendrás acceso a estas herramientas en Claude:

| Herramienta | Descripción |
|-------------|-------------|
| `execute_workflow` | Ejecutar workflows de n8n con datos personalizados |
| `list_workflows` | Listar todos los workflows disponibles |
| `get_workflow` | Obtener información detallada de un workflow |
| `get_execution_status` | Verificar el estado de una ejecución |
| `list_executions` | Ver historial de ejecuciones recientes |
| `activate_workflow` | Activar/desactivar workflows |
| `create_webhook` | Generar URLs de webhook para automatización |

## 🔍 Verificación de Instalación

1. **Reiniciar Claude Desktop** después de la configuración
2. **Verificar conexión:** Pregunta a Claude: "¿Qué herramientas de n8n tienes disponibles?"
3. **Probar funcionalidad:** "Lista todos los workflows disponibles"

## 🐛 Solución de Problemas

### Error: "N8N authentication required"
- Verificar que las credenciales estén correctamente configuradas
- Asegurar que n8n esté ejecutándose en la URL especificada

### Error: "Command not found"
- Verificar que la ruta `cwd` sea correcta
- Asegurar que `npm run build` se haya ejecutado exitosamente

### Claude no muestra las herramientas
- Reiniciar Claude Desktop completamente
- Verificar sintaxis JSON del archivo de configuración
- Revisar logs de Claude Desktop en Console.app

## 📋 Requisitos Previos

- ✅ Node.js 18+
- ✅ n8n instance activa
- ✅ Claude Desktop instalado
- ✅ Credenciales de n8n configuradas

## 🔗 Enlaces Útiles

- [Documentación de n8n API](https://docs.n8n.io/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

---

**Estado:** ✅ Listo para usar
**Última verificación:** $(date)
**Versión:** 1.0.0