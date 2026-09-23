import 'server-only'
import { cache } from 'react'
import { searchIssues } from './jira'
import { AVAILABILITY_DONE_STATUSES, ENGINEERS } from './config'
import { jqlDate, parsePeriod } from './period'
import type { EngineerConfig, Period, TicketRef } from './types'

/** < 3 tiket open → Available. */
export const AVAILABILITY_THRESHOLD = 3

export interface EngineerAvailability {
  engineer: EngineerConfig
  totalOpen: number
  available: boolean
  tickets: TicketRef[]
}

export interface AvailabilitySnapshot {
  generatedAt: Date
  period: Period
  results: EngineerAvailability[]
}

/**
 * Filter LANGSUNG per orang (assignee in (...)) — JQL Jira Cloud menerima display name persis.
 * Sengaja TANPA filter project (beda dari laporan KPI yang 8 project saja).
 */
const buildJql = (period: Period) =>
  [
    `assignee in (${ENGINEERS.map((e) => `"${e.name}"`).join(', ')})`,
    `created >= "${jqlDate(period.start)}"`,
    `created < "${jqlDate(period.end)}"`,
  ].join(' AND ') + ' ORDER BY created DESC'

/**
 * Backlog tim per periode (Q1-Q4/H1-H2 yang sama dengan laporan KPI) — tiket dibuat DI periode itu
 * yang masih open SEKARANG (bukan status akhir periode — Jira tidak simpan histori status per tanggal).
 * "Open" = bukan Done/Development Done/Dropped — status apapun selain ketiga itu (termasuk back-log) dihitung open.
 */
export const getAvailabilitySnapshot = cache(async (periodId: string): Promise<AvailabilitySnapshot> => {
  const period = parsePeriod(periodId)
  if (!period) throw new Error(`Periode tidak valid: ${periodId}`)
  const issues = await searchIssues(buildJql(period))
  const mine = issues.filter((i) => i.assignee && !AVAILABILITY_DONE_STATUSES.has(i.status))

  const byEngineer = new Map<string, typeof mine>()
  for (const i of mine) {
    const arr = byEngineer.get(i.assignee!)
    if (arr) arr.push(i)
    else byEngineer.set(i.assignee!, [i])
  }

  const results: EngineerAvailability[] = ENGINEERS.map((engineer) => {
    const list = byEngineer.get(engineer.name) ?? []
    const tickets: TicketRef[] = list
      .map((i) => ({ key: i.key, summary: i.summary, issueType: i.issueType, status: i.status, done: false, created: i.created }))
    return { engineer, totalOpen: list.length, available: list.length < AVAILABILITY_THRESHOLD, tickets }
  })

  return { generatedAt: new Date(), period, results }
})
