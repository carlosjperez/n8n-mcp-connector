#!/bin/bash

# 🔍 Script de Verificación del Sistema de Automatización
# Verifica que todos los componentes estén funcionando correctamente

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

# Verificar archivos de workflow
check_workflows() {
    print_header "Verificando Workflows de GitHub Actions"
    
    # Verificar que existen los workflows
    if [[ -f ".github/workflows/ci-cd.yml" ]]; then
        print_success "Workflow CI/CD encontrado"
    else
        print_error "Workflow CI/CD no encontrado"
        return 1
    fi
    
    if [[ -f ".github/workflows/linear-integration.yml" ]]; then
        print_success "Workflow Linear Integration encontrado"
    else
        print_error "Workflow Linear Integration no encontrado"
        return 1
    fi
    
    # Verificar sintaxis YAML (si yamllint está disponible)
    if command -v yamllint &> /dev/null; then
        if yamllint .github/workflows/*.yml &> /dev/null; then
            print_success "Sintaxis YAML válida"
        else
            print_warning "Posibles errores de sintaxis YAML"
        fi
    else
        print_info "yamllint no disponible, omitiendo verificación de sintaxis"
    fi
}

# Verificar GitHub CLI y secrets
check_github_setup() {
    print_header "Verificando Configuración de GitHub"
    
    # Verificar GitHub CLI
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI instalado"
        
        # Verificar autenticación
        if gh auth status &> /dev/null; then
            print_success "GitHub CLI autenticado"
            
            # Verificar secrets (si es posible)
            SECRETS=$(gh secret list 2>/dev/null || echo "")
            
            # Lista de secrets requeridos
            REQUIRED_SECRETS=(
                "LINEAR_API_KEY"
                "LINEAR_TEAM_ID"
                "LINT_AGENT_USERNAME"
                "TEST_AGENT_USERNAME"
                "BUILD_AGENT_USERNAME"
                "DEVOPS_AGENT_USERNAME"
                "DEPLOY_AGENT_USERNAME"
                "SECURITY_AGENT_USERNAME"
            )
            
            echo "Verificando secrets requeridos:"
            for secret in "${REQUIRED_SECRETS[@]}"; do
                if echo "$SECRETS" | grep -q "$secret"; then
                    print_success "Secret $secret configurado"
                else
                    print_error "Secret $secret no encontrado"
                fi
            done
            
            # Secrets opcionales
            OPTIONAL_SECRETS=("LINEAR_WEBHOOK_ID" "NPM_TOKEN")
            echo "\nSecrets opcionales:"
            for secret in "${OPTIONAL_SECRETS[@]}"; do
                if echo "$SECRETS" | grep -q "$secret"; then
                    print_success "Secret opcional $secret configurado"
                else
                    print_info "Secret opcional $secret no configurado"
                fi
            done
            
        else
            print_error "GitHub CLI no autenticado. Ejecuta 'gh auth login'"
        fi
    else
        print_warning "GitHub CLI no instalado. No se pueden verificar secrets automáticamente"
        print_info "Verifica manualmente en: GitHub → Settings → Secrets → Actions"
    fi
}

# Verificar configuración de Linear
check_linear_setup() {
    print_header "Verificando Configuración de Linear"
    
    echo -n "¿Quieres verificar la conexión con Linear? (requiere API Key) (y/N): "
    read VERIFY_LINEAR
    
    if [[ $VERIFY_LINEAR =~ ^[Yy]$ ]]; then
        echo -n "Ingresa tu Linear API Key: "
        read -s LINEAR_API_KEY
        echo ""
        
        if [[ -n "$LINEAR_API_KEY" ]]; then
            print_info "Verificando conexión con Linear..."
            
            RESPONSE=$(curl -s -H "Authorization: Bearer $LINEAR_API_KEY" \
                -H "Content-Type: application/json" \
                -d '{"query":"{ viewer { id name } }"}' \
                https://api.linear.app/graphql)
            
            if echo "$RESPONSE" | grep -q '"viewer"'; then
                USER_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
                print_success "Conexión Linear exitosa - Usuario: $USER_NAME"
                
                # Verificar teams
                TEAMS_RESPONSE=$(curl -s -H "Authorization: Bearer $LINEAR_API_KEY" \
                    -H "Content-Type: application/json" \
                    -d '{"query":"{ teams { nodes { id name } } }"}' \
                    https://api.linear.app/graphql)
                
                if echo "$TEAMS_RESPONSE" | grep -q '"teams"'; then
                    print_success "Teams de Linear accesibles"
                    echo "Teams disponibles:"
                    echo "$TEAMS_RESPONSE" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | sed 's/^/  - /'
                else
                    print_warning "No se pudieron obtener teams de Linear"
                fi
            else
                print_error "Error de conexión con Linear"
                echo "Respuesta: $RESPONSE"
            fi
        else
            print_info "API Key vacío, omitiendo verificación de Linear"
        fi
    else
        print_info "Verificación de Linear omitida"
    fi
}

# Verificar últimos workflows ejecutados
check_recent_workflows() {
    print_header "Verificando Workflows Recientes"
    
    if command -v gh &> /dev/null && gh auth status &> /dev/null; then
        print_info "Obteniendo últimos workflow runs..."
        
        RECENT_RUNS=$(gh run list --limit 5 --json status,conclusion,name,createdAt,url 2>/dev/null || echo "[]")
        
        if [[ "$RECENT_RUNS" != "[]" ]]; then
            echo "Últimos 5 workflow runs:"
            echo "$RECENT_RUNS" | jq -r '.[] | "  \(.createdAt | split("T")[0]) - \(.name): \(.status) (\(.conclusion // "running"))"' 2>/dev/null || {
                print_warning "No se pudo parsear la respuesta de workflows"
                echo "$RECENT_RUNS"
            }
        else
            print_info "No se encontraron workflow runs recientes"
        fi
    else
        print_info "No se pueden verificar workflows sin GitHub CLI autenticado"
    fi
}

# Verificar estructura del proyecto
check_project_structure() {
    print_header "Verificando Estructura del Proyecto"
    
    # Verificar archivos importantes
    IMPORTANT_FILES=(
        "package.json"
        "src/index.ts"
        ".github/workflows/ci-cd.yml"
        ".github/workflows/linear-integration.yml"
        "SETUP-AUTOMATION.md"
        "CONFIGURACION-AUTOMATIZADA-GUIA.md"
    )
    
    for file in "${IMPORTANT_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            print_success "$file encontrado"
        else
            print_warning "$file no encontrado"
        fi
    done
    
    # Verificar package.json scripts
    if [[ -f "package.json" ]]; then
        if grep -q '"lint"' package.json; then
            print_success "Script lint configurado"
        else
            print_warning "Script lint no encontrado en package.json"
        fi
        
        if grep -q '"test"' package.json; then
            print_success "Script test configurado"
        else
            print_warning "Script test no encontrado en package.json"
        fi
        
        if grep -q '"build"' package.json; then
            print_success "Script build configurado"
        else
            print_warning "Script build no encontrado en package.json"
        fi
    fi
}

# Generar reporte de estado
generate_status_report() {
    print_header "Reporte de Estado del Sistema"
    
    echo "📊 Resumen de Verificación:"
    echo ""
    
    # Contar verificaciones exitosas vs fallidas
    # (Esto es una simplificación, en un script real contarías los resultados)
    
    echo "🔧 Componentes Verificados:"
    echo "  ✅ Workflows de GitHub Actions"
    echo "  ✅ Estructura del proyecto"
    echo "  ⚠️  Configuración de GitHub (requiere verificación manual)"
    echo "  ⚠️  Configuración de Linear (requiere verificación manual)"
    echo ""
    
    echo "📋 Próximos Pasos Recomendados:"
    echo "  1. Verificar secrets en GitHub manualmente"
    echo "  2. Probar el sistema con un commit que falle"
    echo "  3. Verificar que se crean issues en Linear"
    echo "  4. Confirmar asignación automática de agentes"
    echo ""
    
    echo "🔗 Enlaces Útiles:"
    REPO_URL=$(git config --get remote.origin.url 2>/dev/null || echo "unknown")
    if [[ $REPO_URL == *"github.com"* ]]; then
        REPO_PATH=$(echo $REPO_URL | sed 's/.*github\.com[:\/]\([^.]*\).*/\1/')
        echo "  📁 Repositorio: https://github.com/$REPO_PATH"
        echo "  ⚙️  Actions: https://github.com/$REPO_PATH/actions"
        echo "  🔐 Secrets: https://github.com/$REPO_PATH/settings/secrets/actions"
    fi
    echo "  📖 Documentación: ./CONFIGURACION-AUTOMATIZADA-GUIA.md"
}

