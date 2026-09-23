import { getAvailabilitySnapshot } from '@/features/kpi/availability'
import { TicketListToggle } from './ticket-list-toggle'

/** Backlog tim untuk periode yang sama dengan laporan KPI (Q1-Q4/H1-H2) — tiket dibuat di periode itu yang masih open sekarang. */
export async function TeamAvailability({ periodId }: { periodId: string }) {
  const snap = await getAvailabilitySnapshot(periodId)

  return (
    <section className="mt-10" aria-labelledby="team-availability">
      <h2 id="team-availability" className="text-xl font-semibold">Ketersediaan Tim</h2>
      <p className="mt-1 text-sm text-muted">
        Tiket dibuat di {snap.period.label} yang masih open sampai sekarang (bukan Done, Development Done, atau Dropped) - diperbarui{' '}
        {snap.generatedAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB.
        Available berarti kurang dari 3 tiket open.
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2">Engineer</th>
              <th scope="col" className="px-3 py-2">Group</th>
              <th scope="col" className="px-3 py-2 text-center">Total open</th>
              <th scope="col" className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {snap.results.map((r) => (
              <tr key={r.engineer.name} className="border-b border-line last:border-0">
                <th scope="row" className="px-3 py-3 text-left font-normal">
                  <TicketListToggle name={r.engineer.name} tickets={r.tickets} />
                </th>
                <td className="px-3 py-3 text-muted">{r.engineer.group}</td>
                <td className="px-3 py-3 text-center font-semibold text-ink">{r.totalOpen}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${r.available ? 'bg-l5/15 text-l5' : 'bg-l1/15 text-l1'}`}>
                    {r.available ? 'Available' : 'Sibuk'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
