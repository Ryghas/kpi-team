import { WEIGHTS, crLevel, pcrLevel, round2, scaleFor, stabilityLevel, techLevel } from './rubric'
import { wibDayKey, wibMonthKey } from './period'
import {
  BUG_TYPES, CR_DELIVERY_TYPES, TECH_DEBT_TYPE, WORK_ITEM_TYPES,
  type BugType, type CrDeliveryType, type EngineerConfig, type EngineerResult, type IndicatorExplain,
  type IssueRow, type KpiReport, type Level, type Period, type RankStatus, type WorkItemType,
} from './types'

const fix = (v: number, d = 1) => v.toFixed(d).replace('.', ',')

export interface ComputeOptions {
  engineers: EngineerConfig[]
  statusOverrides?: Partial<Record<string, { status: RankStatus; note: string }>>
  timelineLevels?: Partial<Record<string, Level>>
  defaultTimelineLevel?: Level
  doneStatuses?: ReadonlySet<string>
  cycleTimeEnd?: 'updated' | 'resolved'
  now?: Date
}

const DAY_MS = 86_400_000
const isWorkItem = (t: string): t is WorkItemType => (WORK_ITEM_TYPES as readonly string[]).includes(t)
const isBug = (t: string): t is BugType => (BUG_TYPES as readonly string[]).includes(t)
const isCrDelivery = (t: string): t is CrDeliveryType => (CR_DELIVERY_TYPES as readonly string[]).includes(t)

/** Map.groupBy (ES2024) belum tersedia di semua runtime Node target deploy — polyfill minimal. */
function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const group = map.get(key)
    if (group) group.push(item)
    else map.set(key, [item])
  }
  return map
}

/**
 * Pure function: issues + config → report. Tidak tahu soal Jira, fetch, atau React.
 * Seluruh aturan mengikuti sheet "Penilaian Individu" di workbook KPI.
 */
