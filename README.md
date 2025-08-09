# Polka Codes GitHub Action

[![Polka Codes](https://img.shields.io/badge/polka.codes-purple?style=for-the-badge)](https://github.com/polka-codes/polka-codes)

A GitHub Action that integrates with [Polka Codes](https://github.com/polka-codes/polka-codes) to implement autonomous coding agents in your GitHub workflows.

## Overview

This action allows you to:
- Automatically implement GitHub issues and open a pull request with the suggested changes.
- Read PR comments and implement suggested changes.
- Automatically fix bugs and improve your code.

## Usage

### Implement an Issue

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
      - name: Run Polka Codes
        uses: polka-codes/action@v1
        with:
          pr_number: ${{ github.event.pull_request.number }}
          review: true
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
      pr_number:
        description: 'Pull request number to process'
        required: false

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

## Configuration

### Inputs

| Input            | Description                                                                                    | Required | Default  |
| ---------------- | ---------------------------------------------------------------------------------------------- | -------- | -------- |
| `issue_number`   | The issue number to process                                                                    | No       | -        |
| `pr_number`      | The pull request number to process                                                             | No       | -        |
| `task`           | The task description to process                                                                | No       | -        |
| `config`         | Path to the polka.codes config file. Can be a comma-separated list of paths                    | No       | -        |
| `cli_version`    | Version of @polka-codes/cli to use                                                             | No       | `latest` |
| `runner_payload` | The runner payload. This is used when used as remote runner for polka.codes service            | No       | -        |
| `runner_api_url` | The runner API URL. This is used when used as remote runner for polka.codes service            | No       | -        |
| `review`         | Set to true to review the PR and post a comment.                                               | No       | `false`  |
| `verbose`        | Verbosity level for CLI commands. Number (1-5) that translates to -v, -vv, -vvv, etc.          | No       | -        |

**Note:** At least one of `issue_number`, `pr_number`, or `task` must be provided.

### Environment Variables

- `GITHUB_TOKEN`: GitHub token for API access (automatically provided by GitHub Actions).
- `POLKA_API_KEY`: Your API key for the Polka Codes service.

For a complete list of available environment variables, please refer to the [Polka Codes documentation](https://github.com/polka-codes/polka-codes?tab=readme-ov-file#environment-variables).

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
> 1. **Restrict Permissions**: Configure repository permissions to control who can trigger the action.
> 2. **Use Controlled Triggers**: Consider using `workflow_dispatch` instead of comment-based triggers for more controlled execution.
> 3. **Label Protection**: If using label-based triggers, restrict who can apply/remove relevant labels.
> 4. **Review Automation**: Regularly audit automated operations and their triggers.
>
> Always follow the principle of least privilege when configuring this action.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).