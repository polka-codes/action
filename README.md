# Polka Codes GitHub Action

[![Visit Polka Codes](https://img.shields.io/badge/Visit-Polka%20Codes-purple)](https://github.com/polka-codes/polka-codes)

A GitHub Action that integrates with [Polka Codes](https://github.com/polka-codes/polka-codes) to analyze code and provide automated feedback through GitHub issues and pull requests. This action enables seamless code analysis, generation, and review automation in your GitHub workflows.

## Overview

This action allows you to:
- Process GitHub issues and pull requests using Polka Codes
- Apply custom code analysis rules and configurations
- Generate automated code improvements and suggestions
- Create pull requests with proposed changes

## How It Works

The action follows a streamlined workflow:

1. **Task Retrieval**
   - Fetches task descriptions from GitHub issues or pull requests
   - Supports direct task input through workflow dispatch
   - Parses task requirements and context

2. **Polka Codes CLI Integration**
   - Invokes the Polka Codes CLI with task details
   - Applies custom configurations from .polkacodes.yml
   - Processes tasks using AI-powered analysis

3. **Branch Management**
   - Creates feature branches for new tasks
   - Checks out existing PR branches for updates
   - Maintains clean git history

4. **Changes and PRs**
   - Commits changes with descriptive messages
   - Creates or updates pull requests
   - Adds detailed descriptions and labels

5. **Custom Command Integration**
   - Executes repository-specific commands
   - Runs tests, linting, and formatting
   - Ensures code quality standards

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

The action seamlessly integrates with the Polka Codes CLI to provide:

1. **Task Processing**
   - Analyzes task descriptions using AI
   - Generates code changes and improvements
   - Follows repository-specific rules

2. **Command Execution**
   - Runs custom commands defined in .polkacodes.yml
   - Integrates with existing development workflows
   - Supports various build tools and frameworks

3. **Version Control**
   - Manages git operations automatically
   - Creates descriptive commit messages
   - Handles branch creation and PR submission

## Usage Examples

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
      - uses: actions/checkout@v4
      - uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Documentation Updates

```yaml
name: Update Docs
on:
  pull_request:
    types: [opened]
    paths:
      - '**/*.md'
      - 'docs/**'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: polka-codes/action@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Test Generation

```yaml
name: Generate Tests
on:
  issues:
    types: [opened]
    labels: ['tests']

jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
          config: test.polkacodes.yml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Type Fixes

```yaml
name: Fix Types
on:
  pull_request:
    types: [opened]
    paths:
      - '**/*.ts'
      - '**/*.tsx'

jobs:
  types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: polka-codes/action@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure GITHUB_TOKEN has required permissions
   - Verify POLKA_API_KEY is valid and properly set
   - Check repository access settings

2. **Configuration Issues**
   - Validate .polkacodes.yml syntax
   - Ensure custom commands exist and are executable
   - Check file paths and patterns

3. **Branch Conflicts**
   - Pull latest changes before running the action
   - Resolve conflicts manually if needed
   - Use unique branch names for new tasks

4. **Task Processing**
   - Provide clear, specific task descriptions
   - Include necessary context and requirements
   - Label issues/PRs appropriately

5. **PR Creation**
   - Ensure branch permissions allow PR creation
   - Check branch protection rules
   - Verify commit signing requirements

For more detailed troubleshooting, visit the [Polka Codes documentation](https://github.com/polka-codes/polka-codes).

---
*This README is generated by polka.codes*