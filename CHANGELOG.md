# Changelog

All notable changes to the N8N MCP Connector will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-01-13

### Added
- Universal installation scripts for multiple AI agents
- Automatic agent detection and configuration
- Support for Cursor (VS Code AI) with optimized configuration
- Continue.dev integration with custom commands and context providers
- Codeium support with MCP server configuration
- Interactive installation mode with agent selection
- Comprehensive AI agents documentation (AI-AGENTS-SETUP.md)
- Agent-specific configuration files in configs/ directory
- One-line installation commands for all supported agents
- Docker configuration examples for portable deployment

### New Installation Scripts
- `install-cursor.sh` - Multi-agent installation with method selection
- `install-universal.sh` - Automatic agent detection and configuration
- `quick-install-agents.sh` - Quick commands and interactive mode
- Agent-specific configurations for optimal performance

### Enhanced Documentation
- AI-AGENTS-SETUP.md with practical examples and troubleshooting
- Agent-specific configuration examples and usage patterns
- Docker Compose configurations for development
- Comprehensive troubleshooting guide for common issues

### Supported AI Agents
- Cursor (VS Code AI) - Full MCP integration
- Claude Desktop - NPM Global and MCP.so methods
- Continue.dev - Context providers and custom commands
- Codeium - MCP server configuration
- Universal NPM installation for any MCP-compatible agent

## [1.1.0] - 2025-01-13

### Added
- Enhanced error handling with detailed context and logging
- Input validation for all tool parameters
- Duration calculations for workflow executions
- Comprehensive error reporting with timestamps
- Detailed webhook creation instructions with test commands
- Proper TypeScript error handling with type safety
- Execution limit capping to prevent overwhelming responses (max 50)
- Enhanced activate_workflow feedback with success messages

### Changed
- **BREAKING**: Optimized response formats for all tools - now return concise summaries instead of raw data
- `list_workflows` now returns structured summary with total count and workflow metadata
- `get_workflow` now returns structured summary with node information and connection counts
- `list_executions` now returns enhanced summary with duration and status calculations
- `get_execution_status` now returns structured summary with duration and status
- `execute_workflow` now returns structured execution result with timeout detection
- `activate_workflow` now returns structured result with success confirmation
- `create_webhook` now returns detailed instructions and test commands

### Fixed
- Query parameter handling for `list_workflows` (removed invalid JSON filter approach)
- TypeScript compilation errors related to error handling
- Response format consistency across all tools
- Error message clarity and debugging information

### Technical Improvements
- Better error context with HTTP status codes and timestamps
- Consistent JSON response formatting across all tools
- Enhanced logging for debugging purposes
- Improved parameter validation and error messages
- More robust error handling for network and API issues

## [1.0.0] - 2025-01-13

### Added
- Initial release of N8N MCP Connector
- Support for all major n8n workflow operations
- NPM package publication and global installation
- Claude Desktop integration configurations
- Comprehensive documentation and installation guides
- Remote deployment options (NPM Global, MCP.so)
- Authentication support for n8n Cloud and self-hosted instances

### Tools Included
- `execute_workflow` - Execute workflows with optional completion waiting
- `list_workflows` - List all available workflows with filtering
- `get_workflow` - Get detailed workflow information
- `get_execution_status` - Check execution status and results
- `list_executions` - List recent workflow executions
- `activate_workflow` - Activate or deactivate workflows
- `create_webhook` - Generate webhook URLs for workflows

### Documentation
- README.md with comprehensive setup instructions
- DEPLOYMENT-GUIDE.md for deployment strategies
- MCP-INSTALLATION.md for MCP-specific setup
- REMOTE-USAGE.md for remote usage instructions
- Multiple Claude Desktop configuration examples

### Infrastructure
- Automated build and deployment scripts
- NPM package optimization
- GitHub repository setup
- Continuous integration preparation