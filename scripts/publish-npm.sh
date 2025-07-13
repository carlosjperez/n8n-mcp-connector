#!/bin/bash

# N8N MCP Connector - NPM Publication Script
# Prepara y publica el paquete en NPM para uso global

set -e

echo "🚀 Preparando publicación en NPM..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

# Limpiar y construir
echo "🧹 Limpiando proyecto..."
npm run clean

echo "🔨 Construyendo proyecto..."
npm run build

# Verificar que el build fue exitoso
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: Build falló, dist/index.js no encontrado"
    exit 1
fi

# Verificar login en NPM
echo "🔐 Verificando autenticación NPM..."
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ No estás logueado en NPM. Ejecuta: npm login"
    exit 1
fi

# Mostrar información del paquete
echo "📦 Información del paquete:"
npm run --silent version
echo "Usuario NPM: $(npm whoami)"

# Confirmar publicación
read -p "¿Continuar con la publicación? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publicación cancelada"
    exit 1
fi

# Publicar en NPM
echo "📤 Publicando en NPM..."
npm publish

if [ $? -eq 0 ]; then
    echo "✅ ¡Publicación exitosa!"
    echo ""
    echo "📋 Configuración para Claude Desktop:"
    echo ""
    cat << EOF
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
EOF
    echo ""
    echo "🔧 Para usar desde cualquier máquina:"
    echo "1. Copia la configuración anterior a claude_desktop_config.json"
    echo "2. Actualiza N8N_BASE_URL y N8N_API_KEY con tus credenciales"
    echo "3. Reinicia Claude Desktop"
    echo ""
    echo "📦 Paquete disponible en: https://www.npmjs.com/package/n8n-mcp-connector"
else
    echo "❌ Error en la publicación"
    exit 1
fi