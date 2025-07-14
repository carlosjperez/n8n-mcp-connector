#!/bin/bash

# 🚀 Script de Configuración Automática del Sistema de Gestión de Errores
# Integración GitHub Actions + Linear

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

# Verificar dependencias
check_dependencies() {
    print_header "Verificando Dependencias"
    
    # Verificar Git
    if command -v git &> /dev/null; then
        print_success "Git instalado"
    else
        print_error "Git no encontrado. Instala Git primero."
        exit 1
    fi
    
    # Verificar GitHub CLI (opcional)
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI instalado"
        GH_CLI_AVAILABLE=true
    else
        print_warning "GitHub CLI no encontrado (opcional)"
        GH_CLI_AVAILABLE=false
    fi
    
    # Verificar curl
    if command -v curl &> /dev/null; then
        print_success "curl instalado"
    else
        print_error "curl no encontrado. Instala curl primero."
        exit 1
    fi
    
    # Verificar que estamos en un repositorio Git
    if git rev-parse --git-dir > /dev/null 2>&1; then
        print_success "Repositorio Git detectado"
    else
        print_error "No estás en un repositorio Git"
        exit 1
    fi
}

# Obtener información del repositorio
get_repo_info() {
    print_header "Información del Repositorio"
    
    REPO_URL=$(git config --get remote.origin.url)
    if [[ $REPO_URL == *"github.com"* ]]; then
        # Extraer owner/repo de la URL
        REPO_PATH=$(echo $REPO_URL | sed 's/.*github\.com[:\/]\([^.]*\).*/\1/')
        REPO_OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
        REPO_NAME=$(echo $REPO_PATH | cut -d'/' -f2)
        
        print_success "Repositorio: $REPO_OWNER/$REPO_NAME"
        print_success "URL: $REPO_URL"
    else
        print_error "Este script solo funciona con repositorios de GitHub"
        exit 1
    fi
}

