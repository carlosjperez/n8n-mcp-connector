#!/bin/bash

# GitHub Repository Creation Script
# Run this script to create and push to GitHub

REPO_NAME="n8n-mcp-connector"
GITHUB_USERNAME="carlosjperez"  # Replace with your GitHub username

echo "🚀 Creating GitHub repository: $REPO_NAME"

# Initialize git repository
git init
git add .
git commit -m "Initial commit: N8N MCP Connector implementation"

# Create GitHub repository (requires GitHub CLI)
if command -v gh &> /dev/null; then
    echo "📝 Creating repository on GitHub..."
    gh repo create $REPO_NAME --public --description "Advanced Model Context Protocol server for n8n workflow automation"
    
    # Set remote and push
    git branch -M main
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
    git push -u origin main
    
    echo "✅ Repository created successfully!"
    echo "🔗 https://github.com/$GITHUB_USERNAME/$REPO_NAME"
else
    echo "⚠️  GitHub CLI not found. Manual steps:"
    echo "1. Create repository on GitHub: https://github.com/new"
    echo "2. Run these commands:"
    echo "   git branch -M main"
    echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "   git push -u origin main"
fi
