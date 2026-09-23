import { stabilityThresholds, techThresholds } from '@/features/kpi/rubric'
import type { KpiReport } from '@/features/kpi/types'

const ROWS = (s: [number, number, number, number], t: [number, number, number, number]) => [
  { label: 'Portfolio', unit: 'rata-rata grup', l5: '≥1,10x', l4: '≥1,00x', l3: '≥0,90x', l2: '≥0,80x', l1: '<0,80x' },
  { label: 'CR Delivery', unit: 'hari rata-rata', l5: '≤3', l4: '≤7', l3: '≤14', l2: '≤21', l1: '>21' },
  { label: 'Stability', unit: 'defect + bug', l5: `≤${s[0]}`, l4: `≤${s[1]}`, l3: `≤${s[2]}`, l2: `≤${s[3]}`, l1: `>${s[3]}` },
  { label: 'Tech', unit: 'tiket tech debt', l5: `≥${t[0]}`, l4: `≥${t[1]}`, l3: `≥${t[2]}`, l2: '≥1', l1: '0' },
]

export function RubricNotes({ report: _report }: { report: KpiReport }) {
  const stability = stabilityThresholds()
  const tech = techThresholds()
  const rows = ROWS(stability, tech)

  return (
    <footer className="mt-12 border-t border-line pt-6 text-sm text-muted">
      <h2 className="font-semibold text-ink">Ambang Penilaian</h2>
      <p className="mt-2 max-w-prose">
        Ambang sama persis untuk semua periode (Q1-Q4 maupun H1-H2) — tidak disesuaikan
        dengan panjang periode.
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line text-left text-xs">
            <tr>
              <th scope="col" className="px-3 py-2">Kategori</th>
              <th scope="col" className="px-3 py-2 text-center">L5</th>
              <th scope="col" className="px-3 py-2 text-center">L4</th>
              <th scope="col" className="px-3 py-2 text-center">L3</th>
              <th scope="col" className="px-3 py-2 text-center">L2</th>
              <th scope="col" className="px-3 py-2 text-center">L1</th>
              <th scope="col" className="px-3 py-2">Satuan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-line last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-ink">{r.label}</th>
                <td className="px-3 py-2 text-center">{r.l5}</td>
                <td className="px-3 py-2 text-center">{r.l4}</td>
                <td className="px-3 py-2 text-center">{r.l3}</td>
                <td className="px-3 py-2 text-center">{r.l2}</td>
                <td className="px-3 py-2 text-center">{r.l1}</td>
                <td className="px-3 py-2">{r.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </footer>
  )
}
