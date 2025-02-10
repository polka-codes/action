// Generated by polka.codes
// Tests for the GitHub Action main functionality

import { expect, mock, test } from 'bun:test'
import * as core from '@actions/core'

// Mock core and github modules
mock.module('@actions/core', () => ({
  getInput: mock(() => ''),
  setOutput: mock(() => {}),
  setFailed: mock(() => {}),
}))

mock.module('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
  },
  getOctokit: mock(() => ({
    rest: {
      issues: {
        get: mock(() => ({
          data: { body: 'Test issue body' },
        })),
      },
      pulls: {
        get: mock(() => ({
          data: { body: 'Test PR body' },
        })),
        create: mock(() => ({
          data: {
            number: 1,
            html_url: 'https://github.com/test-owner/test-repo/pull/1',
          },
        })),
      },
    },
  })),
}))

test('core.getInput is called with required parameters', () => {
  const getInputMock = core.getInput as unknown as mock.Mock

  // Import main after mocks are set up
  require('../src/main')

  expect(getInputMock).toHaveBeenCalledWith('github_token', { required: true })
})
