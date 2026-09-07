import { describe, expect, it, mock } from 'bun:test'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { remoteRunner } from './remote-runner'

const payload = { taskId: 'task-test', sessionToken: 'session-secret', apiUrl: 'https://staging.polka.codes', ref: 'main' }
function harness(exitCode = 0) {
  return {
    exec: mock(async (command: string, _args: string[]) => ({ exitCode: command === 'git' ? 0 : exitCode })),
    getIDToken: mock(async () => 'oidc-secret'),
    setSecret: mock((_secret: string) => {}),
  }
}

describe('remote runner Action', () => {
  it('passes the dispatched callback and masks credentials before execution', async () => {
    const deps = harness()
    await remoteRunner({ runnerPayload: JSON.stringify(payload), runnerApiUrl: '' }, deps)
    expect(deps.exec.mock.calls).toEqual([
      ['git', ['fetch', '--', 'origin', 'main']],
      ['git', ['checkout', '--detach', 'FETCH_HEAD']],
      [
        'polka-runner',
        ['--task-id', 'task-test', '--session-token', 'session-secret', '--github-token', 'oidc-secret', '--api', payload.apiUrl],
      ],
    ])
    expect(deps.setSecret.mock.calls).toEqual([['session-secret'], ['oidc-secret']])
  })
  it('executes the fetched commit when the local branch is stale', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'polka-runner-checkout-'))
    const origin = join(directory, 'origin')
    const checkout = join(directory, 'checkout')
    const execGit = async (cwd: string, args: string[]) => {
      const child = Bun.spawn(['git', ...args], {
        cwd,
        env: { ...Bun.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' },
        stdout: 'pipe',
        stderr: 'pipe',
      })
      const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text(), new Response(child.stdout).text()])
      if (exitCode !== 0) throw new Error(`Fixture git command failed: ${stderr}`)
      return { exitCode }
    }
    try {
      await execGit(directory, ['init', '--initial-branch=main', origin])
      await writeFile(join(origin, 'version.txt'), 'old')
      await execGit(origin, ['add', 'version.txt'])
      const commitArgs = ['-c', 'user.name=Runner Test', '-c', 'user.email=runner@example.invalid', 'commit', '-m', 'fixture']
      await execGit(origin, commitArgs)
      await execGit(directory, ['clone', origin, checkout])
      await writeFile(join(origin, 'version.txt'), 'new')
      await execGit(origin, ['add', 'version.txt'])
      await execGit(origin, commitArgs)
      let executedVersion: string | undefined
      const deps = harness()
      deps.exec.mockImplementation(async (command, args) => {
        if (command === 'git') return await execGit(checkout, args)
        executedVersion = await readFile(join(checkout, 'version.txt'), 'utf8')
        return { exitCode: 0 }
      })
      await remoteRunner({ runnerPayload: JSON.stringify(payload), runnerApiUrl: '' }, deps)
      expect(executedVersion).toBe('new')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
  it('propagates the failed subprocess exit', async () => {
    await expect(remoteRunner({ runnerPayload: JSON.stringify(payload), runnerApiUrl: '' }, harness(1))).rejects.toThrow('exit code 1')
  })
  it.each(['https://example.com', 'https://polka.codes/secret', 'https://user:pass@polka.codes', 'http://polka.codes'])(
    'rejects %s before credentials or checkout',
    async (apiUrl) => {
      const deps = harness()
      await expect(remoteRunner({ runnerPayload: JSON.stringify({ ...payload, apiUrl }), runnerApiUrl: '' }, deps)).rejects.toThrow()
      expect(deps.getIDToken).not.toHaveBeenCalled()
      expect(deps.exec).not.toHaveBeenCalled()
    },
  )
  it('rejects a conflicting explicit endpoint', async () => {
    await expect(remoteRunner({ runnerPayload: JSON.stringify(payload), runnerApiUrl: 'https://polka.codes' }, harness())).rejects.toThrow(
      'does not match',
    )
  })
  it('forwards a long explicit budget instead of imposing 300 seconds', async () => {
    const deps = harness()
    await remoteRunner({ runnerPayload: JSON.stringify({ ...payload, timeout: 7200 }), runnerApiUrl: '' }, deps)
    expect(deps.exec.mock.calls.at(-1)).toEqual([
      'timeout',
      [
        '--signal=KILL',
        '--',
        '7200s',
        'polka-runner',
        '--task-id',
        payload.taskId,
        '--session-token',
        payload.sessionToken,
        '--github-token',
        'oidc-secret',
        '--api',
        payload.apiUrl,
      ],
    ])
  })
  it('terminates the actual runner process when its explicit budget expires', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'polka-runner-timeout-'))
    try {
      const executable = join(directory, 'polka-runner')
      await writeFile(executable, '#!/usr/bin/env node\nsetInterval(() => {}, 1000)\n')
      await chmod(executable, 0o755)
      const deps = harness()
      deps.exec.mockImplementation(async (command, args) => {
        const process = Bun.spawn([command, ...args], {
          env: { ...Bun.env, PATH: `${directory}:${Bun.env.PATH}` },
          stdout: 'pipe',
          stderr: 'pipe',
        })
        return { exitCode: await process.exited }
      })
      await expect(
        remoteRunner({ runnerPayload: JSON.stringify({ ...payload, ref: '', timeout: 1 }), runnerApiUrl: '' }, deps),
      ).rejects.toThrow('exit code 137')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
