// Generated by polka.codes
// Main entry point for the Polka Codes GitHub Action

import { spawnSync } from 'node:child_process'
import { platform } from 'node:os'
import * as core from '@actions/core'
import { exec } from '@actions/exec'
import * as github from '@actions/github'
import { fetchIssue, fetchPR } from '@polka-codes/github'

interface ActionInputs {
  issueNumber?: number
  prNumber?: number
  task?: string
  config?: string
  cliVersion: string
  runnerPayload?: string
  runnerApiUrl: string
}

async function getInputs(): Promise<ActionInputs> {
  core.debug('Getting action inputs')
  const issueNumberStr = core.getInput('issue_number')
  const prNumberStr = core.getInput('pr_number')

  const inputs = {
    issueNumber: issueNumberStr ? Number.parseInt(issueNumberStr) : undefined,
    prNumber: prNumberStr ? Number.parseInt(prNumberStr) : undefined,
    task: core.getInput('task'),
    config: core.getInput('config'),
    cliVersion: core.getInput('cli_version'),
    runnerPayload: core.getInput('runner_payload'),
    runnerApiUrl: core.getInput('runner_api_url'),
  }

  core.debug(`Received inputs: issue=${issueNumberStr}, pr=${prNumberStr}, task=${inputs.task}, config=${inputs.config}`)
  return inputs
}

const validateInputs = (inputs: ActionInputs) => {
  core.debug('Validating inputs')

  if (inputs.runnerPayload) {
    // remote runner mode

    if (inputs.issueNumber || inputs.prNumber || inputs.task) {
      const error = 'issue_number, pr_number, or task cannot be used when used as remote runner'
      core.error(error)
      throw new Error(error)
    }
    return
  }

  if (inputs.issueNumber && inputs.prNumber) {
    const error = 'Only one of issue_number or pr_number can be provided'
    core.error(error)
    throw new Error(error)
  }

  if (!inputs.issueNumber && !inputs.prNumber && !inputs.task) {
    const error = 'One of issue_number, pr_number, or task must be provided'
    core.error(error)
    throw new Error(error)
  }
}

const remoteRunner = async (inputs: { runnerPayload: string; cliVersion: string; runnerApiUrl: string }) => {
  const payload = JSON.parse(inputs.runnerPayload)
  if (payload.ref) {
    spawnSync('git', ['fetch', 'origin', payload.ref], { stdio: 'inherit' })
    spawnSync('git', ['checkout', payload.ref], { stdio: 'inherit' })
  }
  const oidcToken = await core.getIDToken('https://polka.codes')
  spawnSync(
    'npx',
    [
      `@polka-codes/runner@${inputs.cliVersion}`,
      '--task-id',
      payload.taskId,
      '--session-token',
      payload.sessionToken,
      '--github-token',
      oidcToken,
    ],
    { stdio: 'inherit' },
  )
}

export async function run(): Promise<void> {
  try {
    if (platform() === 'linux') {
      try {
        await exec('rg', ['--version'], { silent: true })
        core.debug('ripgrep is already installed.')
      } catch (error) {
        core.info('ripgrep not found, installing it.')
        try {
          await exec('sudo', ['apt-get', 'update'])
          await exec('sudo', ['apt-get', 'install', '-y', '--no-install-recommends', 'ripgrep'])
        } catch (installError) {
          core.warning('Failed to install ripgrep, continuing without it.')
          if (installError instanceof Error) {
            core.warning(installError.message)
          }
        }
      }
    }

    // Get inputs
    const inputs = await getInputs()
    validateInputs(inputs)

    if (inputs.runnerPayload) {
      await remoteRunner({ runnerPayload: inputs.runnerPayload, cliVersion: inputs.cliVersion, runnerApiUrl: inputs.runnerApiUrl })
      return
    }

    const octokit = github.getOctokit(process.env.GITHUB_TOKEN ?? '')

    const { owner, repo } = github.context.repo
    core.info(`Processing repository: ${owner}/${repo}`)

    // Get task description
    core.info('Fetching task description')
    let taskDescription = ''
    if (inputs.issueNumber) {
      core.info(`Fetching issue #${inputs.issueNumber}`)
      taskDescription = await fetchIssue({ owner, repo, issueNumber: inputs.issueNumber, octokit })
      core.debug(`Fetched issue description: ${taskDescription}`)
    } else if (inputs.prNumber) {
      core.info(`Fetching PR #${inputs.prNumber}`)
      taskDescription = await fetchPR({ owner, repo, prNumber: inputs.prNumber, octokit })
      core.debug(`Fetched PR description: ${taskDescription}`)
    }
    if (inputs.task) {
      taskDescription = `${inputs.task}\n\n${taskDescription}`
    }

    if (!taskDescription) {
      const error = 'No task description provided'
      core.error(error)
      throw new Error(error)
    }

    let configArgs: string[] = []
    if (inputs.config) {
      const configPaths = inputs.config.split(',')
      configArgs = configPaths.flatMap((path) => ['--config', path])
      core.info(`Using config files: ${configPaths.join(', ')}`)
    }

    let branchName = ''

    if (inputs.prNumber) {
      // Checkout existing PR branch
      core.info(`Checking out PR #${inputs.prNumber}`)
      spawnSync('gh', ['pr', 'checkout', inputs.prNumber.toString()], { stdio: 'inherit' })
    } else {
      // Create a new branch for changes
      branchName = `polka/task-${Date.now()}`
      core.info(`Creating new branch: ${branchName}`)
      spawnSync('git', ['checkout', '-b', branchName], { stdio: 'inherit' })
    }

    core.info('Starting task processing')
    core.debug(`Task description: ${taskDescription}`)

    // Process task using Polka Codes CLI
    core.info('Executing Polka Codes CLI')
    spawnSync('npx', [`@polka-codes/cli@${inputs.cliVersion}`, ...configArgs, taskDescription], { stdio: 'inherit' })

    // Commit and push changes
    core.info('Committing changes')
    spawnSync('git', ['add', '.'], { stdio: 'inherit' })
    spawnSync('npx', [`@polka-codes/cli@${inputs.cliVersion}`, ...configArgs, 'commit'], { stdio: 'inherit' })
    core.info('Pushing changes')
    if (branchName) {
      core.info(`Pushing to branch: ${branchName}`)
      spawnSync('git', ['push', 'origin', branchName], { stdio: 'inherit' })
    } else {
      core.info('Pushing to current branch')
      spawnSync('git', ['push'], { stdio: 'inherit' })
    }

    const extraContent = inputs.issueNumber ? [`Closes #${inputs.issueNumber}`] : []
    spawnSync('npx', [`@polka-codes/cli@${inputs.cliVersion}`, ...configArgs, 'pr', ...extraContent], { stdio: 'inherit' })
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Failed with error: ${error.message}`)
      core.error(`Stack trace: ${error.stack}`)
      core.setFailed(error.message)
    } else {
      core.error('An unexpected error occurred')
      core.setFailed('An unexpected error occurred')
    }
  }
}
