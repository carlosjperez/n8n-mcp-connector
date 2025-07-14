#!/bin/bash

# Función para detectar el mejor ejecutor de paquetes disponible.
# El orden de prioridad es: uvx > npx > npm.
# Si no se encuentra ninguno, devuelve "npx" como fallback seguro.
detect_runner() {
  if command -v uvx &> /dev/null; then
    echo "uvx"
  elif command -v npx &> /dev/null; then
    echo "npx"
  elif command -v npm &> /dev/null; then
    echo "npm"
  else
    echo "npx" # Failsafe
  fi
}
