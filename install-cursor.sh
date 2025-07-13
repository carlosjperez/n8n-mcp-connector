#!/bin/bash

# N8N MCP Connector - Instalación para Cursor y otros agentes de IA
# Configuración universal para múltiples agentes que soporten MCP

set -e

echo "🎯 N8N MCP Connector - Instalación Universal para Agentes IA"
echo "============================================================"
echo ""
echo "Agentes soportados:"
echo "1) Cursor (VS Code AI)"
echo "2) Continue.dev"
echo "3) Codeium"
echo "4) Claude Desktop"
echo "5) Configuración manual/otros agentes"
echo ""
read -p "Selecciona tu agente (1-5): " agent_choice

echo ""
echo "Métodos de instalación disponibles:"
echo "1) NPM Global (Recomendado para desarrollo)"
echo "2) MCP.so (Recomendado para producción)"
echo "3) Docker (Aislado y portable)"
echo "4) Instalación local (Desarrollo avanzado)"
echo ""
read -p "Método de instalación (1-4): " install_choice

# Función para generar configuración base
generate_base_config() {
    local command="$1"
    local args="$2"
    
    cat << EOF
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "$command",
      "args": [$args],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
EOF
}

# Función para configurar Cursor
setup_cursor() {
    local config_dir="$HOME/.cursor/mcp"
    local config_file="$config_dir/config.json"
    
    echo "🎯 Configurando Cursor..."
    mkdir -p "$config_dir"
    
    case $install_choice in
        1)
            generate_base_config "npx" '"n8n-mcp-connector"' > "$config_file"
            ;;
        2)
            generate_base_config "mcp" '"install", "n8n-workflows/carlosjperez"' > "$config_file"
            ;;
        3)
            generate_base_config "docker" '"run", "--rm", "-e", "N8N_BASE_URL", "-e", "N8N_API_KEY", "nazcamedia/n8n-mcp-connector"' > "$config_file"
            ;;
        4)
            generate_base_config "node" '"./dist/index.js"' > "$config_file"
            ;;
    esac
    
    echo "✅ Cursor configurado en: $config_file"
}

# Función para configurar Continue.dev
setup_continue() {
    local config_dir="$HOME/.continue"
    local config_file="$config_dir/config.json"
    
    echo "🔄 Configurando Continue.dev..."
    mkdir -p "$config_dir"
    
    # Continue.dev usa un formato diferente
    cat > "$config_file" << EOF
{
  "models": [],
  "customCommands": [],
  "contextProviders": [
    {
      "name": "n8n-workflows",
      "params": {
        "serverCommand": "npx n8n-mcp-connector",
        "env": {
          "N8N_BASE_URL": "https://tu-instancia-n8n.com",
          "N8N_API_KEY": "tu_api_key_aqui"
        }
      }
    }
  ]
}
EOF
    
    echo "✅ Continue.dev configurado en: $config_file"
}

# Función para configurar Codeium
setup_codeium() {
    local config_dir="$HOME/.codeium"
    local config_file="$config_dir/mcp-config.json"
    
    echo "🤖 Configurando Codeium..."
    mkdir -p "$config_dir"
    
    case $install_choice in
        1)
            generate_base_config "npx" '"n8n-mcp-connector"' > "$config_file"
            ;;
        2)
            generate_base_config "mcp" '"install", "n8n-workflows/carlosjperez"' > "$config_file"
            ;;
        3)
            generate_base_config "docker" '"run", "--rm", "-e", "N8N_BASE_URL", "-e", "N8N_API_KEY", "nazcamedia/n8n-mcp-connector"' > "$config_file"
            ;;
        4)
            generate_base_config "node" '"./dist/index.js"' > "$config_file"
            ;;
    esac
    
    echo "✅ Codeium configurado en: $config_file"
}

# Función para configurar Claude Desktop
setup_claude() {
    local config_dir="$HOME/Library/Application Support/Claude"
    local config_file="$config_dir/claude_desktop_config.json"
    
    echo "🤖 Configurando Claude Desktop..."
    mkdir -p "$config_dir"
    
    # Backup si existe
    if [ -f "$config_file" ]; then
        cp "$config_file" "$config_file.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    case $install_choice in
        1)
            generate_base_config "npx" '"n8n-mcp-connector"' > "$config_file"
            ;;
        2)
            generate_base_config "mcp" '"install", "n8n-workflows/carlosjperez"' > "$config_file"
            ;;
        3)
            generate_base_config "docker" '"run", "--rm", "-e", "N8N_BASE_URL", "-e", "N8N_API_KEY", "nazcamedia/n8n-mcp-connector"' > "$config_file"
            ;;
        4)
            generate_base_config "node" '"./dist/index.js"' > "$config_file"
            ;;
    esac
    
    echo "✅ Claude Desktop configurado en: $config_file"
}

# Función para configuración manual
setup_manual() {
    echo "📋 Configuración Manual - Copia esta configuración a tu agente:"
    echo "================================================================"
    echo ""
    
    case $install_choice in
        1)
            echo "NPM Global:"
            generate_base_config "npx" '"n8n-mcp-connector"'
            ;;
        2)
            echo "MCP.so:"
            generate_base_config "mcp" '"install", "n8n-workflows/carlosjperez"'
            ;;
        3)
            echo "Docker:"
            generate_base_config "docker" '"run", "--rm", "-e", "N8N_BASE_URL", "-e", "N8N_API_KEY", "nazcamedia/n8n-mcp-connector"'
            ;;
        4)
            echo "Local:"
            generate_base_config "node" '"./dist/index.js"'
            ;;
    esac
    
    echo ""
    echo "📝 Instrucciones adicionales:"
    echo "1. Copia la configuración JSON a tu archivo de configuración del agente"
    echo "2. Actualiza N8N_BASE_URL con tu instancia de n8n"
    echo "3. Actualiza N8N_API_KEY con tu clave API"
    echo "4. Reinicia tu agente de IA"
}

# Ejecutar configuración según el agente seleccionado
case $agent_choice in
    1)
        setup_cursor
        ;;
    2)
        setup_continue
        ;;
    3)
        setup_codeium
        ;;
    4)
        setup_claude
        ;;
    5)
        setup_manual
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "🔧 Configuración de credenciales requerida:"
echo "============================================"
echo "N8N_BASE_URL: URL de tu instancia de n8n (ej: https://n8n.tudominio.com)"
echo "N8N_API_KEY: Tu API key de n8n (recomendado)"
echo ""
echo "Alternativa (menos segura):"
echo "N8N_USERNAME: Tu usuario de n8n"
echo "N8N_PASSWORD: Tu contraseña de n8n"
echo ""
echo "🛠 Herramientas disponibles:"
echo "============================"
echo "• execute_workflow - Ejecutar workflows con datos personalizados"
echo "• list_workflows - Listar todos los workflows disponibles"
echo "• get_workflow - Obtener detalles específicos de un workflow"
echo "• get_execution_status - Monitorear el estado de ejecuciones"
echo "• list_executions - Ver historial de ejecuciones"
echo "• activate_workflow - Activar/desactivar workflows"
echo "• create_webhook - Crear URLs de webhook para integraciones"
echo ""
echo "📚 Documentación completa:"
echo "https://github.com/carlosjperez/n8n-mcp-connector"
echo ""
echo "✅ ¡Instalación completada! Reinicia tu agente de IA para usar las herramientas."
echo "💡 Tip: Usa 'list_workflows' como primer comando para verificar la conexión."