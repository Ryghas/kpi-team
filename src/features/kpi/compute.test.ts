import { describe, expect, it } from 'vitest'
import { computeReport } from './compute'
import { parsePeriod, quartersOf, currentPeriodId } from './period'
import { stabilityLevel, techLevel } from './rubric'
import type { EngineerConfig, IssueRow } from './types'

const engineers: EngineerConfig[] = [
  { name: 'A', role: 'Mobile', group: 'Mobile', status: 'Ranked' },
  { name: 'B', role: 'Mobile', group: 'Mobile', status: 'Ranked' },
  { name: 'C', role: 'FE', group: 'FE', status: 'Ranked' },
  { name: 'Intern', role: 'FE', group: 'FE', status: 'Non-Ranked', note: 'magang' },
]

let seq = 0
const issue = (assignee: string, created: string, type = 'Sub-task', extra: Partial<IssueRow> = {}): IssueRow => ({
  key: `X-${++seq}`, summary: `Tiket ${seq}`, project: 'Simetris', issueType: type, status: 'Done', assignee,
  created: new Date(`${created}T09:00:00+07:00`), updated: new Date(`${created}T09:00:00+07:00`),
  resolved: null, dueDate: null, initiative: null, storyPoints: null, ...extra,
})

describe('period', () => {
  it('memetakan kuartal & semester ke rentang WIB', () => {
    const q3 = parsePeriod('2026-Q3')!
    expect(q3.start.toISOString()).toBe('2026-06-30T17:00:00.000Z')
    expect(q3.end.toISOString()).toBe('2026-09-30T17:00:00.000Z')
    expect(parsePeriod('2026-Q4')!.end.toISOString()).toBe('2026-12-31T17:00:00.000Z')
    expect(quartersOf(parsePeriod('2026-H2')!).map((q) => q.id)).toEqual(['2026-Q3', '2026-Q4'])
    expect(parsePeriod('2026-Q5')).toBeNull()
  })

  it('menentukan periode berjalan dalam WIB', () => {
    // 30 Jun 18:00 UTC = 1 Jul 01:00 WIB → sudah Q3
    expect(currentPeriodId(new Date('2026-06-30T18:00:00Z'))).toBe('2026-Q3')
  })
})

describe('rubric thresholds (tetap, tidak di-skala per panjang periode)', () => {
  it('ambang bug dan tech debt sama di semua periode', () => {
    expect(stabilityLevel(3)).toBe(5)  // L5 ≤3
    expect(stabilityLevel(4)).toBe(4)  // L4 ≤6
    expect(stabilityLevel(10)).toBe(2) // L2 ≤12
    expect(stabilityLevel(13)).toBe(1) // L1 >12
    expect(techLevel(1)).toBe(2)       // L2 ≥1
    expect(techLevel(6)).toBe(5)       // L5 ≥6
    expect(techLevel(0)).toBe(1)       // L1 = 0
  })
})

describe('computeReport', () => {
  const q3 = parsePeriod('2026-Q3')!
  const months = ['2026-07-10', '2026-08-10', '2026-09-10']

  it('rasio dihitung terhadap rata-rata grup Ranked saja, intern tidak ikut baseline', () => {
    const issues = [
      ...months.flatMap((m) => Array.from({ length: 10 }, () => issue('A', m))),
      ...months.flatMap((m) => Array.from({ length: 5 }, () => issue('B', m))),
      ...months.flatMap((m) => Array.from({ length: 4 }, () => issue('C', m))),
      ...months.map((m) => issue('Intern', m)),
    ]
    const r = computeReport(issues, q3, { engineers })
    const get = (n: string) => r.results.find((x) => x.engineer.name === n)!

    // Tiket tidak set storyPoints -> totalStoryPoints 0 untuk semua -> ratioStoryPoints 0 (rata-rata grup 0).
    // ratio = 0,5 * ratioStoryPoints(0) + 0,5 * ratioWorkItems.
    expect(get('A').groupAvg).toBe(22.5)
    expect(get('A').ratioStoryPoints).toBe(0)
    expect(get('A').ratio).toBeCloseTo(0.5 * (30 / 22.5))
    expect(get('A').levels.pcr).toBe(1)
    expect(get('B').levels.pcr).toBe(1)
    expect(get('C').ratio).toBe(0.5) // satu-satunya FE ranked: ratioWorkItems 1x, ratioStoryPoints 0
    expect(get('Intern').rankInGroup).toBeNull()
  })

  it('Portfolio = 0,5 x rasio Story Points + 0,5 x rasio Work Item, masing-masing terhadap rata-rata grup sendiri', () => {
    const issues = [
      // A: 4 tiket, total 20 story points
      issue('A', months[0]!, 'Task', { storyPoints: 5 }),
      issue('A', months[0]!, 'Task', { storyPoints: 5 }),
      issue('A', months[1]!, 'Task', { storyPoints: 5 }),
      issue('A', months[2]!, 'Task', { storyPoints: 5 }),
      // B: 2 tiket, total 10 story points (tidak isi story points sama sekali di 1 tiket)
      issue('B', months[0]!, 'Task', { storyPoints: 10 }),
      issue('B', months[1]!, 'Task', { storyPoints: null }),
    ]
    const r = computeReport(issues, q3, { engineers })
    const get = (n: string) => r.results.find((x) => x.engineer.name === n)!

    // rata-rata grup Mobile: work item (4+2)/2=3, story points (20+10)/2=15
    expect(get('A').groupAvg).toBe(3)
    expect(get('A').groupAvgStoryPoints).toBe(15)
    expect(get('A').ratioWorkItems).toBeCloseTo(4 / 3)
    expect(get('A').ratioStoryPoints).toBeCloseTo(20 / 15)
    expect(get('A').ratio).toBeCloseTo(0.5 * (20 / 15) + 0.5 * (4 / 3))
  })

  it('mengabaikan tiket di luar periode dan Story, tanpa syarat minimum bulan aktif', () => {
    const issues = [
      issue('A', '2026-06-30'), // Q2
      issue('A', '2026-07-01', 'Story'),
      issue('A', '2026-07-02'),
      ...months.map((m) => issue('B', m)),
    ]
    const r = computeReport(issues, q3, { engineers })
    const a = r.results.find((x) => x.engineer.name === 'A')!
    expect(a.totalWorkItems).toBe(1)
    expect(a.activeMonths).toBe(1)
    expect(a.status).toBe('Ranked')
  })

  it('on-time membandingkan tanggal Updated (WIB) dengan due date', () => {
    const issues = [
      issue('A', '2026-07-10', 'Task', { updated: new Date('2026-07-20T23:30:00+07:00'), dueDate: '2026-07-20' }),
      issue('A', '2026-07-10', 'Task', { updated: new Date('2026-07-21T00:10:00+07:00'), dueDate: '2026-07-20' }),
    ]
    const a = computeReport(issues, q3, { engineers }).results.find((x) => x.engineer.name === 'A')!
    expect([a.onTimeCount, a.dueDateCount]).toEqual([1, 2])
  })

  it('melaporkan assignee yang belum ada di konfigurasi', () => {
    const r = computeReport([issue('Prames', '2026-07-10')], q3, { engineers })
    expect(r.unmappedAssignees).toEqual(['Prames'])
  })
})
