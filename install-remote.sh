#!/bin/bash

# N8N MCP Connector - Instalación Remota
# Configura el servidor MCP para uso remoto sin instalación local

set -e

# Importar y usar el detector de runner
source "$(dirname "$0")/scripts/detect-runner.sh"
RUNNER=$(detect_runner)
echo "🏃 Runner detectado: $RUNNER"

echo "🚀 N8N MCP Connector - Instalación Remota"
echo "==========================================="
echo ""
echo "Selecciona el método de instalación:"
echo "1) NPM Global (Recomendado para desarrollo)"
echo "2) MCP.so (Recomendado para producción)"
echo "3) Mostrar ambas configuraciones"
echo ""
read -p "Opción (1-3): " choice

CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# Crear directorio si no existe
if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "📁 Creando directorio de configuración de Claude..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

# Backup de configuración existente
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "📋 Creando backup de configuración existente..."
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

case $choice in
    1)
        echo "📦 Configurando para NPM Global..."
        cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "$RUNNER",
      "args": ["n8n-mcp-connector"],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
EOF
        echo "✅ Configuración NPM completada!"
        echo ""
        echo "📝 Próximos pasos:"
        echo "1. Actualiza las credenciales en: $CLAUDE_CONFIG_FILE"
        echo "2. Asegúrate de que el paquete esté publicado: npm view n8n-mcp-connector"
        echo "3. Reinicia Claude Desktop"
        ;;
    2)
        echo "☁️ Configurando para MCP.so..."
        cat > "$CLAUDE_CONFIG_FILE" << 'EOF'
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
EOF
        echo "✅ Configuración MCP.so completada!"
        echo ""
        echo "📝 Próximos pasos:"
        echo "1. Actualiza las credenciales en: $CLAUDE_CONFIG_FILE"
        echo "2. Verifica que el servidor esté disponible en mcp.so"
        echo "3. Reinicia Claude Desktop"
        ;;
    3)
        echo "📋 Configuraciones disponibles:"
        echo ""
        echo "=== NPM Global ==="
        cat configs/claude-desktop-npm.json
        echo ""
        echo "=== MCP.so ==="
        cat configs/claude-desktop-mcpso.json
        echo ""
        echo "💡 Copia la configuración deseada a: $CLAUDE_CONFIG_FILE"
        exit 0
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "🔧 Configuración de credenciales:"
echo "- N8N_BASE_URL: URL de tu instancia de n8n"
echo "- N8N_API_KEY: Tu API key de n8n (recomendado)"
echo "- Alternativamente: N8N_USERNAME y N8N_PASSWORD"
echo ""
echo "🛠 Herramientas disponibles después de la configuración:"
echo "  - execute_workflow: Ejecutar workflows"
echo "  - list_workflows: Listar workflows"
echo "  - get_workflow: Obtener detalles de workflow"
echo "  - get_execution_status: Estado de ejecución"
echo "  - list_executions: Historial de ejecuciones"
echo "  - activate_workflow: Activar/desactivar workflows"
echo "  - create_webhook: Crear webhooks"
echo ""
echo "✅ ¡Instalación completada! Reinicia Claude Desktop para usar las herramientas."