export function computeReport(issues: IssueRow[], period: Period, opts: ComputeOptions): KpiReport {
  const {
    engineers, statusOverrides = {}, timelineLevels = {}, defaultTimelineLevel = 3,
    doneStatuses = new Set(['Done']), cycleTimeEnd = 'updated', now = new Date(),
  } = opts

  const scale = scaleFor(period.months)
  const inPeriod = issues.filter((i) => i.created >= period.start && i.created < period.end)
  const known = new Set(engineers.map((e) => e.name))
  const unmappedAssignees = [...new Set(inPeriod.map((i) => i.assignee).filter((a): a is string => !!a && !known.has(a)))].sort()

  const byAssignee = groupBy(inPeriod, (i) => i.assignee ?? '')

  // Pass 1 — metrik mentah per engineer
  const draft = engineers.map((engineer) => {
    const mine = byAssignee.get(engineer.name) ?? []
    // Portfolio Completion Rate — Sub-task + Task murni, exclude Bug/Defect (Stability) & Tech Debt (Tech Enhancements).
    const work = mine.filter((i) => isWorkItem(i.issueType))
    // App Stability.
    const bugs = mine.filter((i) => isBug(i.issueType))
    // Tech Enhancements.
    const techDebtTickets = mine.filter((i) => i.issueType === TECH_DEBT_TYPE)
    // CR Delivery — label workbook "CR Delivery (Task/Bug)": Task + Bug/Defect saja, exclude Sub-task & Tech Debt.
    const crTickets = mine.filter((i) => isCrDelivery(i.issueType))
    // Bulan aktif & inisiatif dihitung dari seluruh pekerjaan nyata (union semua kategori di atas).
    const allTracked = [...work, ...bugs, ...techDebtTickets]

    const counts = Object.fromEntries(WORK_ITEM_TYPES.map((t) => [t, 0])) as Record<WorkItemType, number>
    for (const i of work) counts[i.issueType as WorkItemType]++

    const cycleDays = crTickets.map((i) => {
      const end = cycleTimeEnd === 'resolved' ? (i.resolved ?? i.updated) : i.updated
      return (end.getTime() - i.created.getTime()) / DAY_MS
    })

    // On-time memakai SEMUA tipe tiket (termasuk Story), sama seperti workbook
    const withDue = mine.filter((i) => i.dueDate)
    const onTime = withDue.filter((i) => wibDayKey(i.updated) <= i.dueDate!).length

    const activeMonths = new Set(allTracked.map((i) => wibMonthKey(i.created))).size
    const initiatives = [...new Set(allTracked.map((i) => i.initiative).filter((v): v is string => !!v))].sort()
    const status: RankStatus = statusOverrides[engineer.name]?.status ?? engineer.status
    const statusNote = statusOverrides[engineer.name]?.note ?? engineer.note ?? null

    const total = work.length
    const done = work.filter((i) => doneStatuses.has(i.status)).length
    // Hanya story points dari tiket yang sudah Done — tiket belum selesai belum "menghasilkan" apapun.
    const totalStoryPoints = mine.filter((i) => doneStatuses.has(i.status)).reduce((sum, i) => sum + (i.storyPoints ?? 0), 0)

    // Daftar lengkap tiket engineer ini di periode ini (semua tipe, done & belum done) — untuk detail klik-lihat.
    const tickets = [...mine]
      .sort((a, b) => b.created.getTime() - a.created.getTime())
      .map((i) => ({
        key: i.key, summary: i.summary, issueType: i.issueType, status: i.status,
        done: doneStatuses.has(i.status), created: i.created,
      }))

    return {
      engineer, status, statusNote, counts, activeMonths, initiatives, tickets,
      totalStoryPoints,
      totalWorkItems: total,
      doneWorkItems: done,
      donePct: total ? done / total : null,
      dueDateCount: withDue.length,
      onTimeCount: onTime,
      onTimePct: withDue.length ? onTime / withDue.length : null,
      avgCycleDays: cycleDays.length ? cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length : null,
      crCount: crTickets.length,
      totalBugs: bugs.length,
      techDebt: techDebtTickets.length,
    }
  })

  // Pass 2 — rata-rata grup (Ranked saja) → rasio → level → skor
  const groupAvg = new Map<string, number>()
  const groupAvgSP = new Map<string, number>()
  for (const [group, members] of groupBy(draft.filter((d) => d.status === 'Ranked'), (d) => d.engineer.group)) {
    groupAvg.set(group, members.reduce((a, m) => a + m.totalWorkItems, 0) / members.length)
    groupAvgSP.set(group, members.reduce((a, m) => a + m.totalStoryPoints, 0) / members.length)
  }

  const scored = draft.map((d) => {
    const avg = groupAvg.get(d.engineer.group) ?? null
    const avgSP = groupAvgSP.get(d.engineer.group) ?? null
    // Rata-rata grup 0 (tidak ada satupun yang isi Story Points) -> rasio Story Points dianggap 0, bukan diabaikan.
    const ratioWorkItems = avg === null ? null : (avg === 0 ? 0 : d.totalWorkItems / avg)
    const ratioStoryPoints = avgSP === null ? null : (avgSP === 0 ? 0 : d.totalStoryPoints / avgSP)
    const ratio = ratioWorkItems === null || ratioStoryPoints === null
      ? null
      : 0.5 * ratioStoryPoints + 0.5 * ratioWorkItems
    const levels = {
      pcr: ratio === null ? 1 : pcrLevel(ratio),
      timeline: timelineLevels[d.engineer.name] ?? defaultTimelineLevel,
      // Tanpa work item → L1, bukan L5 (workbook mengembalikan 0 hari → L5, itu edge case yang bocor)
      cr: d.avgCycleDays === null ? 1 : crLevel(d.avgCycleDays),
      stability: stabilityLevel(d.totalBugs),
      tech: techLevel(d.techDebt),
    } satisfies EngineerResult['levels']

    const score = round2(
      WEIGHTS.pcr * levels.pcr + WEIGHTS.timeline * levels.timeline + WEIGHTS.cr * levels.cr +
      WEIGHTS.stability * levels.stability + WEIGHTS.tech * levels.tech,
    )

    const timelineFilled = timelineLevels[d.engineer.name] !== undefined

    const explain: IndicatorExplain[] = [
      {
        key: 'pcr', label: 'Portfolio', weight: WEIGHTS.pcr, level: levels.pcr,
        detail: ratio === null
          ? `Tidak ada rata-rata grup untuk dibandingkan (0 engineer Ranked di grup ini) -> L${levels.pcr}.`
          : `(${d.totalStoryPoints} story points ÷ rata-rata ${fix(avgSP ?? 0)} = ${fix(ratioStoryPoints ?? 0, 2)}x) x 0,5 + (${d.totalWorkItems} work item ÷ rata-rata ${fix(avg ?? 0)} = ${fix(ratioWorkItems ?? 0, 2)}x) x 0,5 = ${fix(ratio, 2)}x -> L${levels.pcr}.`,
      },
      {
        key: 'timeline', label: 'Timeline', weight: WEIGHTS.timeline, level: levels.timeline,
        detail: timelineFilled
          ? `Input manual leader untuk periode ini -> L${levels.timeline}.`
          : `Belum diisi leader untuk periode ini, default L${defaultTimelineLevel}.`,
      },
      {
        key: 'cr', label: 'CR Delivery', weight: WEIGHTS.cr, level: levels.cr,
        detail: d.avgCycleDays === null
          ? `Tidak ada tiket Task/Bug/Defect di periode ini -> L${levels.cr}.`
          : `Rata-rata cycle time ${fix(d.avgCycleDays)} hari dari ${d.crCount} tiket -> L${levels.cr}.`,
      },
      {
        key: 'stability', label: 'Stability', weight: WEIGHTS.stability, level: levels.stability,
        detail: `${d.totalBugs} tiket Defect+Bug -> L${levels.stability}.`,
      },
      {
        key: 'tech', label: 'Tech Enhancements', weight: WEIGHTS.tech, level: levels.tech,
        detail: `${d.techDebt} tiket Tech Debt -> L${levels.tech}.`,
      },
    ]

    return { ...d, groupAvg: avg, groupAvgStoryPoints: avgSP, ratioWorkItems, ratioStoryPoints, ratio, levels, explain, score }
  })

  // Pass 3 — peringkat ala Excel RANK(): nilai sama → peringkat sama
  const ranked = scored.filter((s) => s.status === 'Ranked')
  const rankAmong = (score: number, pool: typeof ranked) => 1 + pool.filter((p) => p.score > score).length

  const results: EngineerResult[] = scored
    .map((s) => ({
      ...s,
      rankOverall: s.status === 'Ranked' ? rankAmong(s.score, ranked) : null,
      rankInGroup: s.status === 'Ranked'
        ? rankAmong(s.score, ranked.filter((r) => r.engineer.group === s.engineer.group))
        : null,
    }))
    .sort((a, b) => (a.rankOverall ?? 99) - (b.rankOverall ?? 99) || b.score - a.score)

  return { period, scale, generatedAt: now, issueCount: inPeriod.length, results, unmappedAssignees }
}
