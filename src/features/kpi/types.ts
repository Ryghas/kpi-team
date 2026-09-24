/**
 * Portfolio Completion Rate (throughput) dan done% — mencakup SEMUA tipe kerja nyata per instruksi leader:
 * Task, Sub-task, Defect, Bug, Tech Debt, Documentation, Story. Defect/Bug/Tech Debt sengaja dobel-hitung
 * (juga masuk BUG_TYPES/Stability dan TECH_DEBT_TYPE/Tech Enhancements) — bukan bug, permintaan eksplisit.
 */
export const WORK_ITEM_TYPES = ['Task', 'Sub-task', 'Defect', 'Bug', 'Tech Debt', 'Documentation', 'Story'] as const
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number]

/** Union Defect+Bug — dipakai untuk bulan aktif & inisiatif saja (bukan skor Stability, itu Defect saja). */
export const BUG_TYPES = ['Defect', 'Bug'] as const
export type BugType = (typeof BUG_TYPES)[number]

/** Stability — HANYA tiket Defect (Bug dipindah ke indikator CR Delivery). */
export const DEFECT_TYPE = 'Defect'

/** CR Delivery (baru) — jumlah tiket Bug, pakai ambang count yang sama dengan Tech Enhancements (L5..L1). */
export const BUG_TYPE = 'Bug'

/** Tech Enhancements. */
export const TECH_DEBT_TYPE = 'Tech Debt'

/** Timeline (baru) — cycle time Task + Bug/Defect, dulu ini yang dipakai untuk CR Delivery sebelum digeser. */
export const TIMELINE_CYCLE_TYPES = ['Task', 'Defect', 'Bug'] as const
export type TimelineCycleType = (typeof TIMELINE_CYCLE_TYPES)[number]

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
  cycleTicketCount: number
  defectCount: number
  bugCount: number
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
