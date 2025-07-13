#!/bin/bash

# N8N MCP Connector - Instalación Rápida para Agentes de IA
# Script de una línea para configuración inmediata

set -e

echo "⚡ N8N MCP Connector - Instalación Rápida"
echo "========================================"
echo ""
echo "Comandos de instalación de una línea:"
echo ""

# Función para mostrar comando con colores
show_command() {
    local agent="$1"
    local command="$2"
    echo "🎯 $agent:"
    echo "   $command"
    echo ""
}

# Comandos para diferentes agentes
show_command "Cursor" \
    'curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 1 1'

show_command "Claude Desktop" \
    'curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-remote.sh | bash -s -- 1'

show_command "Continue.dev" \
    'curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 2 1'

show_command "Codeium" \
    'curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 3 1'

show_command "NPM Global (Universal)" \
    'npm install -g n8n-mcp-connector && echo "Configurar variables de entorno N8N_BASE_URL y N8N_API_KEY"'

show_command "Docker (Portable)" \
    'docker run -e N8N_BASE_URL=https://tu-n8n.com -e N8N_API_KEY=tu_key nazcamedia/n8n-mcp-connector'

echo "📋 Configuraciones manuales disponibles:"
echo "========================================"
echo ""
echo "Para copiar configuraciones específicas:"
echo ""
echo "• Cursor: configs/cursor-config.json"
echo "• Continue.dev: configs/continue-config.json"
echo "• Claude Desktop: configs/claude-desktop-npm.json"
echo "• MCP.so: configs/claude-desktop-mcpso.json"
echo ""
echo "🔧 Variables de entorno requeridas:"
echo "===================================="
echo "N8N_BASE_URL=https://tu-instancia-n8n.com"
echo "N8N_API_KEY=tu_api_key_de_n8n"
echo ""
echo "🛠 Herramientas disponibles después de la instalación:"
echo "======================================================"
echo "• execute_workflow - Ejecutar workflows"
echo "• list_workflows - Listar workflows"
echo "• get_workflow - Detalles de workflow"
echo "• get_execution_status - Estado de ejecución"
echo "• list_executions - Historial"
echo "• activate_workflow - Activar/desactivar"
echo "• create_webhook - Crear webhooks"
echo ""
echo "📚 Documentación: https://github.com/carlosjperez/n8n-mcp-connector"
echo "💡 Soporte: https://github.com/carlosjperez/n8n-mcp-connector/issues"
echo ""
echo "✅ Elige el comando apropiado para tu agente y ejecútalo!"

# Función interactiva opcional
if [ "$1" = "--interactive" ] || [ "$1" = "-i" ]; then
    echo ""
    echo "🎮 Modo Interactivo Activado"
    echo "============================="
    echo ""
    echo "Selecciona tu agente:"
    echo "1) Cursor"
    echo "2) Claude Desktop"
    echo "3) Continue.dev"
    echo "4) Codeium"
    echo "5) NPM Global"
    echo "6) Docker"
    echo ""
    read -p "Opción (1-6): " choice
    
    case $choice in
        1)
            echo "🎯 Instalando para Cursor..."
            curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 1 1
            ;;
        2)
            echo "🤖 Instalando para Claude Desktop..."
            curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-remote.sh | bash -s -- 1
            ;;
        3)
            echo "🔄 Instalando para Continue.dev..."
            curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 2 1
            ;;
        4)
            echo "🤖 Instalando para Codeium..."
            curl -fsSL https://raw.githubusercontent.com/carlosjperez/n8n-mcp-connector/main/install-cursor.sh | bash -s -- 3 1
            ;;
        5)
            echo "📦 Instalando NPM Global..."
            npm install -g n8n-mcp-connector
            echo "✅ Instalado! Configura N8N_BASE_URL y N8N_API_KEY"
            ;;
        6)
            echo "🐳 Configuración Docker:"
            echo "docker run -e N8N_BASE_URL=https://tu-n8n.com -e N8N_API_KEY=tu_key nazcamedia/n8n-mcp-connector"
            ;;
        *)
            echo "❌ Opción inválida"
            exit 1
            ;;
    esac
fi