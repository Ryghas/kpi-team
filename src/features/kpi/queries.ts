import 'server-only'
import { cache } from 'react'
import { computeReport } from './compute'
import { CYCLE_TIME_END, DONE_STATUSES, ENGINEERS, STATUS_OVERRIDES } from './config'
import { searchIssues } from './jira'
import { jqlDate, parsePeriod, quartersOf } from './period'
import type { KpiReport, Period } from './types'

/** Filter LANGSUNG per orang (assignee in (...)), TANPA filter project — sama seperti Ketersediaan Tim & Inisiatif Tracking, supaya tiket di project mana pun tetap terhitung. */
const buildJql = (p: Period) =>
  [
    `assignee in (${ENGINEERS.map((e) => `"${e.name}"`).join(', ')})`,
    `created >= "${jqlDate(p.start)}"`,
    `created < "${jqlDate(p.end)}"`,
  ].join(' AND ') + ' ORDER BY created ASC'

const optionsFor = (periodId: string) => ({
  engineers: ENGINEERS,
  statusOverrides: STATUS_OVERRIDES[periodId],
  doneStatuses: DONE_STATUSES,
  cycleTimeEnd: CYCLE_TIME_END,
})

export interface PeriodReport {
  report: KpiReport
  /** Hanya untuk semester: breakdown per kuartal dari data yang sama (tanpa fetch tambahan). */
  quarters: KpiReport[] | null
}

/** Key string (bukan object) supaya React cache() benar-benar dedupe dalam satu request. Satu fetch Jira per periode; kuartal penyusun semester dihitung ulang in-memory. */
export const getPeriodReport = cache(async (periodId: string): Promise<PeriodReport> => {
  const period = parsePeriod(periodId)
  if (!period) throw new Error(`Periode tidak valid: ${periodId}`)
  const issues = await searchIssues(buildJql(period))
  const report = computeReport(issues, period, optionsFor(period.id))
  const quarters = period.kind === 'semester'
    ? quartersOf(period).map((q) => computeReport(issues, q, optionsFor(q.id)))
    : null
  return { report, quarters }
})
