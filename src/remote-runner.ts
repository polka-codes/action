type RunnerDependencies = {
  exec: (command: string, args: string[]) => Promise<{ exitCode: number }>
  getIDToken: (audience: string) => Promise<string>
  setSecret: (secret: string) => void
}

function callbackOrigin(value: string): string {
  const url = new URL(value)
  if (
    !['https://polka.codes', 'https://staging.polka.codes'].includes(url.origin) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Runner callback origin is not trusted.')
  }
  return url.origin
}

export async function remoteRunner(inputs: { runnerPayload: string; runnerApiUrl: string }, deps: RunnerDependencies): Promise<void> {
  const payload: unknown = JSON.parse(inputs.runnerPayload)
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('taskId' in payload) ||
    typeof payload.taskId !== 'string' ||
    !payload.taskId ||
    !('sessionToken' in payload) ||
    typeof payload.sessionToken !== 'string' ||
    !payload.sessionToken ||
    !('apiUrl' in payload) ||
    typeof payload.apiUrl !== 'string' ||
    ('ref' in payload && typeof payload.ref !== 'string')
  ) {
    throw new Error('Invalid remote runner payload.')
  }
  const timeout = 'timeout' in payload ? payload.timeout : undefined
  if (timeout !== undefined && (typeof timeout !== 'number' || !Number.isSafeInteger(timeout) || timeout <= 0)) {
    throw new Error('Runner timeout must be a positive integer number of seconds.')
  }
  const apiUrl = callbackOrigin(payload.apiUrl)
  if (inputs.runnerApiUrl && callbackOrigin(inputs.runnerApiUrl) !== apiUrl) {
    throw new Error('Runner API input does not match the dispatched callback origin.')
  }
  deps.setSecret(payload.sessionToken)
  if ('ref' in payload && typeof payload.ref === 'string' && payload.ref) {
    for (const args of [
      ['fetch', '--', 'origin', payload.ref],
      ['checkout', '--detach', 'FETCH_HEAD'],
    ]) {
      const result = await deps.exec('git', args)
      if (result.exitCode !== 0) throw new Error(`git ${args[0]} failed with exit code ${result.exitCode}`)
    }
  }
  const oidcToken = await deps.getIDToken('https://polka.codes')
  deps.setSecret(oidcToken)
  const runnerArgs = ['--task-id', payload.taskId, '--session-token', payload.sessionToken, '--github-token', oidcToken, '--api', apiUrl]
  const result =
    timeout === undefined
      ? await deps.exec('polka-runner', runnerArgs)
      : await deps.exec('timeout', ['--signal=KILL', '--', `${timeout}s`, 'polka-runner', ...runnerArgs])
  if (result.exitCode !== 0) throw new Error(`Remote runner failed with exit code ${result.exitCode}`)
}
