# Polka Codes GitHub Action

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
| `task` | The task description to process | No | - |
| `config` | Path to the polka.codes config file. Can be a comma-separated list of paths | No | - |
| `cli_version` | Version of @polka-codes/cli to use | No | `latest` |
| `runner_payload` | The runner payload. This is used when used as remote runner for polka.codes service | No | - |
| `runner_api_url` | The runner API URL. This is used when used as remote runner for polka.codes service | No | `https://api-dev.polka.codes` |
| `review` | Set to true to review the PR and post a comment. | No | `false` |

Note: At least one of `issue_number`, `pr_number`, or `task` must be provided.

## Documentation

To get started with the Polka Codes GitHub Action, follow these steps:

1.  **Create a Workflow File**: In your repository, create a new workflow file (e.g., `.github/workflows/polka-codes.yml`).

2.  **Define Triggers**: Choose the events that will trigger the action. Common triggers include issue creation, pull request updates, or manual dispatch.

3.  **Configure the Action**: Add a job that uses the `polka-codes/action@v1` and configure the necessary inputs and environment variables.

### Example Workflow

```yaml
name: Polka Codes

on:
  issues:
    types: [opened]

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Run Polka Codes
        uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
          task: 'Implement the feature described in the issue.'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Environment Variables

For the action to function correctly, you must configure the following environment variables in your repository's secrets:

-   `POLKA_API_KEY`: Your API key for the Polka Codes service.

For a complete list of available environment variables, please refer to the [Polka Codes documentation](https://github.com/polka-codes/polka-codes?tab=readme-ov-file#environment-variables).

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
    if: contains(github.event.issue.labels.*.name, 'polka.codes### Implement an Issue

This example shows how to automatically implement a feature or bug fix when a new issue is created with a specific label.

```yaml
name: Implement Issue
on:
  issues:
    types: [opened]

jobs:
  implement:
    if: contains(github.event.issue.labels.*.name, 'polka.codes')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Run Polka Codes
        uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.issue.number }}
          task: 'Implement the feature described in the issue.'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Manually Trigger a Workflow

You can use `workflow_dispatch` to manually trigger the action for a specific issue or pull request.

```yaml
name: Manual Trigger
on:
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to process'
        required: false
        type: string
      pr_number:
        description: 'Pull request number to process'
        required: false
        type: string

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Run Polka Codes
        uses: polka-codes/action@v1
        with:
          issue_number: ${{ github.event.inputs.issue_number }}
          pr_number: ${{ github.event.inputs.pr_number }}
          task: 'Process the specified issue or pull request.'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Improve a Pull Request

This example demonstrates how to use the action to automatically review and improve a pull request.

```yaml
name: Improve Pull Request
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  improve:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Run Polka Codes
        uses: polka-codes/action@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
          task: 'Review the PR, fix any issues, and improve documentation and test coverage.'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

### Review a Pull Request

This example demonstrates how to use the action to review a pull request and post a comment with the review summary.

```yaml
name: Review PR
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
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
          pr_number: ${{ github.event.pull_request.number }}
          review: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          POLKA_API_KEY: ${{ secrets.POLKA_API_KEY }}
```

---
*This README is generated by polka.codes*
