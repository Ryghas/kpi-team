/**
 * Portfolio Completion Rate (throughput) dan done% — mencakup SEMUA tipe kerja nyata per instruksi leader:
 * Task, Sub-task, Defect, Bug, Tech Debt, Documentation. Defect/Bug/Tech Debt sengaja dobel-hitung
 * (juga masuk BUG_TYPES/Stability dan TECH_DEBT_TYPE/Tech Enhancements) — bukan bug, permintaan eksplisit.
 */
export const WORK_ITEM_TYPES = ['Task', 'Sub-task', 'Defect', 'Bug', 'Tech Debt', 'Documentation'] as const
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number]

/** App Stability. */
export const BUG_TYPES = ['Defect', 'Bug'] as const
export type BugType = (typeof BUG_TYPES)[number]

/** Tech Enhancements. */
export const TECH_DEBT_TYPE = 'Tech Debt'

/** CR Delivery (cycle time) — persis label workbook "CR Delivery (Task/Bug)": Task + Bug/Defect saja, exclude Sub-task & Tech Debt. */
export const CR_DELIVERY_TYPES = ['Task', 'Defect', 'Bug'] as const
export type CrDeliveryType = (typeof CR_DELIVERY_TYPES)[number]

export type Group = 'FE' | 'Mobile'
export type RankStatus = 'Ranked' | 'Non-Ranked'
export type Level = 1 | 2 | 3 | 4 | 5

/** Satu baris issue Jira yang sudah dinormalisasi — satu-satunya bentuk data yang dikenal compute layer. */
export interface IssueRow {
  key: string
  summary: string
  project: string
  issueType: string
  status: string
  assignee: string | null
  created: Date
  updated: Date
  resolved: Date | null
  dueDate: string | null // 'YYYY-MM-DD' — Jira menyimpan due date tanpa jam
  initiative: string | null // summary Epic induk - null bila parent bukan Epic atau tiket top-level
  storyPoints: number | null // customfield_10032 "Story Points" - jarang diisi tim Mobile
}

/** Ringkasan satu tiket untuk daftar "task saya" — dipakai di detail per-engineer (klik untuk lihat list). */
export interface TicketRef {
  key: string
  summary: string
  issueType: string
  status: string
  done: boolean
  created: Date
}

export interface EngineerConfig {
  name: string // harus sama persis dengan displayName assignee di Jira
  role: string
  group: Group
  status: RankStatus
  note?: string
}

export type PeriodKind = 'quarter' | 'semester' | 'year'

export interface Period {
  id: string // '2026-Q3' | '2026-H2'
  kind: PeriodKind
  label: string
  months: number
  start: Date // inclusive, WIB
  end: Date // exclusive, WIB
}

export interface LevelSet {
  pcr: Level
  timeline: Level
  cr: Level
  stability: Level
  tech: Level
}

/** Penjelasan satu indikator skor: dari mana angkanya dan kenapa jatuh ke level itu. */
export interface IndicatorExplain {
  key: keyof LevelSet
  label: string
  weight: number
  level: Level
  detail: string
}

export interface EngineerResult {
  engineer: EngineerConfig
  status: RankStatus
  statusNote: string | null
  counts: Record<WorkItemType, number>
  totalStoryPoints: number
  totalWorkItems: number
  doneWorkItems: number
  donePct: number | null
  groupAvg: number | null
  groupAvgStoryPoints: number | null
  ratioWorkItems: number | null
  ratioStoryPoints: number | null
  ratio: number | null
  dueDateCount: number
  onTimeCount: number
  onTimePct: number | null
  avgCycleDays: number | null
  totalBugs: number
  techDebt: number
  activeMonths: number
  initiatives: string[]
  tickets: TicketRef[]
  levels: LevelSet
  explain: IndicatorExplain[]
  score: number
  rankInGroup: number | null
  rankOverall: number | null
}

export interface KpiReport {
  period: Period
  scale: number
  generatedAt: Date
  issueCount: number
  results: EngineerResult[]
  unmappedAssignees: string[]
}
