#!/bin/bash

# N8N MCP Connector - Installation Script
# Configures the MCP server for Claude Desktop integration

echo "🚀 Installing N8N MCP Connector for Claude Desktop..."

# Check if Claude Desktop config directory exists
CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "📁 Creating Claude Desktop config directory..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

# Get current directory
CURRENT_DIR=$(pwd)

# Create or update Claude Desktop configuration
echo "⚙️  Configuring Claude Desktop..."

if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "📋 Backing up existing configuration..."
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create the configuration
cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "n8n-workflows": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "$CURRENT_DIR",
      "env": {
        "N8N_BASE_URL": "http://localhost:5678",
        "N8N_USERNAME": "admin",
        "N8N_PASSWORD": "admin"
      }
    }
  }
}
EOF

echo "✅ Configuration completed!"
echo ""
echo "📝 Next steps:"
echo "1. Make sure your n8n instance is running on http://localhost:5678"
echo "2. Update the credentials in: $CLAUDE_CONFIG_FILE"
echo "3. Restart Claude Desktop"
echo "4. The n8n-workflows tools will be available in Claude"
echo ""
echo "🔧 Available tools:"
echo "  - execute_workflow: Execute n8n workflows"
echo "  - list_workflows: List available workflows"
echo "  - get_workflow: Get workflow details"
echo "  - get_execution_status: Check execution status"
echo "  - list_executions: View execution history"
echo "  - activate_workflow: Enable/disable workflows"
echo "  - create_webhook: Generate webhook URLs"
echo ""
echo "📖 For more information, see: README.md"