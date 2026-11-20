/**
 * Minimal client for the GitHub Contents API, used to persist manual inventory corrections
 * straight into the repository file that Next.js statically imports (`lib/data/inventoryData.json`).
 * Mirrors the same persistence mechanism `.github/workflows/daily-smartpos-sync.yml` already uses
 * (commit the JSON file to git) instead of introducing a separate database.
 */

export interface CommitFileOptions {
  /** Repo-relative path, e.g. "lib/data/inventoryData.json". */
  path: string
  content: string
  message: string
}

export interface CommitFileResult {
  commitSha: string
  commitUrl: string
}

function getRepoConfig() {
  const token = process.env.GITHUB_WRITE_TOKEN
  const repo = process.env.GITHUB_REPO || 'fabricio-hunt/dashboard-validacao'
  const branch = process.env.GITHUB_BRANCH || 'main'
  const [owner, name] = repo.split('/')

  if (!token) {
    throw new Error('GITHUB_WRITE_TOKEN não configurado no servidor.')
  }
  if (!owner || !name) {
    throw new Error(`GITHUB_REPO inválido: "${repo}". Use o formato "owner/repo".`)
  }

  return { token, owner, name, branch }
}

async function githubRequest(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  return response
}

/**
 * Creates a commit on `branch` that replaces `path` with `content`, mirroring the daily
 * sync workflow's "commit the regenerated JSON" step. Requires the current file SHA, so it
 * first reads the file to detect concurrent-edit conflicts (another commit landed first).
 */
export async function commitFileToRepo({ path, content, message }: CommitFileOptions): Promise<CommitFileResult> {
  const { token, owner, name, branch } = getRepoConfig()

  const currentFileRes = await githubRequest(`/repos/${owner}/${name}/contents/${path}?ref=${branch}`, token)
  if (!currentFileRes.ok) {
    throw new Error(`Falha ao ler ${path} no GitHub (HTTP ${currentFileRes.status}) antes de commitar.`)
  }
  const currentFile = (await currentFileRes.json()) as { sha: string }

  const putRes = await githubRequest(`/repos/${owner}/${name}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      sha: currentFile.sha,
      branch,
    }),
  })

  if (!putRes.ok) {
    const body = await putRes.text()
    throw new Error(`Falha ao commitar ${path} no GitHub (HTTP ${putRes.status}): ${body}`)
  }

  const putBody = (await putRes.json()) as { commit: { sha: string; html_url: string } }
  return { commitSha: putBody.commit.sha, commitUrl: putBody.commit.html_url }
}

/** Fires the same Vercel deploy hook the daily sync workflow uses, so the new commit goes live. */
export async function triggerVercelRedeploy(): Promise<void> {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL
  if (!hookUrl) return
  await fetch(hookUrl, { method: 'POST' })
}
