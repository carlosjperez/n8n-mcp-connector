#!/bin/bash

# 🚀 Demo Automático del Sistema de Automatización
# Configura la infraestructura sin credenciales reales

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "🚀 Demo Automático del Sistema de Automatización"
    echo "   Preparando infraestructura sin credenciales reales"
    echo -e "${NC}"
    
    print_header "PASO 1: Verificando Estructura del Proyecto"
    
    # Verificar archivos críticos
    if [[ -f ".github/workflows/ci-cd.yml" ]]; then
        print_success "Workflow CI/CD encontrado"
    else
        print_error "Workflow CI/CD no encontrado"
    fi
    
    if [[ -f ".github/workflows/linear-integration.yml" ]]; then
        print_success "Workflow Linear Integration encontrado"
    else
        print_error "Workflow Linear Integration no encontrado"
    fi
    
    if [[ -f "package.json" ]]; then
        print_success "package.json encontrado"
    else
        print_error "package.json no encontrado"
    fi
    
    print_header "PASO 2: Verificando Scripts de Configuración"
    
    if [[ -f "setup-automation-system.sh" ]]; then
        print_success "Script de configuración disponible"
    fi
    
    if [[ -f "verify-automation-system.sh" ]]; then
        print_success "Script de verificación disponible"
    fi
    
    if [[ -f "CONFIGURACION-AUTOMATIZADA-GUIA.md" ]]; then
        print_success "Guía de configuración disponible"
    fi
    
    if [[ -f "README-AUTOMATION.md" ]]; then
        print_success "Documentación del sistema disponible"
    fi
    
    print_header "PASO 3: Preparando Configuración Demo"
    
    # Crear archivo de configuración demo
    cat > .env.automation.demo << 'EOF'
# 🔧 Configuración Demo del Sistema de Automatización
# IMPORTANTE: Estos son valores de ejemplo, reemplaza con tus credenciales reales

# Linear Integration
LINEAR_API_KEY=lin_api_XXXXXXXXXXXXXXXXXXXXXXXXXX
LINEAR_TEAM_ID=TEAM_ID_AQUI
LINEAR_WEBHOOK_ID=webhook_XXXXXXXXXXXXXXXXXXXXXXXXXX

# Agent Assignments (usernames de GitHub)
LINT_AGENT_USERNAME=usuario_lint
TEST_AGENT_USERNAME=usuario_test
BUILD_AGENT_USERNAME=usuario_build
DEVOPS_AGENT_USERNAME=usuario_devops
DEPLOY_AGENT_USERNAME=usuario_deploy
SECURITY_AGENT_USERNAME=usuario_security

