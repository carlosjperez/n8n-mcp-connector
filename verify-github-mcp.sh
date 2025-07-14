#!/bin/bash

# Verify GitHub MCP Server Installation for Zed
# ECO-NAZCAMEDIA - Script de verificación stealth completa

set -e

echo "🔍 ECO-NAZCAMEDIA: Verificando instalación de GitHub MCP..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[VERIFY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Test counter
TESTS_PASSED=0
TESTS_TOTAL=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    ((TESTS_TOTAL++))
    print_test "Ejecutando: $test_name"

    if eval "$test_command" &> /dev/null; then
        print_success "$test_name"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name"
        return 1
    fi
}

echo ""
echo "==================== VERIFICACIÓN SISTEMA ===================="

# Verify Zed installation
run_test "Zed instalado" "command -v zed"

# Verify Node.js and a runner
source "$(dirname "$0")/scripts/detect-runner.sh"
RUNNER=$(detect_runner)
echo "🏃 Runner detectado: $RUNNER"
run_test "Node.js disponible" "command -v node"
run_test "Runner ($RUNNER) disponible" "command -v $RUNNER"

# Verify Docker availability
if command -v docker &> /dev/null && docker info &> /dev/null; then
    print_success "Docker disponible y funcionando"
    ((TESTS_PASSED++))
    DOCKER_AVAILABLE=true
else
    print_warning "Docker no disponible"
    DOCKER_AVAILABLE=false
fi
((TESTS_TOTAL++))

# Check Zed configuration directory
run_test "Directorio de configuración Zed existe" "[ -d '$HOME/.config/zed' ]"

# Check settings file exists
ZED_SETTINGS="$HOME/.config/zed/settings.json"
run_test "Archivo settings.json existe" "[ -f '$ZED_SETTINGS' ]"

echo ""
echo "==================== VERIFICACIÓN CONFIGURACIÓN ===================="

# Extract GitHub token from config
GITHUB_TOKEN=""
if [ -f "$ZED_SETTINGS" ]; then
    # Check for GitHub remote server
    if grep -q "github-remote" "$ZED_SETTINGS"; then
        print_success "Servidor GitHub remoto configurado"
        ((TESTS_PASSED++))
    else
        print_warning "Servidor GitHub remoto NO encontrado"
    fi
    ((TESTS_TOTAL++))

    # Check for GitHub local server
    if grep -q "github-local" "$ZED_SETTINGS"; then
        print_success "Servidor GitHub local configurado"
        ((TESTS_PASSED++))
    else
        print_warning "Servidor GitHub local NO encontrado"
    fi
    ((TESTS_TOTAL++))

    # Check for GitHub Personal Access Token
    if grep -q "GITHUB_PERSONAL_ACCESS_TOKEN" "$ZED_SETTINGS"; then
        print_success "Token de GitHub configurado"
        GITHUB_TOKEN=$(grep -o '"GITHUB_PERSONAL_ACCESS_TOKEN": "[^"]*"' "$ZED_SETTINGS" 2>/dev/null | head -1 | cut -d'"' -f4)
        ((TESTS_PASSED++))
    else
        print_error "Token de GitHub NO configurado"
    fi
    ((TESTS_TOTAL++))

    # Check for mcp-remote command
    if grep -q "mcp-remote" "$ZED_SETTINGS"; then
        print_success "Comando mcp-remote configurado"
        ((TESTS_PASSED++))
    else
        print_warning "Comando mcp-remote NO encontrado"
    fi
    ((TESTS_TOTAL++))

    # Check for GitHub MCP server URL
    if grep -q "https://mcp.github.com/sse" "$ZED_SETTINGS"; then
        print_success "URL del servidor GitHub MCP configurada"
        ((TESTS_PASSED++))
    else
        print_warning "URL del servidor GitHub MCP NO configurada"
    fi
    ((TESTS_TOTAL++))

    # Check for Docker command (if configured)
    if grep -q "ghcr.io/github/github-mcp-server" "$ZED_SETTINGS"; then
        print_success "Imagen Docker de GitHub MCP configurada"
        ((TESTS_PASSED++))
    else
        print_info "Imagen Docker de GitHub MCP NO configurada (opcional)"
    fi
    ((TESTS_TOTAL++))
