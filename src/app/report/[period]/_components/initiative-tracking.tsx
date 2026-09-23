import { getInitiativeSnapshot } from '@/features/kpi/initiatives'
import type { Group } from '@/features/kpi/types'

interface Props {
  title: string
  group: Group
  periodId: string
}

/** Inisiatif = summary Epic induk dari tiket yang dikerjakan engineer, dari SELURUH project (bukan cuma 8 project KPI). */
export async function InitiativeTracking({ title, group, periodId }: Props) {
  const snap = await getInitiativeSnapshot(periodId)
  const withInitiatives = snap.results.filter((r) => r.engineer.group === group && r.initiatives.length > 0)
  if (withInitiatives.length === 0) return null

  return (
    <section className="mt-10" aria-labelledby={`init-${title}`}>
      <h2 id={`init-${title}`} className="text-xl font-semibold">Inisiatif Tracking - {title}</h2>
      <p className="mt-1 text-sm text-muted">Epic induk dari tiket yang dikerjakan tiap engineer pada periode ini, dari seluruh project.</p>

      <div className="mt-3 space-y-4">
        {withInitiatives.map((r) => (
          <div key={r.engineer.name} className="rounded-lg border border-line bg-white p-4">
            <p className="font-medium text-ink">{r.engineer.name}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {r.initiatives.map((name) => (
                <li key={name} className="rounded-full border border-line bg-paper px-3 py-1 text-xs text-ink">{name}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
