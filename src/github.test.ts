import { describe, expect, test } from 'bun:test'
import { Octokit } from '@octokit/core'
import { fetchIssue, fetchPR } from './github.ts'

describe.skipIf(!process.env.GITHUB_TOKEN)('github', () => {
  test('fetchIssue', async () => {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })
    const issue = await fetchIssue('polka-codes', 'action', 1, octokit)
    expect(issue).toMatchSnapshot()
  })

  test('fetchPR', async () => {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })
    const pr = await fetchPR('polka-codes', 'polka-codes', 95, octokit)
    expect(pr).toMatchSnapshot()
  })
})
