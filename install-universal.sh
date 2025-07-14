#!/bin/bash

# N8N MCP Connector - Instalación Universal
# Detecta automáticamente el agente de IA y configura el conector

set -e

# Importar y usar el detector de runner
source "$(dirname "$0")/scripts/detect-runner.sh"
RUNNER=$(detect_runner)
echo "🏃 Runner detectado: $RUNNER"

echo "🚀 N8N MCP Connector - Instalación Universal"
echo "============================================"
echo ""

# Función para detectar agentes instalados
detect_agents() {
    local agents=()
    
    # Detectar Cursor
    if [ -d "/Applications/Cursor.app" ] || command -v cursor &> /dev/null; then
        agents+=("cursor")
    fi
    
    # Detectar Claude Desktop
    if [ -d "/Applications/Claude.app" ] || [ -d "$HOME/Library/Application Support/Claude" ]; then
        agents+=("claude")
    fi
    
    # Detectar VS Code (para Continue.dev)
    if [ -d "/Applications/Visual Studio Code.app" ] || command -v code &> /dev/null; then
        if [ -d "$HOME/.continue" ] || [ -d "$HOME/.vscode/extensions" ]; then
            agents+=("continue")
        fi
    fi
    
    # Detectar Codeium
    if command -v codeium &> /dev/null || [ -d "$HOME/.codeium" ]; then
        agents+=("codeium")
    fi
    
    echo "${agents[@]}"
}

# Función para configurar según el agente
configure_agent() {
    local agent="$1"
    local method="${2:-npm}"
    
    case $agent in
        "cursor")
            echo "🎯 Configurando Cursor..."
            local config_dir="$HOME/.cursor/mcp"
            local config_file="$config_dir/config.json"
            mkdir -p "$config_dir"
            
            cat > "$config_file" << EOF
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "$RUNNER",
      "args": ["n8n-mcp-connector@latest"],
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
            echo "✅ Cursor configurado en: $config_file"
            ;;
            
        "claude")
            echo "🤖 Configurando Claude Desktop..."
            local config_dir="$HOME/Library/Application Support/Claude"
            local config_file="$config_dir/claude_desktop_config.json"
            mkdir -p "$config_dir"
            
            # Backup si existe
            if [ -f "$config_file" ]; then
                cp "$config_file" "$config_file.backup.$(date +%Y%m%d_%H%M%S)"
            fi
            
            cat > "$config_file" << EOF
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "$RUNNER",
      "args": ["n8n-mcp-connector@latest"],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
EOF
            echo "✅ Claude Desktop configurado en: $config_file"
            ;;
            
        "continue")
            echo "🔄 Configurando Continue.dev..."
            local config_dir="$HOME/.continue"
            local config_file="$config_dir/config.json"
            mkdir -p "$config_dir"
            
            # Backup si existe
            if [ -f "$config_file" ]; then
                cp "$config_file" "$config_file.backup.$(date +%Y%m%d_%H%M%S)"
            fi
            
            cat > "$config_file" << EOF
{
  "models": [],
  "customCommands": [],
  "contextProviders": [
    {
      "name": "n8n-workflows",
      "params": {
        "serverCommand": "$RUNNER n8n-mcp-connector",
        "env": {
          "N8N_BASE_URL": "https://tu-instancia-n8n.com",
          "N8N_API_KEY": "tu_api_key_aqui"
        }
      }
    }
  ],
  "experimental": {
    "enableMCP": true,
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
}
EOF
            echo "✅ Continue.dev configurado en: $config_file"
            ;;
            
        "codeium")
            echo "🤖 Configurando Codeium..."
            local config_dir="$HOME/.codeium"
            local config_file="$config_dir/mcp-config.json"
            mkdir -p "$config_dir"
            
            cat > "$config_file" << EOF
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "$RUNNER",
      "args": ["n8n-mcp-connector@latest"],
      "env": {
        "N8N_BASE_URL": "https://tu-instancia-n8n.com",
        "N8N_API_KEY": "tu_api_key_aqui"
      }
    }
  }
}
EOF
            echo "✅ Codeium configurado en: $config_file"
            ;;
    esac
}

# Detectar agentes disponibles
echo "🔍 Detectando agentes de IA instalados..."
detected_agents=($(detect_agents))

if [ ${#detected_agents[@]} -eq 0 ]; then
    echo "⚠️  No se detectaron agentes de IA compatibles."
    echo ""
    echo "Agentes soportados:"
    echo "• Cursor (https://cursor.sh)"
    echo "• Claude Desktop (https://claude.ai/download)"
    echo "• Continue.dev (https://continue.dev)"
    echo "• Codeium (https://codeium.com)"
    echo ""
    echo "📦 Instalación NPM Global disponible:"
    echo "npm install -g n8n-mcp-connector"
    exit 1
fi

echo "✅ Agentes detectados: ${detected_agents[*]}"
echo ""

# Si hay múltiples agentes, preguntar cuál configurar
if [ ${#detected_agents[@]} -gt 1 ]; then
    echo "🎯 Múltiples agentes detectados. Selecciona cuál configurar:"
    for i in "${!detected_agents[@]}"; do
        echo "$((i+1))) ${detected_agents[$i]}"
    done
    echo "$((${#detected_agents[@]}+1))) Todos"
    echo ""
    read -p "Opción (1-$((${#detected_agents[@]}+1))): " choice
    
    if [ "$choice" -eq "$((${#detected_agents[@]}+1))" ]; then
        # Configurar todos
        for agent in "${detected_agents[@]}"; do
            configure_agent "$agent"
        done
    else
        # Configurar el seleccionado
        selected_index=$((choice-1))
        if [ "$selected_index" -ge 0 ] && [ "$selected_index" -lt "${#detected_agents[@]}" ]; then
            configure_agent "${detected_agents[$selected_index]}"
        else
            echo "❌ Opción inválida"
            exit 1
        fi
    fi
else
    # Solo un agente detectado, configurar automáticamente
    configure_agent "${detected_agents[0]}"
fi

echo ""
echo "🔧 Configuración de credenciales requerida:"
echo "============================================"
echo "Actualiza los siguientes valores en los archivos de configuración:"
echo ""
echo "N8N_BASE_URL: URL de tu instancia de n8n"
echo "  Ejemplo: https://n8n.tudominio.com"
echo ""
echo "N8N_API_KEY: Tu API key de n8n (recomendado)"
echo "  Obtener en: n8n → Settings → API Keys"
echo ""
echo "Alternativa (menos segura):"
echo "N8N_USERNAME: Tu usuario de n8n"
echo "N8N_PASSWORD: Tu contraseña de n8n"
echo ""
echo "🛠 Herramientas disponibles:"
echo "============================"
echo "• execute_workflow - Ejecutar workflows"
echo "• list_workflows - Listar workflows"
echo "• get_workflow - Detalles de workflow"
echo "• get_execution_status - Estado de ejecución"
echo "• list_executions - Historial"
echo "• activate_workflow - Activar/desactivar"
echo "• create_webhook - Crear webhooks"
echo ""
echo "📚 Documentación: https://github.com/carlosjperez/n8n-mcp-connector"
echo ""
echo "✅ ¡Instalación completada!"
echo "💡 Reinicia tu(s) agente(s) de IA para usar las herramientas."
echo "🧪 Prueba con: 'list_workflows' para verificar la conexión."