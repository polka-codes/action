// Generated by polka.codes
// Main entry point for the Polka Codes GitHub Action

import { spawnSync } from 'node:child_process'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { fetchIssue, fetchPR } from './github'

interface ActionInputs {
  issueNumber?: number
  prNumber?: number
  task?: string
  githubToken: string
  config?: string
}

async function getInputs(): Promise<ActionInputs> {
  const issueNumberStr = core.getInput('issue_number')
  const prNumberStr = core.getInput('pr_number')

  return {
    issueNumber: issueNumberStr ? Number.parseInt(issueNumberStr) : undefined,
    prNumber: prNumberStr ? Number.parseInt(prNumberStr) : undefined,
    task: core.getInput('task'),
    githubToken: core.getInput('github_token', { required: true }),
    config: core.getInput('config'),
  }
}

const validateInputs = (inputs: ActionInputs) => {
  if (inputs.issueNumber && inputs.prNumber) {
    throw new Error('Only one of issue_number or pr_number can be provided')
  }

  if (!inputs.issueNumber && !inputs.prNumber && !inputs.task) {
    throw new Error('One of issue_number, pr_number, or task must be provided')
  }
}

export async function run(): Promise<void> {
  try {
    // Get inputs
    const inputs = await getInputs()
    validateInputs(inputs)
    const octokit = github.getOctokit(inputs.githubToken)

    const { owner, repo } = github.context.repo

    // Get task description
    let taskDescription = inputs.task
    if (inputs.issueNumber) {
      taskDescription = await fetchIssue(owner, repo, inputs.issueNumber, octokit)
    } else if (inputs.prNumber) {
      taskDescription = await fetchPR(owner, repo, inputs.prNumber, octokit)
    }

    if (!taskDescription) {
      throw new Error('No task description provided')
    }

    let configArgs: string[] = []
    if (inputs.config) {
      const configPaths = inputs.config.split(',')
      configArgs = configPaths.flatMap((path) => ['--config', path])
    }

    let branchName = ''

    if (inputs.prNumber) {
      // Checkout existing PR branch
      spawnSync('gh', ['pr', 'checkout', inputs.prNumber.toString()], { stdio: 'inherit' })
    } else {
      // Create a new branch for changes
      branchName = `polka/task-${Date.now()}`
      spawnSync('git', ['checkout', '-b', branchName], { stdio: 'inherit' })
    }

    // Process task using Polka Codes CLI
    spawnSync('npx', ['@polka-codes/cli@latest', ...configArgs, taskDescription], { stdio: 'inherit' })

    // Commit and push changes
    spawnSync('git', ['add', '.'], { stdio: 'inherit' })
    spawnSync('npx', ['@polka-codes/cli@latest', ...configArgs, 'commit'], { stdio: 'inherit' })
    if (branchName) {
      spawnSync('git', ['push', 'origin', branchName], { stdio: 'inherit' })
    } else {
      spawnSync('git', ['push'], { stdio: 'inherit' })
    }
    spawnSync('npx', ['@polka-codes/cli@latest', ...configArgs, 'pr'], { stdio: 'inherit' })
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}