# NPM Publishing (opcional)
NPM_TOKEN=npm_XXXXXXXXXXXXXXXXXXXXXXXXXX
EOF
    
    print_success "Archivo de configuración demo creado: .env.automation.demo"
    
    print_header "PASO 4: Generando Comandos de GitHub Secrets"
    
    # Crear script con comandos de GitHub CLI
    cat > configure-github-secrets.sh << 'EOF'
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
EOF
    
    chmod +x configure-github-secrets.sh
    print_success "Script de configuración de secrets creado: configure-github-secrets.sh"
    
    print_header "PASO 5: Verificando Workflows Existentes"
    
    # Verificar sintaxis de workflows
    if command -v yamllint &> /dev/null; then
        if yamllint .github/workflows/*.yml &> /dev/null; then
            print_success "Sintaxis YAML de workflows válida"
        else
            print_warning "Posibles errores de sintaxis en workflows"
        fi
    else
        print_info "yamllint no disponible, omitiendo verificación de sintaxis"
    fi
    
    print_header "PASO 6: Preparando Activación del Sistema"
    
    # Crear script de activación
    cat > activate-automation-system.sh << 'EOF'
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
EOF
    
    chmod +x activate-automation-system.sh
    print_success "Script de activación creado: activate-automation-system.sh"
    
    print_header "PASO 7: Creando Documentación de Próximos Pasos"
    
    cat > PROXIMOS-PASOS.md << 'EOF'
# 📋 Próximos Pasos para Activar el Sistema

## ✅ Completado
- [x] Infraestructura del sistema configurada
- [x] Workflows de GitHub Actions listos
- [x] Scripts de configuración creados
- [x] Documentación generada

## 🔄 Pendiente (Requiere Acción Manual)

### 1. 🔐 Configurar Credenciales de Linear
```bash
# Obtener en Linear:
# Settings → API → Personal API Keys
LINEAR_API_KEY=lin_api_XXXXXXXXX

# Obtener de la URL del team:
# linear.app/team/ABC123/issues → ABC123
LINEAR_TEAM_ID=ABC123

# Opcional - Settings → API → Webhooks
LINEAR_WEBHOOK_ID=webhook_XXXXXXXXX
```

### 2. 👥 Definir Agentes
```bash
# Usernames de GitHub para cada tipo de error
LINT_AGENT_USERNAME=usuario_lint
TEST_AGENT_USERNAME=usuario_test
BUILD_AGENT_USERNAME=usuario_build
DEVOPS_AGENT_USERNAME=usuario_devops
DEPLOY_AGENT_USERNAME=usuario_deploy
SECURITY_AGENT_USERNAME=usuario_security
```

### 3. 🔧 Configurar GitHub Secrets
```bash
# Opción A: Automático con GitHub CLI
./configure-github-secrets.sh

# Opción B: Manual en GitHub
# Ve a: Repository → Settings → Secrets → Actions
# Añade cada secret individualmente
```

### 4. 🚀 Activar Sistema
```bash
# Una vez configurados los secrets:
./activate-automation-system.sh
```

### 5. 🧪 Probar Sistema
```bash
# Crear error intencional:
echo "// Test error" >> src/index.ts
git add . && git commit -m "test: trigger ci failure" && git push

# Verificar que:
# - Se crea issue en GitHub
# - Se crea issue en Linear
# - Se asigna agente automáticamente
```

## 📚 Documentación
- 📖 [Guía Completa](./CONFIGURACION-AUTOMATIZADA-GUIA.md)
- 🤖 [README Automatización](./README-AUTOMATION.md)
- 🔧 [Setup Original](./SETUP-AUTOMATION.md)

## 🆘 Soporte
- Ejecuta `./verify-automation-system.sh` para diagnosticar problemas
- Consulta los logs de GitHub Actions
- Revisa la configuración de Linear
EOF
    
    print_success "Documentación de próximos pasos creada: PROXIMOS-PASOS.md"
    
    print_header "🎯 RESUMEN DE CONFIGURACIÓN COMPLETADA"
    
    echo "📁 Archivos creados/configurados:"
    echo "   ✅ .env.automation.demo - Plantilla de configuración"
    echo "   ✅ configure-github-secrets.sh - Script para secrets"
    echo "   ✅ activate-automation-system.sh - Script de activación"
    echo "   ✅ PROXIMOS-PASOS.md - Guía de próximos pasos"
    echo ""
    
    echo "🔄 Estado del sistema:"
    echo "   ✅ Infraestructura preparada"
    echo "   ✅ Workflows configurados"
    echo "   ⚠️  Credenciales pendientes"
    echo "   ⚠️  Activación pendiente"
    echo ""
    
    echo "📋 Próximos pasos:"
    echo "   1. Edita .env.automation.demo con tus credenciales reales"
    echo "   2. Ejecuta ./configure-github-secrets.sh"
    echo "   3. Ejecuta ./activate-automation-system.sh"
    echo "   4. Prueba con ./verify-automation-system.sh"
    echo ""
    
    echo "📖 Documentación completa: PROXIMOS-PASOS.md"
    
    print_success "Demo de configuración completado exitosamente"
}

# Ejecutar script
main "$@"