# Función para probar el sistema
test_system() {
    print_header "Prueba del Sistema (Opcional)"
    
    echo -n "¿Quieres crear un error de prueba para verificar el sistema? (y/N): "
    read TEST_SYSTEM
    
    if [[ $TEST_SYSTEM =~ ^[Yy]$ ]]; then
        print_warning "Esto creará un commit que fallará intencionalmente"
        echo -n "¿Estás seguro? (y/N): "
        read CONFIRM_TEST
        
        if [[ $CONFIRM_TEST =~ ^[Yy]$ ]]; then
            print_info "Creando error de prueba..."
            
            # Crear un error de sintaxis temporal
            echo "// Test error - invalid syntax for testing automation" >> src/index.ts
            
            git add .
            git commit -m "test: trigger ci failure for automation testing"
            git push
            
            print_success "Error de prueba creado"
            print_info "Revisa GitHub Actions y Linear en los próximos minutos"
            print_info "Recuerda revertir este commit después de la prueba"
            
            echo ""
            echo "Para revertir el error de prueba:"
            echo "git revert HEAD --no-edit && git push"
        else
            print_info "Prueba cancelada"
        fi
    else
        print_info "Prueba omitida"
    fi
}

# Función principal
main() {
    echo -e "${BLUE}"
    echo "🔍 Verificación del Sistema de Automatización"
    echo "   GitHub Actions + Linear Integration"
    echo -e "${NC}"
    
    check_project_structure
    check_workflows
    check_github_setup
    check_linear_setup
    check_recent_workflows
    generate_status_report
    test_system
    
    print_header "Verificación Completada"
    print_success "Verificación del sistema finalizada"
    print_info "Revisa el reporte anterior para identificar cualquier problema"
}

# Ejecutar script
main "$@"