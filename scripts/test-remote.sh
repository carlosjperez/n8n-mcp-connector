#!/bin/bash

# N8N MCP Connector - Test de Configuraciones Remotas
# Verifica que las configuraciones remotas funcionen correctamente

set -e

echo "🧪 Probando configuraciones remotas de N8N MCP Connector"
echo "======================================================"
echo ""

# Función para probar configuración
test_config() {
    local config_name="$1"
    local config_file="$2"
    
    echo "🔍 Probando configuración: $config_name"
    echo "📁 Archivo: $config_file"
    
    if [ ! -f "$config_file" ]; then
        echo "❌ Archivo de configuración no encontrado: $config_file"
        return 1
    fi
    
    # Validar JSON
    if ! python3 -m json.tool "$config_file" > /dev/null 2>&1; then
        echo "❌ JSON inválido en: $config_file"
        return 1
    fi
    
    echo "✅ Configuración válida"
    echo ""
}

# Probar configuraciones
test_config "NPM Global" "configs/claude-desktop-npm.json"
test_config "MCP.so" "configs/claude-desktop-mcpso.json"
test_config "Local Development" "claude-desktop-config.json"

# Verificar que el paquete esté listo para publicación
echo "📦 Verificando preparación para NPM..."

if [ ! -f "dist/index.js" ]; then
    echo "⚠️ Proyecto no compilado. Ejecutando build..."
    npm run build
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js no encontrado después del build"
    exit 1
fi

echo "✅ Proyecto compilado correctamente"

# Verificar package.json para publicación
echo "📋 Verificando package.json..."

if ! grep -q '"bin"' package.json; then
    echo "❌ Error: Campo 'bin' no encontrado en package.json"
    exit 1
fi

if ! grep -q '"files"' package.json; then
    echo "❌ Error: Campo 'files' no encontrado en package.json"
    exit 1
fi

echo "✅ package.json configurado correctamente para publicación"

# Verificar scripts
echo "🔧 Verificando scripts..."

for script in "install-remote.sh" "scripts/publish-npm.sh"; do
    if [ ! -f "$script" ]; then
        echo "❌ Script no encontrado: $script"
        exit 1
    fi
    
    if [ ! -x "$script" ]; then
        echo "❌ Script no ejecutable: $script"
        exit 1
    fi
    
    echo "✅ $script - OK"
done

# Verificar documentación
echo "📚 Verificando documentación..."

for doc in "README.md" "DEPLOYMENT-GUIDE.md" "MCP-INSTALLATION.md"; do
    if [ ! -f "$doc" ]; then
        echo "❌ Documentación no encontrada: $doc"
        exit 1
    fi
    echo "✅ $doc - OK"
done

echo ""
echo "🎉 ¡Todas las verificaciones pasaron!"
echo ""
echo "📋 Resumen de configuraciones disponibles:"
echo "1. 📦 NPM Global: npx n8n-mcp-connector"
echo "2. ☁️ MCP.so: mcp install n8n-workflows/carlosjperez"
echo "3. 🔧 Local: node ./dist/index.js"
echo ""
echo "🚀 Próximos pasos para despliegue:"
echo "1. Publicar en NPM: ./scripts/publish-npm.sh"
echo "2. Verificar en mcp.so: https://mcp.so/server/n8n-workflows/carlosjperez"
echo "3. Probar instalación remota: ./install-remote.sh"
echo ""
echo "✅ ¡Listo para usar sin instalación local!"