fi

echo ""
echo "==================== VERIFICACIÓN CONECTIVIDAD ===================="

# Test GitHub API connectivity
if [ -n "$GITHUB_TOKEN" ]; then
    print_test "Conectividad con GitHub API"
    if curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/user" | grep -q "login"; then
        print_success "GitHub API responde correctamente"
        GITHUB_USER=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/user" | grep -o '"login": *"[^"]*"' | cut -d'"' -f4)
        print_info "Usuario autenticado: $GITHUB_USER"
        ((TESTS_PASSED++))
    else
        print_error "GitHub API no responde o token inválido"
    fi
    ((TESTS_TOTAL++))

    # Test GitHub token scopes
    print_test "Verificación de scopes del token"
    TOKEN_SCOPES=$(curl -s -I -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/user" | grep -i "x-oauth-scopes" | cut -d':' -f2 | tr -d ' \r\n')
    if [ -n "$TOKEN_SCOPES" ]; then
        print_success "Token tiene scopes: $TOKEN_SCOPES"
        ((TESTS_PASSED++))
    else
        print_warning "No se pudieron verificar los scopes del token"
    fi
    ((TESTS_TOTAL++))
fi

# Test mcp-remote package availability
print_test "Disponibilidad de mcp-remote"
if $RUNNER -y mcp-remote --help &> /dev/null 2>&1; then
    print_success "mcp-remote responde correctamente"
    ((TESTS_PASSED++))
else
    print_warning "mcp-remote no responde como esperado"
fi
((TESTS_TOTAL++))

# Test GitHub MCP server endpoint
print_test "Conectividad con servidor MCP GitHub"
if curl -s -I "https://mcp.github.com/sse" 2>/dev/null | grep -q "HTTP"; then
    print_success "Servidor MCP GitHub accesible"
    ((TESTS_PASSED++))
else
    print_warning "No se pudo verificar servidor MCP GitHub"
fi
((TESTS_TOTAL++))

# Test Docker image availability (if Docker is available)
if [ "$DOCKER_AVAILABLE" = true ]; then
    print_test "Disponibilidad de imagen Docker GitHub MCP"
    if docker pull ghcr.io/github/github-mcp-server:latest &> /dev/null; then
        print_success "Imagen Docker descargada correctamente"
        ((TESTS_PASSED++))
    else
        print_warning "No se pudo descargar la imagen Docker"
    fi
    ((TESTS_TOTAL++))
fi

echo ""
echo "==================== VERIFICACIÓN ARCHIVOS ===================="

# Check backup files
BACKUP_COUNT=$(ls -1 "$HOME/.config/zed"/settings_backup_*.json 2>/dev/null | wc -l | tr -d ' ')
if [ "$BACKUP_COUNT" -gt 0 ]; then
    print_success "Backups de configuración encontrados ($BACKUP_COUNT)"
    ((TESTS_PASSED++))
else
    print_warning "No se encontraron backups de configuración"
fi
((TESTS_TOTAL++))

# Check if Zed is running
if pgrep -x "Zed" > /dev/null; then
    print_success "Zed está ejecutándose"
    ((TESTS_PASSED++))
else
    print_warning "Zed no está ejecutándose actualmente"
fi
((TESTS_TOTAL++))

# Check configuration file sizes
CONFIG_SIZE=$(stat -f%z "$ZED_SETTINGS" 2>/dev/null || echo "0")
if [ "$CONFIG_SIZE" -gt 500 ]; then
    print_success "Archivo de configuración tiene tamaño adecuado ($CONFIG_SIZE bytes)"
    ((TESTS_PASSED++))
else
    print_warning "Archivo de configuración parece muy pequeño ($CONFIG_SIZE bytes)"
fi
((TESTS_TOTAL++))

# Check JSON syntax
print_test "Sintaxis JSON válida en configuración"
if cat "$ZED_SETTINGS" | python -m json.tool &> /dev/null; then
    print_success "Configuración JSON válida"
    ((TESTS_PASSED++))
else
    print_error "Configuración JSON inválida"
fi
((TESTS_TOTAL++))

echo ""
echo "==================== VERIFICACIÓN FUNCIONAL ===================="

# Check for context_servers section
if grep -q "context_servers" "$ZED_SETTINGS"; then
    print_success "Sección context_servers presente"
    ((TESTS_PASSED++))
else
    print_error "Sección context_servers NO encontrada"
fi
((TESTS_TOTAL++))

# Check for agent configuration
if grep -q '"agent"' "$ZED_SETTINGS"; then
    print_success "Configuración de agent presente"
    ((TESTS_PASSED++))
else
    print_error "Configuración de agent NO encontrada"
fi
((TESTS_TOTAL++))

# Check for enable_all_context_servers
if grep -q "enable_all_context_servers" "$ZED_SETTINGS"; then
    print_success "Context servers habilitados globalmente"
    ((TESTS_PASSED++))
else
    print_warning "Context servers no habilitados globalmente"
fi
((TESTS_TOTAL++))

echo ""
echo "==================== RESULTADOS DE VERIFICACIÓN ===================="

PERCENTAGE=$((TESTS_PASSED * 100 / TESTS_TOTAL))

echo -e "${BLUE}Tests ejecutados:${NC} $TESTS_TOTAL"
echo -e "${GREEN}Tests exitosos:${NC} $TESTS_PASSED"
echo -e "${RED}Tests fallidos:${NC} $((TESTS_TOTAL - TESTS_PASSED))"
echo -e "${PURPLE}Porcentaje de éxito:${NC} $PERCENTAGE%"

echo ""
if [ "$PERCENTAGE" -ge 85 ]; then
    echo -e "${GREEN}✅ INSTALACIÓN VERIFICADA EXITOSAMENTE${NC}"
    echo ""
    echo -e "${BLUE}📋 INSTRUCCIONES DE USO:${NC}"
    echo "1. Abre Zed: open -a Zed"
    echo "2. Presiona Cmd+Shift+P → 'Assistant Panel'"
    echo "3. Verifica que aparezcan los servidores GitHub configurados"
    echo "4. Prueba comandos como:"
    echo "   - 'Muestra mis repositorios de GitHub'"
    echo "   - 'Lista los issues del repositorio actual'"
    echo "   - 'Crea un nuevo archivo en [repo/path]'"
    echo "   - 'Busca repositorios con [término]'"
    echo ""
    echo -e "${YELLOW}🔧 FUNCIONALIDADES DISPONIBLES:${NC}"
    echo "- ✅ Gestión de repositorios y archivos"
    echo "- ✅ Issues y pull requests"
    echo "- ✅ Búsqueda de código"
    echo "- ✅ Gestión de branches"
    echo "- ✅ Code scanning y alertas"

elif [ "$PERCENTAGE" -ge 70 ]; then
    echo -e "${YELLOW}⚠️  INSTALACIÓN FUNCIONAL CON WARNINGS${NC}"
    echo "La mayoría de funcionalidades están disponibles."
    echo "Revisa los warnings para optimizar la configuración."

else
    echo -e "${RED}❌ INSTALACIÓN CON PROBLEMAS CRÍTICOS${NC}"
    echo "La instalación requiere correcciones antes de ser usable."
    echo "Ejecuta nuevamente: ./install-github-mcp.sh"
fi

echo ""
echo -e "${CYAN}🔍 INFORMACIÓN DEL SISTEMA:${NC}"
if [ -n "$GITHUB_USER" ]; then
    echo "- Usuario GitHub: $GITHUB_USER"
fi
if [ -n "$TOKEN_SCOPES" ]; then
    echo "- Scopes del token: $TOKEN_SCOPES"
fi
echo "- Docker disponible: $DOCKER_AVAILABLE"
echo "- Configuración: $ZED_SETTINGS"

echo ""
echo -e "${BLUE}🛠️ COMANDOS ÚTILES:${NC}"
echo "- Reinstalar: ./install-github-mcp.sh"
echo "- Reiniciar Zed: killall Zed && open -a Zed"
echo "- Ver configuración: cat ~/.config/zed/settings.json"
echo "- Test API manual: curl -H \"Authorization: token \$GITHUB_TOKEN\" https://api.github.com/user"
echo "- Ver logs Zed: tail -f ~/Library/Logs/Zed/Zed.log"

echo ""
echo -e "${GREEN}🎯 VERIFICACIÓN GITHUB MCP COMPLETADA${NC}"
