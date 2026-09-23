import 'server-only'
import { cache } from 'react'
import { searchIssues } from './jira'
import { ENGINEERS } from './config'
import { jqlDate, parsePeriod } from './period'
import type { EngineerConfig, Period } from './types'

export interface EngineerInitiatives {
  engineer: EngineerConfig
  initiatives: string[]
}

export interface InitiativeSnapshot {
  period: Period
  results: EngineerInitiatives[]
}

/**
 * Filter LANGSUNG per orang (assignee in (...)), TANPA filter project — beda dari laporan KPI
 * yang 8 project saja. Epic induk (parent bertipe Epic) bisa ada di project mana pun.
 */
const buildJql = (period: Period) =>
  [
    `assignee in (${ENGINEERS.map((e) => `"${e.name}"`).join(', ')})`,
    `created >= "${jqlDate(period.start)}"`,
    `created < "${jqlDate(period.end)}"`,
  ].join(' AND ') + ' ORDER BY created ASC'

/** Inisiatif = summary Epic induk dari SEMUA tiket (tipe apapun) yang dikerjakan engineer di periode ini, dari seluruh project. */
export const getInitiativeSnapshot = cache(async (periodId: string): Promise<InitiativeSnapshot> => {
  const period = parsePeriod(periodId)
  if (!period) throw new Error(`Periode tidak valid: ${periodId}`)

  const issues = await searchIssues(buildJql(period))
  const byEngineer = new Map<string, Set<string>>()
  for (const i of issues) {
    if (!i.assignee || !i.initiative) continue
    const set = byEngineer.get(i.assignee) ?? new Set<string>()
    set.add(i.initiative)
    byEngineer.set(i.assignee, set)
  }

  const results: EngineerInitiatives[] = ENGINEERS.map((engineer) => ({
    engineer,
    initiatives: [...(byEngineer.get(engineer.name) ?? [])].sort(),
  }))

  return { period, results }
})
