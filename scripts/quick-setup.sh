#!/bin/bash

echo "🔧 N8N MCP Connector - Quick Setup"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env from example
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file - please configure your n8n credentials"
fi

# Build project
echo "🏗️  Building project..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env with your n8n credentials"
echo "2. Run 'npm start' to start the MCP server"
echo "3. Configure Claude Desktop with the MCP server"
echo ""
echo "For GitHub deployment:"
echo "1. Edit scripts/create-github-repo.sh with your username"
echo "2. Run './scripts/create-github-repo.sh'"