# Configurar Linear
setup_linear() {
    print_header "Configuración de Linear"
    
    echo "Para configurar Linear, necesitas:"
    echo "1. API Key de Linear"
    echo "2. Team ID de Linear"
    echo "3. Webhook ID (opcional)"
    echo ""
    
    # API Key
    echo -n "Ingresa tu Linear API Key (lin_api_...): "
    read -s LINEAR_API_KEY
    echo ""
    
    if [[ -z "$LINEAR_API_KEY" ]]; then
        print_error "API Key requerido"
        exit 1
    fi
    
    # Verificar API Key
    print_info "Verificando API Key..."
    RESPONSE=$(curl -s -H "Authorization: Bearer $LINEAR_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"query":"{ viewer { id name } }"}' \
        https://api.linear.app/graphql)
    
    if echo "$RESPONSE" | grep -q '"viewer"'; then
        USER_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        print_success "API Key válido - Usuario: $USER_NAME"
    else
        print_error "API Key inválido"
        exit 1
    fi
    
    # Team ID
    echo -n "Ingresa tu Linear Team ID: "
    read LINEAR_TEAM_ID
    
    if [[ -z "$LINEAR_TEAM_ID" ]]; then
        print_error "Team ID requerido"
        exit 1
    fi
    
    # Webhook ID (opcional)
    echo -n "Ingresa tu Linear Webhook ID (opcional, presiona Enter para omitir): "
    read LINEAR_WEBHOOK_ID
    
    print_success "Configuración de Linear completada"
}

# Configurar agentes
setup_agents() {
    print_header "Configuración de Agentes"
    
    echo "Configura los usernames de GitHub para cada tipo de error:"
    echo ""
    
    echo -n "LINT_AGENT_USERNAME (errores de estilo): "
    read LINT_AGENT_USERNAME
    
    echo -n "TEST_AGENT_USERNAME (errores de tests): "
    read TEST_AGENT_USERNAME
    
    echo -n "BUILD_AGENT_USERNAME (errores de build): "
    read BUILD_AGENT_USERNAME
    
    echo -n "DEVOPS_AGENT_USERNAME (errores de CI/CD): "
    read DEVOPS_AGENT_USERNAME
    
    echo -n "DEPLOY_AGENT_USERNAME (errores de deploy): "
    read DEPLOY_AGENT_USERNAME
    
    echo -n "SECURITY_AGENT_USERNAME (errores de seguridad): "
    read SECURITY_AGENT_USERNAME
    
    # Usar defaults si están vacíos
    LINT_AGENT_USERNAME=${LINT_AGENT_USERNAME:-$REPO_OWNER}
    TEST_AGENT_USERNAME=${TEST_AGENT_USERNAME:-$REPO_OWNER}
    BUILD_AGENT_USERNAME=${BUILD_AGENT_USERNAME:-$REPO_OWNER}
    DEVOPS_AGENT_USERNAME=${DEVOPS_AGENT_USERNAME:-$REPO_OWNER}
    DEPLOY_AGENT_USERNAME=${DEPLOY_AGENT_USERNAME:-$REPO_OWNER}
    SECURITY_AGENT_USERNAME=${SECURITY_AGENT_USERNAME:-$REPO_OWNER}
    
    print_success "Agentes configurados"
}

# Configurar NPM (opcional)
setup_npm() {
    print_header "Configuración de NPM (Opcional)"
    
    echo -n "¿Quieres configurar publicación automática en NPM? (y/N): "
    read SETUP_NPM
    
    if [[ $SETUP_NPM =~ ^[Yy]$ ]]; then
        echo -n "Ingresa tu NPM Token: "
        read -s NPM_TOKEN
        echo ""
        
        if [[ -z "$NPM_TOKEN" ]]; then
            print_warning "NPM Token vacío, omitiendo configuración NPM"
            NPM_TOKEN=""
        else
            print_success "NPM Token configurado"
        fi
    else
        NPM_TOKEN=""
        print_info "Configuración NPM omitida"
    fi
}

# Generar comandos para GitHub Secrets
generate_secrets_commands() {
    print_header "Comandos para Configurar GitHub Secrets"
    
    echo "Ejecuta estos comandos para configurar los secrets en GitHub:"
    echo ""
    
    if [[ $GH_CLI_AVAILABLE == true ]]; then
        print_info "Usando GitHub CLI:"
        echo ""
        echo "gh secret set LINEAR_API_KEY --body \"$LINEAR_API_KEY\""
        echo "gh secret set LINEAR_TEAM_ID --body \"$LINEAR_TEAM_ID\""
        
        if [[ -n "$LINEAR_WEBHOOK_ID" ]]; then
            echo "gh secret set LINEAR_WEBHOOK_ID --body \"$LINEAR_WEBHOOK_ID\""
        fi
        
        echo "gh secret set LINT_AGENT_USERNAME --body \"$LINT_AGENT_USERNAME\""
        echo "gh secret set TEST_AGENT_USERNAME --body \"$TEST_AGENT_USERNAME\""
        echo "gh secret set BUILD_AGENT_USERNAME --body \"$BUILD_AGENT_USERNAME\""
        echo "gh secret set DEVOPS_AGENT_USERNAME --body \"$DEVOPS_AGENT_USERNAME\""
        echo "gh secret set DEPLOY_AGENT_USERNAME --body \"$DEPLOY_AGENT_USERNAME\""
        echo "gh secret set SECURITY_AGENT_USERNAME --body \"$SECURITY_AGENT_USERNAME\""
        
        if [[ -n "$NPM_TOKEN" ]]; then
            echo "gh secret set NPM_TOKEN --body \"$NPM_TOKEN\""
        fi
        
        echo ""
        echo -n "¿Quieres que ejecute estos comandos automáticamente? (y/N): "
        read AUTO_SETUP
        
        if [[ $AUTO_SETUP =~ ^[Yy]$ ]]; then
            print_info "Configurando secrets automáticamente..."
            
            gh secret set LINEAR_API_KEY --body "$LINEAR_API_KEY"
            gh secret set LINEAR_TEAM_ID --body "$LINEAR_TEAM_ID"
            
            if [[ -n "$LINEAR_WEBHOOK_ID" ]]; then
                gh secret set LINEAR_WEBHOOK_ID --body "$LINEAR_WEBHOOK_ID"
            fi
            
            gh secret set LINT_AGENT_USERNAME --body "$LINT_AGENT_USERNAME"
            gh secret set TEST_AGENT_USERNAME --body "$TEST_AGENT_USERNAME"
            gh secret set BUILD_AGENT_USERNAME --body "$BUILD_AGENT_USERNAME"
            gh secret set DEVOPS_AGENT_USERNAME --body "$DEVOPS_AGENT_USERNAME"
            gh secret set DEPLOY_AGENT_USERNAME --body "$DEPLOY_AGENT_USERNAME"
            gh secret set SECURITY_AGENT_USERNAME --body "$SECURITY_AGENT_USERNAME"
            
            if [[ -n "$NPM_TOKEN" ]]; then
                gh secret set NPM_TOKEN --body "$NPM_TOKEN"
            fi
            
            print_success "Secrets configurados automáticamente"
        fi
    else
        print_info "Configuración manual (ve a GitHub → Settings → Secrets → Actions):"
        echo ""
        echo "LINEAR_API_KEY = $LINEAR_API_KEY"
        echo "LINEAR_TEAM_ID = $LINEAR_TEAM_ID"
        
        if [[ -n "$LINEAR_WEBHOOK_ID" ]]; then
            echo "LINEAR_WEBHOOK_ID = $LINEAR_WEBHOOK_ID"
        fi
        
        echo "LINT_AGENT_USERNAME = $LINT_AGENT_USERNAME"
        echo "TEST_AGENT_USERNAME = $TEST_AGENT_USERNAME"
        echo "BUILD_AGENT_USERNAME = $BUILD_AGENT_USERNAME"
        echo "DEVOPS_AGENT_USERNAME = $DEVOPS_AGENT_USERNAME"
        echo "DEPLOY_AGENT_USERNAME = $DEPLOY_AGENT_USERNAME"
        echo "SECURITY_AGENT_USERNAME = $SECURITY_AGENT_USERNAME"
        
        if [[ -n "$NPM_TOKEN" ]]; then
            echo "NPM_TOKEN = $NPM_TOKEN"
        fi
    fi
}

# Activar sistema
activate_system() {
    print_header "Activación del Sistema"
    
    echo -n "¿Quieres activar el sistema ahora? (y/N): "
    read ACTIVATE
    
    if [[ $ACTIVATE =~ ^[Yy]$ ]]; then
        print_info "Activando sistema..."
        
        git add .
        git commit -m "feat: activate automated error management system" || true
        git push
        
        print_success "Sistema activado"
        
        echo ""
        echo -n "¿Quieres probar el sistema con un error intencional? (y/N): "
        read TEST_SYSTEM
        
        if [[ $TEST_SYSTEM =~ ^[Yy]$ ]]; then
            print_info "Creando error de prueba..."
            
            echo "// Test error - invalid syntax for testing" >> src/index.ts
            git add .
            git commit -m "test: trigger ci failure for testing"
            git push
            
            print_success "Error de prueba creado. Revisa GitHub Actions y Linear."
        fi
    else
        print_info "Sistema configurado pero no activado. Ejecuta 'git push' cuando estés listo."
    fi
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "🚀 Configuración Automática del Sistema de Gestión de Errores"
    echo "   Integración GitHub Actions + Linear"
    echo -e "${NC}"
    
    check_dependencies
    get_repo_info
    setup_linear
    setup_agents
    setup_npm
    generate_secrets_commands
    activate_system
    
    print_header "Configuración Completada"
    print_success "El sistema está configurado y listo para usar"
    print_info "Consulta CONFIGURACION-AUTOMATIZADA-GUIA.md para más detalles"
    print_info "Repositorio: https://github.com/$REPO_OWNER/$REPO_NAME"
    
    echo ""
    echo "Próximos pasos:"
    echo "1. Verifica que los workflows se ejecuten correctamente"
    echo "2. Revisa Linear para ver los issues creados"
    echo "3. Configura notificaciones adicionales si es necesario"
}

# Ejecutar script
main "$@"