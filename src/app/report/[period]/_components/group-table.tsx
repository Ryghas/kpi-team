import type { EngineerResult, KpiReport } from '@/features/kpi/types'
import { LevelCell } from './level-cell'
import { TicketListToggle } from './ticket-list-toggle'

const pct = (v: number | null) => (v === null ? '-' : `${Math.round(v * 100)}%`)
const fix = (v: number | null, d = 1) => (v === null ? '-' : v.toFixed(d).replace('.', ','))

interface Props {
  title: string
  results: EngineerResult[]
  quarters: KpiReport[] | null
  periodId: string
}

export function GroupTable({ title, results, quarters, periodId }: Props) {
  if (results.length === 0) return null
  const ranked = results.filter((r) => r.status === 'Ranked')
  const others = results.filter((r) => r.status !== 'Ranked')
  const groupAvg = ranked[0]?.groupAvg ?? null
  const groupAvgSP = ranked[0]?.groupAvgStoryPoints ?? null
  // Export Excel cuma masuk akal untuk ringkasan 1 tahun penuh, bukan kuartal/semester.
  const canExport = periodId.endsWith('-FY')

  const quarterScore = (name: string) =>
    quarters?.map((q) => q.results.find((r) => r.engineer.name === name)) ?? []

  return (
    <section className="mt-10" aria-labelledby={`g-${title}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id={`g-${title}`} className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted">Rata-rata grup {fix(groupAvgSP)} story points, {fix(groupAvg)} work item ({ranked.length} engineer ranked)</p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr>
              <th scope="col" className="w-12 px-3 py-2 text-center">#</th>
              <th scope="col" className="px-3 py-2">Engineer</th>
              <th scope="col" className="px-3 py-2 text-right">Total Story Points</th>
              <th scope="col" className="px-3 py-2 text-right">Work item</th>
              <th scope="col" className="px-2 py-2 text-center">Portfolio<br />30%</th>
              <th scope="col" className="px-2 py-2 text-center">Timeline<br />20%</th>
              <th scope="col" className="px-2 py-2 text-center">CR Delivery<br />20%</th>
              <th scope="col" className="px-2 py-2 text-center">Stability<br />20%</th>
              <th scope="col" className="px-2 py-2 text-center">Tech<br />10%</th>
              <th scope="col" className="px-3 py-2 text-right">Skor</th>
              {canExport && <th scope="col" className="px-3 py-2 text-center">Export</th>}
              {quarters && quarters.map((q) => (
                <th key={q.period.id} scope="col" className="px-3 py-2 text-right">{q.period.id.slice(5)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...ranked, ...others].map((r, i) => {
              const isFirstOther = r.status !== 'Ranked' && i === ranked.length
              const qs = quarterScore(r.engineer.name)
              return (
                <tr
                  key={r.engineer.name}
                  className={`border-b border-line last:border-0 ${r.status !== 'Ranked' ? 'text-muted' : ''} ${isFirstOther ? 'border-t-2 border-t-line' : ''}`}
                >
                  <td className="px-3 py-3 text-center text-base font-semibold">{r.rankInGroup ?? '-'}</td>
                  <th scope="row" className="px-3 py-3 text-left font-normal">
                    <TicketListToggle name={r.engineer.name} tickets={r.tickets} indicators={r.explain} />
                    <span className="block text-xs text-muted">
                      {r.engineer.role}{r.statusNote ? `. ${r.statusNote}` : ''}
                    </span>
                  </th>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <span className="font-medium">{r.totalStoryPoints}</span>
                    <span className="block text-xs text-muted">{fix(r.ratioStoryPoints, 2)}x rata-rata</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <span className="font-medium">{r.totalWorkItems}</span>
                    <span className="block text-xs text-muted">{fix(r.ratioWorkItems, 2)}x, {pct(r.donePct)} done</span>
                  </td>
                  <td className="px-2 py-3"><LevelCell level={r.levels.pcr} hint={`(SP ${fix(r.ratioStoryPoints, 2)}x x 50%) + (Work ${fix(r.ratioWorkItems, 2)}x x 50%) = ${fix(r.ratio, 2)}x`} /></td>
                  <td className="px-2 py-3"><LevelCell level={r.levels.timeline} hint={`Rata-rata cycle time ${fix(r.avgCycleDays)} hari`} /></td>
                  <td className="px-2 py-3"><LevelCell level={r.levels.cr} hint={`${r.bugCount} tiket Bug`} /></td>
                  <td className="px-2 py-3"><LevelCell level={r.levels.stability} hint={`${r.defectCount} tiket Defect`} /></td>
                  <td className="px-2 py-3"><LevelCell level={r.levels.tech} hint={`${r.techDebt} tiket tech debt`} /></td>
                  <td className="px-3 py-3 text-right text-base font-semibold text-ink">{fix(r.score, 2)}</td>
                  {canExport && (
                    <td className="px-3 py-3 text-center">
                      <a
                        href={`/report/${periodId}/export?engineer=${encodeURIComponent(r.engineer.name)}`}
                        className="text-xs font-medium text-accent underline underline-offset-2 hover:no-underline"
                      >
                        Excel
                      </a>
                    </td>
                  )}
                  {quarters && qs.map((q, qi) => (
                    <td key={qi} className="px-3 py-3 text-right">
                      {q && q.totalWorkItems > 0 ? fix(q.score, 2) : '-'}
                      {qi === 1 && qs[0] && q && qs[0].totalWorkItems > 0 && q.totalWorkItems > 0 && (
                        <Delta value={q.score - qs[0].score} />
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Delta({ value }: { value: number }) {
  if (Math.abs(value) < 0.005) return <span className="block text-xs text-muted">tetap</span>
  const up = value > 0
  return (
    <span className={`block whitespace-nowrap text-xs ${up ? 'text-l5' : 'text-l1'}`}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(2).replace('.', ',')}
    </span>
  )
}
