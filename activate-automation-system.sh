#!/bin/bash

# 🚀 Script de Activación del Sistema de Automatización

echo "🚀 Activando Sistema de Automatización..."
echo ""

# Verificar que los secrets están configurados
echo "📋 Verificando configuración..."
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    SECRETS=$(gh secret list 2>/dev/null || echo "")
    
    REQUIRED_SECRETS=("LINEAR_API_KEY" "LINEAR_TEAM_ID" "LINT_AGENT_USERNAME" "TEST_AGENT_USERNAME" "BUILD_AGENT_USERNAME" "DEVOPS_AGENT_USERNAME" "DEPLOY_AGENT_USERNAME" "SECURITY_AGENT_USERNAME")
    
    MISSING_SECRETS=()
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if ! echo "$SECRETS" | grep -q "$secret"; then
            MISSING_SECRETS+=("$secret")
        fi
    done
    
    if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
        echo "✅ Todos los secrets requeridos están configurados"
    else
        echo "❌ Secrets faltantes: ${MISSING_SECRETS[*]}"
        echo "   Configura los secrets antes de activar el sistema"
        echo "   Ejecuta: ./configure-github-secrets.sh"
        exit 1
    fi
else
    echo "⚠️  No se puede verificar secrets sin GitHub CLI"
    echo "   Asegúrate de que los secrets estén configurados manualmente"
fi

echo ""
echo "🔄 Activando sistema con commit..."
git add .
git commit -m "feat: activate automated error management system" || echo "No hay cambios para commitear"
git push

echo ""
echo "✅ Sistema activado"
echo "📊 Monitorea el progreso en:"
echo "   - GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:\/]\([^.]*\).*/\1/')/actions"
echo "   - Linear: https://linear.app"
echo ""
echo "🧪 Para probar el sistema:"
echo "   echo '// Test error' >> src/index.ts"
echo "   git add . && git commit -m 'test: trigger ci failure' && git push"
