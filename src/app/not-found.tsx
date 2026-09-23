import Link from 'next/link'
import { currentPeriodId } from '@/features/kpi/period'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-2xl font-semibold">Periode tidak dikenali</h1>
      <p className="mt-2 text-muted">Format yang valid: <code>2026-Q3</code> untuk kuartal atau <code>2026-H2</code> untuk semester.</p>
      <Link href={`/report/${currentPeriodId(new Date())}`} className="mt-6 inline-block font-medium text-accent underline">
        Buka kuartal berjalan
      </Link>
    </main>
  )
}
