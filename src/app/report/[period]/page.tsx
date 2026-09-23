import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPeriodReport } from '@/features/kpi/queries'
import { isOngoing, parsePeriod } from '@/features/kpi/period'
import { TIMELINE_LEVELS } from '@/features/kpi/config'
import { PeriodNav } from './_components/period-nav'
import { GroupTable } from './_components/group-table'
import { RubricNotes } from './_components/rubric-notes'
import { TeamAvailability } from './_components/team-availability'
import { InitiativeTracking } from './_components/initiative-tracking'
import type { Group } from '@/features/kpi/types'

type Props = { params: Promise<{ period: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = parsePeriod((await params).period)
  return { title: p ? `KPI ${p.label}` : 'KPI' }
}

const GROUPS: { id: Group; title: string }[] = [
  { id: 'Mobile', title: 'Mobile' },
  { id: 'FE', title: 'Frontend' },
]

export default async function ReportPage({ params }: Props) {
  const { period: periodId } = await params
  const period = parsePeriod(periodId)
  if (!period) notFound()

  const { report, quarters } = await getPeriodReport(period.id)
  const now = new Date()
  const ongoing = isOngoing(period, now)
  const timelineFilled = Object.keys(TIMELINE_LEVELS[period.id] ?? {}).length > 0

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-6 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">Penilaian kinerja engineer Mobile & Frontend</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{period.label}</h1>
          <p className="mt-2 text-sm text-muted">
            {report.issueCount.toLocaleString('id-ID')} tiket Jira dibuat dalam periode ini, diperbarui{' '}
            {report.generatedAt.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })} WIB
          </p>
        </div>
        <PeriodNav active={period} />
      </header>

      {(ongoing || !timelineFilled) && (
        <div className="mt-6 space-y-1 border-l-4 border-l2 bg-white px-4 py-3 text-sm">
          {ongoing && <p>Periode masih berjalan. Angka akan berubah sampai periode ditutup, jadi jangan dipakai sebagai skor final.</p>}
          {!timelineFilled && <p>Level Timeline Commitment belum diisi leader untuk periode ini, semua engineer memakai default L3.</p>}
        </div>
      )}

      {GROUPS.map((g) => (
        <GroupTable
          key={g.id}
          title={g.title}
          results={report.results.filter((r) => r.engineer.group === g.id)}
          quarters={quarters}
        />
      ))}

      <TeamAvailability periodId={period.id} />

      {GROUPS.map((g) => (
        <InitiativeTracking key={g.id} title={g.title} group={g.id} periodId={period.id} />
      ))}

      <RubricNotes report={report} />
    </main>
  )
}
