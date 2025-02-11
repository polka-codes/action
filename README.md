# Polka Codes GitHub Action

[![Polka Codes](https://img.shields.io/badge/Powered%20by-Polka%20Codes-purple)](https://github.com/polka-codes/polka-codes)

A GitHub Action that integrates with [Polka Codes](https://github.com/polka-codes/polka-codes) to analyze code and provide automated feedback through GitHub issues and pull requests. This action enables seamless code analysis, generation, and review automation in your GitHub workflows.

## Overview

This action allows you to:
- Process GitHub issues and pull requests using Polka Codes
- Apply custom code analysis rules and configurations
- Generate automated code improvements and suggestions
- Create pull requests with proposed changes

## How It Works

The action follows a structured workflow to process tasks and generate code changes:

1. **Task Acquisition**
   - Fetches task description from issues or pull requests using GitHub API
   - Supports direct task input through workflow dispatch
   - Validates inputs to ensure proper task context

2. **Branch Management**
   - For new tasks: Creates a new branch with format `polka/task-{timestamp}`
   - For PRs: Checks out the existing PR branch
   - Ensures isolated work environment for each task

3. **Task Processing**
   - Executes Polka Codes CLI with provided configuration
   - Applies custom rules and conventions from `.polkacodes.yml`
   - Generates code changes based on task requirements

4. **Change Management**
   - Automatically stages and commits changes
   - Pushes to the appropriate branch
   - Creates or updates pull requests
   - Links PRs to original issues when applicable

## Installation

Add the action to your GitHub workflow:

```yaml
- uses: polka-codes/action@v1
  with:
    # Configure inputs based on your needs
    issue_number: ${{ github.event.issue.number }}
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

## Configuration

### Required Environment Variables

- `GITHUB_TOKEN`: GitHub token for API access (automatically provided by GitHub Actions)
- `POLKA_API_KEY`: API KEY for AI Service

### Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `issue_number` | The issue number to process | No | - |
| `pr_number` | The pull request number to process | No | - |
| `task` | Direct task description to process | No | - |
| `config` | Path to the polka.codes config file(s) | No | `.polkacodes.yml` |

Note: At least one of `issue_number`, `pr_number`, or `task` must be provided.

### Custom Configuration

Create a `.polkacodes.yml` file in your repository to customize the behavior:

```yaml
scripts:
  check:
    command: bun run check
    description: Run type checking and linting
  format:
    command: bun run fix
    description: Format code using Biome

rules:
  - Use TypeScript with strict type checking
  - Use single quotes for strings
  - Use spaces for indentation (2 spaces)

excludeFiles:
  - dist/
  - node_modules/
  - .env
```

## CLI Integration

The action seamlessly integrates with the Polka Codes CLI to process tasks:

1. **CLI Installation**
   - Automatically installs latest CLI version using `npx @polka-codes/cli@latest`
   - No manual CLI installation required

2. **Configuration Loading**
   - Loads multiple config files if specified (comma-separated paths)
   - Passes config to CLI using `--config` flag

3. **CLI Commands**
   - Processes tasks: `npx @polka-codes/cli@latest [config] [task]`
   - Generates commits: `npx @polka-codes/cli@latest [config] commit`
   - Creates PRs: `npx @polka-codes/cli@latest [config] pr`

4. **Custom Scripts**
   - Executes repository-specific scripts defined in config
   - Supports various development tasks (testing, linting, etc.)

## Real-World Examples

### Code Refactoring

```yaml
name: Refactor Code
on:
  issues:
    types: [opened]
    labels: ['refactor']

jobs:
  refactor:
    runs-on: ubuntu-latest
    steps:
      - uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

Example task: "Refactor authentication middleware to use TypeScript classes and improve error handling"

### Bug Fixing

```yaml
name: Fix Bugs
on:
  issues:
    types: [opened]
    labels: ['bug']

jobs:
  fix:
    runs-on: ubuntu-latest
    steps:
      - uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

Example task: "Fix race condition in async data fetching causing intermittent test failures"

### Feature Implementation

```yaml
name: Implement Feature
on:
  issues:
    types: [opened]
    labels: ['feature']

jobs:
  implement:
    runs-on: ubuntu-latest
    steps:
      - uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

Example task: "Add rate limiting middleware with Redis backend and configurable thresholds"

### Documentation Updates

```yaml
name: Update Docs
on:
  issues:
    types: [opened]
    labels: ['documentation']

jobs:
  document:
    runs-on: ubuntu-latest
    steps:
      - uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

Example task: "Update API documentation with new endpoints and improve code examples"

## Troubleshooting

### Common Issues

1. **Invalid Configuration**
   - Ensure `.polkacodes.yml` is properly formatted
   - Verify all referenced scripts exist
   - Check for valid file paths in excludeFiles

2. **Permission Errors**
   - Verify GITHUB_TOKEN has required permissions
   - Ensure branch protection rules allow bot commits
   - Check repository access settings

3. **Task Processing Failures**
   - Provide clear, specific task descriptions
   - Check for conflicting rules in config
   - Verify all required dependencies are installed

4. **Branch Conflicts**
   - Pull latest changes before processing tasks
   - Avoid concurrent tasks on same files
   - Resolve conflicts manually if needed

5. **CLI Integration Issues**
   - Clear npx cache if CLI fails to update
   - Verify network access for CLI installation
   - Check for conflicting global CLI installations

---
*This README is generated by polka.codes*