import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { currentPeriodId } from '@/features/kpi/period'

export default async function Home() {
  await connection() // wajib dinamis — kalau tidak, redirect "kuartal berjalan" ikut dibekukan saat build
  redirect(`/report/${currentPeriodId(new Date(), 'quarter')}`)
}
