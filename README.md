# Polka Codes GitHub Action

[![Polka Codes](https://img.shields.io/badge/Powered%20by-Polka%20Codes-purple)](https://github.com/polka-codes/polka-codes)

A GitHub Action that integrates with [Polka Codes](https://github.com/polka-codes/polka-codes) to implement autonomous coding agents in your GitHub workflows.

## Overview

This action allows you to:
- Automatically implement Github issue and open a pull request with the suggested changes
- Read PR comments and implement suggested changes
- Automatic bug fixing and code improvements

## Security Considerations

> ⚠️ **Important Security Warning**
>
> This action processes comments as triggers for automated operations. This introduces potential security considerations:
>
> - Comments in issues and PRs are used as input for the action
> - Malicious content in comments could potentially be executed or processed
> - Without proper restrictions, any user who can comment could trigger the action
>
> **Recommended Security Measures:**
>
> 1. **Restrict Permissions**: Configure repository permissions to control who can trigger the action
> 2. **Use Controlled Triggers**: Consider using `workflow_dispatch` instead of comment-based triggers for more controlled execution
> 3. **Label Protection**: If using label-based triggers, restrict who can apply/remove relevant labels
> 4. **Review Automation**: Regularly audit automated operations and their triggers
>
> Always follow the principle of least privilege when configuring this action.

## Installation

Add the action to your GitHub workflow:

```yaml
- uses: polka-codes/action@v1
  with:
    # Configure inputs based on your needs
    issue_number: ${{ github.event.issue.number }}
      task: Implement the issue
      # or
      # pr_number: ${{ github.event.pull_request.number }}
      # task: Review the PR and fix any issues, improve documentation, improve test coverage if necessary.
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    POLKA_API_PROVIDER: openrouter
    POLKA_MODEL: deepseek/deepseek-chat
    POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

## Configuration

### Required Environment Variables

- `GITHUB_TOKEN`: GitHub token for API access (automatically provided by GitHub Actions)
- `POLKA_API_KEY`: API KEY for AI Service

For complete list of available environment variables, please refer to [Polka Codes](https://github.com/polka-codes/polka-codes?tab=readme-ov-file#environment-variables).

### Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `issue_number` | The issue number to process | No | - |
| `pr_number` | The pull request number to process | No | - |
| `task` | Direct task description to process | No | - |
| `config` | Path to the polka.codes config file(s) | No | `.polkacodes.yml` |

Note: At least one of `issue_number`, `pr_number`, or `task` must be provided.

## Usage Examples

### Implement any issue labeled with 'polka.codes' label

```yaml
name: Implement issue
on:
  issues:
    types: [opened]
    labels: ['polka.codes']

jobs:
  implement:
    if: contains(github.event.issue.labels.*.name, 'polka.codes'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Install dependencies
        run: npm install
      - name: Config git
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
      - uses: polka-codes/action@master
        with:
          issue_number: ${{ github.event.issue.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Manual dispatch

```yaml
name: Implement issue
on:
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to process'
        required: true
        type: number

jobs:
  implement:
    runs-on: ubuntu-latest
    steps:
      # checkout and setup env
      - uses: polka-codes/action@master
        with:
          issue_number: ${{ github.event.inputs.issue_number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

```yaml
name: Improve PR
on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to process'
        required: true
        type: number

jobs:
  implement:
    runs-on: ubuntu-latest
    steps:
      # checkout and setup env
      - uses: polka-codes/action@master
        with:
          pr_number: ${{ github.event.inputs.pr_number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### PR improvements

```yaml
name: Improve PR
on:
    pull_request:
    branches: [ "master" ]

jobs:
  improve:
    runs-on: ubuntu-latest
    steps:
      # checkout and setup env
      - uses: polka-codes/action@master
        with:
          pr_number: ${{ github.event.inputs.pr_number }}
          task: Review the PR and fix any issues, improve documentation, improve test coverage if necessary.
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}

---
*This README is generated by polka.codes*
