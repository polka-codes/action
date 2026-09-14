import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Subprocess } from 'bun'

const payload = { taskId: 'task-test', sessionToken: 'session-secret', apiUrl: 'https://staging.polka.codes', ref: 'dispatched-sha' }
const node = Bun.which('node')
if (!node) throw new Error('Node.js is required to test the shipped Action.')

// Exercise the real error boundary and executor in both source and the shipped Node bundle.
describe.each([
  ['source', [process.execPath, join(import.meta.dir, 'main.ts')]],
  ['bundle', [node, join(import.meta.dir, '../dist/index.js')]],
] as const)('remote runner Action (%s)', (_name, command) => {
  let directory: string
  let child: Subprocess<'ignore', 'pipe', 'pipe'> | undefined

  async function executable(name: string, body: string) {
    const path = join(directory, name)
    await writeFile(path, `#!${process.execPath}\n${body}\n`)
    await chmod(path, 0o755)
  }

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'polka-action-'))
    child = undefined
    await writeFile(join(directory, 'checked-out-revision'), payload.ref)
    await executable('npm', "require('node:fs').writeFileSync('install.json', JSON.stringify(process.argv.slice(2)))")
    await executable('rg', "console.log('ripgrep fixture')")
    await executable(
      'polka-runner',
      `const fs = require('node:fs')
fs.writeFileSync('invocation.json', JSON.stringify({
  args: process.argv.slice(2),
  revision: fs.readFileSync('checked-out-revision', 'utf8'),
  oidcUrl: process.env.ACTIONS_ID_TOKEN_REQUEST_URL,
  oidcToken: process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
  githubToken: process.env.GITHUB_TOKEN ?? null,
}))
console.log('runner stdout')
console.error('runner stderr')
if (process.env.TEST_RUNNER_MODE === 'wait') {
  const timer = setInterval(() => {
    if (fs.existsSync('release')) clearInterval(timer)
  }, 10)
} else {
  if (process.env.TEST_RUNNER_ERROR) console.error(process.env.TEST_RUNNER_ERROR)
  process.exit(Number(process.env.TEST_RUNNER_EXIT ?? 0))
}`,
    )
  })

  afterEach(async () => {
    // Release the streaming fixture even when an assertion fails.
    await writeFile(join(directory, 'release'), '')
    await child?.exited
    await rm(directory, { recursive: true, force: true })
  })

  function start(raw = JSON.stringify(payload), env: Record<string, string> = {}, onOutput?: (output: string) => void) {
    child = Bun.spawn([...command], {
      cwd: directory,
      // No real credentials, network tools, or Git executable are available to the fixture.
      env: { PATH: directory, INPUT_RUNNER_PAYLOAD: raw, INPUT_CLI_VERSION: '0.0.1', ...env },
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const stdout = (async () => {
      let output = ''
      for await (const chunk of child.stdout) {
        output += Buffer.from(chunk).toString()
        onOutput?.(output)
      }
      return output
    })()
    return Promise.all([child.exited, stdout, new Response(child.stderr).text()]).then(([exitCode, stdout, stderr]) => ({
      exitCode,
      output: stdout + stderr,
    }))
  }

  it('installs latest, passes only supported staging arguments, and uses the existing checkout and environment', async () => {
    const raw = JSON.stringify({ ...payload, timeout: 'owned elsewhere', extra: { accepted: true } })
    const { exitCode, output } = await start(raw, {
      ACTIONS_ID_TOKEN_REQUEST_URL: 'http://127.0.0.1:1/unused',
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'request-secret',
    })
    expect(exitCode).toBe(0)
    expect(JSON.parse(await readFile(join(directory, 'install.json'), 'utf8'))).toEqual(['install', '-g', '@polka-codes/runner@latest'])
    expect(JSON.parse(await readFile(join(directory, 'invocation.json'), 'utf8'))).toEqual({
      args: ['--task-id', payload.taskId, '--session-token', payload.sessionToken, '--api', payload.apiUrl],
      revision: payload.ref,
      oidcUrl: 'http://127.0.0.1:1/unused',
      oidcToken: 'request-secret',
      githubToken: null,
    })
    expect(output).toContain('runner stdout')
    expect(output).toContain('runner stderr')
    expect(output).toContain('Completed in')
    expect(output).not.toContain(raw)
    expect(output).not.toContain('request-secret')
    expect(output).not.toContain('git fetch')
    expect(output).not.toContain('git checkout')
    expect(output).not.toContain('--github-token')

    const mask = output.indexOf(`::add-mask::${payload.sessionToken}`)
    const echo = output.indexOf(`[command]${join(directory, 'polka-runner')}`)
    expect(mask).toBeGreaterThanOrEqual(0)
    expect(echo).toBeGreaterThan(mask)
    // GitHub applies the mask; locally, only its registration and the executor echo contain the fake secret.
    const diagnostics = output
      .split('\n')
      .filter((line) => !line.startsWith('::add-mask::') && !line.startsWith('[command]'))
      .join('\n')
    expect(diagnostics).not.toContain(payload.sessionToken)
  })

  it.each([
    ['invalid JSON', `{"sessionToken":"${payload.sessionToken}",`, 'must be valid JSON'],
    ['null', 'null', 'must include nonempty'],
    ['array', '[]', 'must include nonempty'],
    ['primitive', JSON.stringify(payload.sessionToken), 'must include nonempty'],
    ...(['taskId', 'sessionToken', 'apiUrl'] as const).flatMap((field) =>
      [undefined, 42, '', '   '].map((value) => [
        field,
        JSON.stringify({ ...payload, [field]: value, privateData: 'private-marker' }),
        'must include nonempty',
      ]),
    ),
  ])('rejects %s payloads without leaking their contents', async (_name, raw, message) => {
    const { exitCode, output } = await start(raw)
    expect(exitCode).toBe(1)
    expect(output).toContain(`::error::runner_payload ${message}`)
    expect(output).not.toContain(payload.sessionToken)
    expect(output).not.toContain('private-marker')
    expect(output).not.toContain('Raw JSON')
    expect(output).not.toContain('SyntaxError')
    expect(output).not.toContain(`[command]${join(directory, 'polka-runner')}`)
    expect(output).not.toContain('Completed in')
  })

  it('fails the Action when the runner executable is missing', async () => {
    await rm(join(directory, 'polka-runner'))
    const { exitCode, output } = await start()
    expect(exitCode).toBe(1)
    expect(output).toContain('Unable to locate executable file: polka-runner')
    expect(output).not.toContain('Completed in')
    expect(
      output
        .split('\n')
        .filter((line) => line.startsWith('::error::'))
        .join('\n'),
    ).not.toContain(payload.sessionToken)
  })

  it.each([
    ['Authentication denied', '1'],
    ['GitHub Actions OIDC requires id-token: write', '1'],
    ['Command failed', '23'],
  ])('fails the Action when the runner reports %s', async (error, code) => {
    const { exitCode, output } = await start(undefined, { TEST_RUNNER_ERROR: error, TEST_RUNNER_EXIT: code })
    expect(exitCode).toBe(1)
    expect(output).toContain(error)
    expect(output).toContain(`failed with exit code ${code}`)
    expect(output).not.toContain('Completed in')
    expect(
      output
        .split('\n')
        .filter((line) => line.startsWith('::error::'))
        .join('\n'),
    ).not.toContain(payload.sessionToken)
  })

  it('streams output while the runner is still running and waits for its completion', async () => {
    let reportOutput: () => void = () => {}
    const receivedOutput = new Promise<void>((resolve) => {
      reportOutput = resolve
    })
    const result = start(undefined, { TEST_RUNNER_MODE: 'wait' }, (output) => {
      if (output.includes('runner stdout')) reportOutput()
    })
    await Promise.race([
      receivedOutput,
      result.then(() => {
        throw new Error('Action exited before streaming output')
      }),
    ])
    expect(child?.exitCode).toBeNull()
    await writeFile(join(directory, 'release'), '')
    expect((await result).exitCode).toBe(0)
  })
})
