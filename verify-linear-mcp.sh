#!/bin/bash

# Verify Linear MCP Server Installation for Zed
# ECO-NAZCAMEDIA - Script de verificación stealth

set -e

echo "🔍 ECO-NAZCAMEDIA: Verificando instalación de Linear MCP..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
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

# Check Zed configuration directory
run_test "Directorio de configuración Zed existe" "[ -d '$HOME/.config/zed' ]"

# Check settings file exists
ZED_SETTINGS="$HOME/.config/zed/settings.json"
run_test "Archivo settings.json existe" "[ -f '$ZED_SETTINGS' ]"

echo ""
echo "==================== VERIFICACIÓN CONFIGURACIÓN ===================="

# Check if Linear MCP server is configured
if [ -f "$ZED_SETTINGS" ]; then
    if grep -q "linear-official" "$ZED_SETTINGS"; then
        print_success "Servidor Linear MCP configurado en settings.json"
        ((TESTS_PASSED++))
    else
        print_error "Servidor Linear MCP NO encontrado en settings.json"
    fi
    ((TESTS_TOTAL++))

    if grep -q "LINEAR_API_KEY" "$ZED_SETTINGS"; then
        print_success "API Key de Linear configurada"
        ((TESTS_PASSED++))
    else
        print_error "API Key de Linear NO configurada"
    fi
    ((TESTS_TOTAL++))

    if grep -q "mcp-remote" "$ZED_SETTINGS"; then
        print_success "Comando mcp-remote configurado"
        ((TESTS_PASSED++))
    else
        print_error "Comando mcp-remote NO configurado"
    fi
    ((TESTS_TOTAL++))

    if grep -q "https://mcp.linear.app/sse" "$ZED_SETTINGS"; then
        print_success "URL del servidor Linear oficial configurada"
        ((TESTS_PASSED++))
    else
        print_error "URL del servidor Linear oficial NO configurada"
    fi
    ((TESTS_TOTAL++))
fi

echo ""
echo "==================== VERIFICACIÓN CONECTIVIDAD ===================="

# Test mcp-remote package availability
print_test "Disponibilidad de mcp-remote"
if $RUNNER -y mcp-remote --help &> /dev/null; then
    print_success "mcp-remote responde correctamente"
    ((TESTS_PASSED++))
else
    print_warning "mcp-remote no responde como esperado"
fi
((TESTS_TOTAL++))

# Test Linear API connectivity
LINEAR_API_KEY=$(grep -o '"LINEAR_API_KEY": "[^"]*"' "$ZED_SETTINGS" 2>/dev/null | cut -d'"' -f4)
if [ -n "$LINEAR_API_KEY" ]; then
    print_test "Conectividad con Linear API"
    if curl -s -H "Authorization: $LINEAR_API_KEY" "https://api.linear.app/graphql" \
       -H "Content-Type: application/json" \
       -d '{"query":"{ viewer { id name } }"}' | grep -q "data"; then
        print_success "Linear API responde correctamente"
        ((TESTS_PASSED++))
    else
        print_error "Linear API no responde o API key inválida"
    fi
    ((TESTS_TOTAL++))
fi

# Test Linear endpoint connectivity
print_test "Conectividad con servidor MCP Linear"
if curl -s -I "https://mcp.linear.app/sse" | grep -q "200"; then
    print_success "Servidor MCP Linear accesible"
    ((TESTS_PASSED++))
else
    print_warning "No se pudo verificar servidor MCP Linear"
fi
((TESTS_TOTAL++))

echo ""
echo "==================== VERIFICACIÓN ARCHIVOS ===================="

# Check backup files
BACKUP_COUNT=$(ls -1 "$HOME/.config/zed"/settings_backup_*.json 2>/dev/null | wc -l)
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

echo ""
echo "==================== RESULTADOS DE VERIFICACIÓN ===================="

PERCENTAGE=$((TESTS_PASSED * 100 / TESTS_TOTAL))

echo -e "${BLUE}Tests ejecutados:${NC} $TESTS_TOTAL"
echo -e "${GREEN}Tests exitosos:${NC} $TESTS_PASSED"
echo -e "${RED}Tests fallidos:${NC} $((TESTS_TOTAL - TESTS_PASSED))"
echo -e "${PURPLE}Porcentaje de éxito:${NC} $PERCENTAGE%"

echo ""
if [ "$PERCENTAGE" -ge 80 ]; then
    echo -e "${GREEN}✅ INSTALACIÓN VERIFICADA EXITOSAMENTE${NC}"
    echo ""
    echo -e "${BLUE}📋 INSTRUCCIONES DE USO:${NC}"
    echo "1. Abre Zed (si no está abierto): open -a Zed"
    echo "2. Presiona Cmd+Shift+P para abrir command palette"
    echo "3. Busca 'Assistant Panel' y selecciónalo"
    echo "4. En el panel del asistente, verifica que 'linear-official' aparezca"
    echo "5. Prueba comandos como:"
    echo "   - 'Muéstrame mis issues de Linear'"
    echo "   - 'Crea un nuevo issue en Linear'"
    echo "   - 'Lista los proyectos de Linear'"
    echo ""
    echo -e "${YELLOW}🔧 COMANDOS ÚTILES:${NC}"
    echo "- Reiniciar Zed: killall Zed && open -a Zed"
    echo "- Ver logs de Zed: tail -f ~/Library/Logs/Zed/Zed.log"
    echo "- Backup manual: cp ~/.config/zed/settings.json ./settings-backup.json"

elif [ "$PERCENTAGE" -ge 60 ]; then
    echo -e "${YELLOW}⚠️  INSTALACIÓN PARCIALMENTE FUNCIONAL${NC}"
    echo "Algunos componentes pueden no funcionar correctamente."
    echo "Revisa los errores anteriores y ejecuta nuevamente la instalación."

else
    echo -e "${RED}❌ INSTALACIÓN CON PROBLEMAS CRÍTICOS${NC}"
    echo "La instalación requiere correcciones antes de ser usable."
    echo "Ejecuta nuevamente ./install-linear-mcp.sh"
fi

echo ""
echo -e "${BLUE}🔍 Para diagnóstico adicional:${NC}"
echo "- Configuración actual: cat ~/.config/zed/settings.json"
echo "- Verificar permisos: ls -la ~/.config/zed/"
echo "- Test API manual: curl -H \"Authorization: \$LINEAR_API_KEY\" https://api.linear.app/graphql"

echo ""
echo -e "${GREEN}🎯 VERIFICACIÓN COMPLETADA${NC}"
