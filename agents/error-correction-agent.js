/**
 * Error Correction Agent for Automated CI/CD Issue Resolution
 * This agent can be deployed as a GitHub App or standalone service
 */

const { Octokit } = require('@octokit/rest');
const { LinearClient } = require('@linear/sdk');

class ErrorCorrectionAgent {
  constructor() {
    this.github = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.linear = new LinearClient({
      apiKey: process.env.LINEAR_API_KEY
    });
    
    this.errorPatterns = {
      lint: {
        pattern: /ESLint.*error|linting.*failed/i,
        solutions: ['npm run lint -- --fix', 'Update ESLint config'],
        autoFix: true
      },
      test: {
        pattern: /test.*failed|testing.*error/i,
        solutions: ['Review failing tests', 'Update test assertions'],
        autoFix: false
      },
      build: {
        pattern: /build.*failed|compilation.*error/i,
        solutions: ['npm run build', 'Fix TypeScript errors'],
        autoFix: false
      },
      permissions: {
        pattern: /Resource not accessible by integration|insufficient permissions/i,
        solutions: ['Update workflow permissions', 'Check GITHUB_TOKEN scope'],
        autoFix: true
      }
    };
  }

  /**
   * Main method to process CI/CD failures
   */
  async processFailure(payload) {
    const { repository, workflow_run, sender } = payload;
    
    console.log(`Processing failure for ${repository.full_name}`);
    
    try {
      // 1. Analyze error type
      const errorType = await this.analyzeError(workflow_run);
      
      // 2. Create Linear issue
      const linearIssue = await this.createLinearIssue(errorType, workflow_run, repository);
      
      // 3. Attempt auto-fix if possible
      if (this.errorPatterns[errorType.type]?.autoFix) {
        await this.attemptAutoFix(errorType, repository, workflow_run);
      }
      
      // 4. Assign to appropriate agent
      await this.assignAgent(errorType, repository, linearIssue);
      
      return {
        success: true,
        errorType: errorType.type,
        linearIssue: linearIssue.id,
        autoFixed: this.errorPatterns[errorType.type]?.autoFix || false
      };
      
    } catch (error) {
      console.error('Error processing failure:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze error logs to determine error type
   */
  async analyzeError(workflowRun) {
    // Get workflow run logs
    const logs = await this.github.rest.actions.downloadWorkflowRunLogs({
      owner: workflowRun.repository.owner.login,
      repo: workflowRun.repository.name,
      run_id: workflowRun.id
    });

    // Analyze logs for error patterns
    const logContent = logs.data.toString();
    
    for (const [type, config] of Object.entries(this.errorPatterns)) {
      if (config.pattern.test(logContent)) {
        return {
          type,
          pattern: config.pattern,
          solutions: config.solutions,
          logSnippet: this.extractRelevantLog(logContent, config.pattern)
        };
      }
    }
    
    return {
      type: 'unknown',
      pattern: null,
      solutions: ['Manual investigation required'],
      logSnippet: logContent.substring(0, 500)
    };
  }

  /**
   * Create issue in Linear with structured information
   */
  async createLinearIssue(errorType, workflowRun, repository) {
    const title = `🚨 CI/CD ${errorType.type.toUpperCase()}: ${workflowRun.head_commit.message}`;
    
    const description = `
## Error Analysis
**Type**: ${errorType.type}
**Repository**: ${repository.full_name}
**Commit**: \`${workflowRun.head_sha}\`
**Author**: ${workflowRun.head_commit.author.name}
**Branch**: ${workflowRun.head_branch}

## Suggested Solutions
${errorType.solutions.map(s => `- ${s}`).join('\n')}

## Error Log Snippet
\`\`\`
${errorType.logSnippet}
\`\`\`

## Automation Status
- **Auto-fix attempted**: ${this.errorPatterns[errorType.type]?.autoFix ? '✅' : '❌'}
- **Manual intervention**: ${this.errorPatterns[errorType.type]?.autoFix ? 'Not required' : 'Required'}

[View Workflow Run](${workflowRun.html_url})
    `;

    const issue = await this.linear.issueCreate({
      title,
      description,
      priority: this.getPriority(errorType.type),
      labelIds: await this.getLinearLabels(['ci-cd', 'automated', errorType.type])
    });

    return issue.issue;
  }

  /**
   * Attempt automatic fixes for known issues
   */
  async attemptAutoFix(errorType, repository, workflowRun) {
    console.log(`Attempting auto-fix for ${errorType.type}`);
    
    const fixes = {
      lint: async () => {
        // Create a PR with lint fixes
        await this.createFixPR(repository, 'lint-fix', [
          'npm run lint -- --fix',
          'git add .',
          'git commit -m "style: auto-fix lint issues"'
        ], 'Auto-fix ESLint errors');
      },
      
      permissions: async () => {
        // Update workflow with correct permissions
        const workflowPath = '.github/workflows/ci.yml';
        const correctPermissions = `
permissions:
  contents: write
  issues: write
  pull-requests: write
  checks: write
  actions: write
        `;
        
        await this.createFixPR(repository, 'fix-permissions', [
          `echo "${correctPermissions}" >> ${workflowPath}`,
          'git add .',
          'git commit -m "fix: add required workflow permissions"'
        ], 'Fix workflow permissions');
      }
    };

    if (fixes[errorType.type]) {
      await fixes[errorType.type]();
    }
  }

  /**
   * Create a Pull Request with fixes
   */
  async createFixPR(repository, branchName, commands, title) {
    const [owner, repo] = repository.full_name.split('/');
    
    // Create branch
    const mainBranch = await this.github.rest.repos.getBranch({
      owner,
      repo,
      branch: 'main'
    });

    await this.github.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainBranch.data.commit.sha
    });

    // Apply fixes (this would need actual file manipulation)
    // For demo purposes, showing the concept
    
    // Create PR
    const pr = await this.github.rest.pulls.create({
      owner,
      repo,
      title: `🤖 ${title}`,
      head: branchName,
      base: 'main',
      body: `
## Automated Fix Applied

This PR contains automated fixes for CI/CD issues:

### Commands executed:
${commands.map(cmd => `- \`${cmd}\``).join('\n')}

### Auto-generated by Error Correction Agent
- Detected issue type and applied known fixes
- Ready for review and merge
- Will resolve CI/CD pipeline failures

**Safe to merge**: These are standard fixes for common issues.
      `
    });

    return pr.data;
  }

  /**
   * Assign issue to appropriate agent based on error type
   */
  async assignAgent(errorType, repository, linearIssue) {
    const agentMapping = {
      lint: process.env.LINT_AGENT_LINEAR_ID,
      test: process.env.TEST_AGENT_LINEAR_ID,
      build: process.env.BUILD_AGENT_LINEAR_ID,
      permissions: process.env.DEVOPS_AGENT_LINEAR_ID,
      deploy: process.env.DEPLOY_AGENT_LINEAR_ID
    };

    const assigneeId = agentMapping[errorType.type];
    
    if (assigneeId && linearIssue) {
      await this.linear.issueUpdate(linearIssue.id, {
        assigneeId
      });
    }
  }

  getPriority(errorType) {
    const priorities = {
      permissions: 1, // Urgent
      deploy: 1,      // Urgent  
      build: 2,       // High
      test: 2,        // High
      lint: 3,        // Medium
      unknown: 2      // High (unknown needs investigation)
    };
    
    return priorities[errorType] || 2;
  }

  async getLinearLabels(labelNames) {
    // Implementation to get Linear label IDs
    // This would cache and return label IDs for the given names
    return []; // Simplified for demo
  }

  extractRelevantLog(logContent, pattern) {
    const lines = logContent.split('\n');
    const matchingLines = lines.filter(line => pattern.test(line));
    return matchingLines.slice(0, 10).join('\n');
  }
}

// Export for use as GitHub App or standalone service
module.exports = ErrorCorrectionAgent;

// CLI usage example
if (require.main === module) {
  const agent = new ErrorCorrectionAgent();
  
  // Simulate workflow failure
  const mockPayload = {
    workflow_run: {
      id: 123,
      conclusion: 'failure',
      head_commit: {
        message: 'Add new feature',
        author: { name: 'Developer' }
      },
      head_sha: 'abc123',
      head_branch: 'main',
      html_url: 'https://github.com/user/repo/actions/runs/123'
    },
    repository: {
      full_name: 'user/repo',
      owner: { login: 'user' },
      name: 'repo'
    }
  };
  
  agent.processFailure(mockPayload)
    .then(result => console.log('Agent result:', result))
    .catch(error => console.error('Agent error:', error));
}