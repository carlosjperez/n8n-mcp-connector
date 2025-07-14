#!/bin/bash

# 🔐 Script para Configurar GitHub Secrets
# Ejecuta estos comandos después de configurar tus credenciales reales

echo "🔐 Configurando GitHub Secrets..."
echo "IMPORTANTE: Reemplaza los valores de ejemplo con tus credenciales reales"
echo ""

# Verificar GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI no encontrado. Instala con: brew install gh"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI no autenticado. Ejecuta: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI configurado correctamente"
echo ""

# Comandos para configurar secrets (con valores de ejemplo)
echo "Ejecutando comandos de configuración..."
echo ""

# Linear Integration
echo "gh secret set LINEAR_API_KEY --body 'lin_api_TU_API_KEY_AQUI'"
echo "gh secret set LINEAR_TEAM_ID --body 'TU_TEAM_ID_AQUI'"
echo "gh secret set LINEAR_WEBHOOK_ID --body 'webhook_TU_WEBHOOK_ID_AQUI'"
echo ""

# Agent Assignments
echo "gh secret set LINT_AGENT_USERNAME --body 'tu_usuario_lint'"
echo "gh secret set TEST_AGENT_USERNAME --body 'tu_usuario_test'"
echo "gh secret set BUILD_AGENT_USERNAME --body 'tu_usuario_build'"
echo "gh secret set DEVOPS_AGENT_USERNAME --body 'tu_usuario_devops'"
echo "gh secret set DEPLOY_AGENT_USERNAME --body 'tu_usuario_deploy'"
echo "gh secret set SECURITY_AGENT_USERNAME --body 'tu_usuario_security'"
echo ""

# NPM Token (opcional)
echo "gh secret set NPM_TOKEN --body 'npm_TU_TOKEN_AQUI'"
echo ""

echo "⚠️  IMPORTANTE: Estos son comandos de ejemplo."
echo "   Reemplaza los valores con tus credenciales reales antes de ejecutar."
echo ""
echo "📖 Para más información, consulta: CONFIGURACION-AUTOMATIZADA-GUIA.md"
