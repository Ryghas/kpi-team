import 'server-only'
import { z } from 'zod'
import { env } from '@/lib/env'
import type { IssueRow } from './types'

/**
 * Read-only Jira client. Hanya memanggil GET /rest/api/3/search/jql
 * (endpoint pengganti /search yang sudah deprecated). Tidak ada satu pun write call —
 * token cukup dari akun service dengan permission "Browse Projects".
 */
/**
 * Story points tersebar di 2 field custom tergantung project:
 * customfield_10032 "Story Points" (mayoritas project) dan customfield_10016 "Story point estimate"
 * (dipakai project "Commercial & Acquisition" — cek manual, tidak pernah dua-duanya terisi sekaligus).
 * customfield_10151 "Story Point" lama tidak dipakai project mana pun (0 tiket terisi).
 */
const FIELDS = ['summary', 'project', 'issuetype', 'status', 'assignee', 'created', 'updated', 'resolutiondate', 'duedate', 'parent', 'customfield_10032', 'customfield_10016'] as const
const PAGE_SIZE = 100

const issueSchema = z.object({
  key: z.string(),
  fields: z.object({
    summary: z.string(),
    project: z.object({ name: z.string() }),
    issuetype: z.object({ name: z.string() }),
    status: z.object({ name: z.string() }),
    assignee: z.object({ displayName: z.string() }).nullable(),
    created: z.string(),
    updated: z.string(),
    resolutiondate: z.string().nullable(),
    duedate: z.string().nullable(),
    parent: z.object({ fields: z.object({ summary: z.string(), issuetype: z.object({ name: z.string() }) }) }).nullish(),
    customfield_10032: z.number().nullish(),
    customfield_10016: z.number().nullish(),
  }),
})

const pageSchema = z.object({
  issues: z.array(issueSchema),
  nextPageToken: z.string().optional(),
  isLast: z.boolean().optional(),
})

export class JiraError extends Error {
  constructor(readonly status: number, body: string) {
    super(`Jira API ${status}: ${body.slice(0, 300)}`)
    this.name = 'JiraError'
  }
}

export async function searchIssues(jql: string): Promise<IssueRow[]> {
  const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_REVALIDATE_SECONDS } = env()
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')
  const rows: IssueRow[] = []
  let pageToken: string | undefined

  do {
    const url = new URL('/rest/api/3/search/jql', JIRA_BASE_URL)
    url.searchParams.set('jql', jql)
    url.searchParams.set('fields', FIELDS.join(','))
    url.searchParams.set('maxResults', String(PAGE_SIZE))
    if (pageToken) url.searchParams.set('nextPageToken', pageToken)

    // GET + next.revalidate → tiap halaman masuk Data Cache; hit Jira maksimal sekali per jam per query
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
      next: { revalidate: JIRA_REVALIDATE_SECONDS, tags: ['jira'] },
    })
    if (!res.ok) throw new JiraError(res.status, await res.text())

    const page = pageSchema.parse(await res.json())
    rows.push(...page.issues.map(toRow))
    pageToken = page.isLast ? undefined : page.nextPageToken
  } while (pageToken)

  return rows
}

function toRow({ key, fields: f }: z.infer<typeof issueSchema>): IssueRow {
  return {
    key,
    summary: f.summary,
    project: f.project.name,
    issueType: f.issuetype.name,
    status: f.status.name,
    assignee: f.assignee?.displayName ?? null,
    created: parseJiraDate(f.created),
    updated: parseJiraDate(f.updated),
    resolved: f.resolutiondate ? parseJiraDate(f.resolutiondate) : null,
    dueDate: f.duedate,
    initiative: f.parent?.fields.issuetype.name === 'Epic' ? f.parent.fields.summary : null,
    storyPoints: f.customfield_10032 ?? f.customfield_10016 ?? null,
  }
}

/** Jira: "2026-07-30T20:34:00.000+0700" → sisipkan ':' di offset agar parsing tidak bergantung engine. */
export const parseJiraDate = (s: string) => new Date(s.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'))
