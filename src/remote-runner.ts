import { setSecret } from '@actions/core'
import { exec } from '@actions/exec'

export async function remoteRunner(runnerPayload: string): Promise<void> {
  let payload: unknown
  try {
    payload = JSON.parse(runnerPayload)
  } catch {
    throw new Error('runner_payload must be valid JSON.')
  }
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('taskId' in payload) ||
    typeof payload.taskId !== 'string' ||
    !payload.taskId.trim() ||
    !('sessionToken' in payload) ||
    typeof payload.sessionToken !== 'string' ||
    !payload.sessionToken.trim() ||
    !('apiUrl' in payload) ||
    typeof payload.apiUrl !== 'string' ||
    !payload.apiUrl.trim()
  ) {
    throw new Error('runner_payload must include nonempty taskId, sessionToken, and apiUrl strings.')
  }

  setSecret(payload.sessionToken)
  await exec('polka-runner', ['--task-id', payload.taskId, '--session-token', payload.sessionToken, '--api', payload.apiUrl])
}
