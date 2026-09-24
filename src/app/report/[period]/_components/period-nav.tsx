import Link from 'next/link'
import type { Period } from '@/features/kpi/types'

const CODES = [
  { label: 'Kuartal', items: ['Q1', 'Q2', 'Q3', 'Q4'] },
  { label: 'Semester', items: ['H1', 'H2'] },
  { label: 'Tahun', items: ['FY'] },
] as const

export function PeriodNav({ active }: { active: Period }) {
  const year = Number(active.id.slice(0, 4))
  const code = active.id.slice(5)

  return (
    <nav aria-label="Pilih periode" className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Link href={`/report/${year - 1}-${code}`} className="px-2 py-1 text-muted hover:text-ink" aria-label={`Tahun ${year - 1}`}>‹</Link>
        <span className="font-medium">{year}</span>
        <Link href={`/report/${year + 1}-${code}`} className="px-2 py-1 text-muted hover:text-ink" aria-label={`Tahun ${year + 1}`}>›</Link>
      </div>
      {CODES.map((group) => (
        <div key={group.label} role="group" aria-label={group.label} className="flex overflow-hidden rounded-md border border-line bg-white">
          {group.items.map((c) => {
            const isActive = c === code
            return (
              <Link
                key={c}
                href={`/report/${year}-${c}`}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-1.5 ${isActive ? 'bg-ink text-white' : 'hover:bg-paper'}`}
              >
                {c === 'FY' ? '1 Tahun' : c}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
