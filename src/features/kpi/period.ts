import type { Period } from './types'

const WIB_OFFSET = '+07:00'
const PERIOD_RE = /^(\d{4})-(Q[1-4]|H[12]|FY)$/

const wibDate = (year: number, month0: number) =>
  // month0 bisa 12 → otomatis roll ke Januari tahun berikutnya via Date.UTC trick di bawah
  new Date(`${year + Math.floor(month0 / 12)}-${String((month0 % 12) + 1).padStart(2, '0')}-01T00:00:00${WIB_OFFSET}`)

export function parsePeriod(id: string): Period | null {
  const m = PERIOD_RE.exec(id)
  if (!m) return null
  const year = Number(m[1])
  const code = m[2]!

  if (code === 'FY') {
    return {
      id, kind: 'year', months: 12,
      label: `${year} (Jan–Des)`,
      start: wibDate(year, 0),
      end: wibDate(year, 12),
    }
  }

  const idx = Number(code[1]) - 1
  if (code.startsWith('Q')) {
    const startMonth = idx * 3
    return {
      id, kind: 'quarter', months: 3,
      label: `Q${idx + 1} ${year} (${monthName(startMonth)}–${monthName(startMonth + 2)})`,
      start: wibDate(year, startMonth),
      end: wibDate(year, startMonth + 3),
    }
  }
  const startMonth = idx * 6
  return {
    id, kind: 'semester', months: 6,
    label: `H${idx + 1} ${year} (${monthName(startMonth)}–${monthName(startMonth + 5)})`,
    start: wibDate(year, startMonth),
    end: wibDate(year, startMonth + 6),
  }
}

/** Dua kuartal penyusun sebuah semester — dipakai untuk tren QoQ. */
export function quartersOf(semester: Period): Period[] {
  const year = semester.id.slice(0, 4)
  const h = Number(semester.id.slice(-1))
  return [`${year}-Q${h * 2 - 1}`, `${year}-Q${h * 2}`].map((id) => parsePeriod(id)!)
}

export function currentPeriodId(now: Date, kind: 'quarter' | 'semester' = 'quarter'): string {
  const wib = new Date(now.getTime() + 7 * 3_600_000)
  const y = wib.getUTCFullYear()
  const m = wib.getUTCMonth()
  return kind === 'quarter' ? `${y}-Q${Math.floor(m / 3) + 1}` : `${y}-H${m < 6 ? 1 : 2}`
}

export const isOngoing = (p: Period, now: Date) => now >= p.start && now < p.end

/** 'YYYY-MM' dalam WIB — untuk hitung bulan aktif. */
export const wibMonthKey = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 7)
/** 'YYYY-MM-DD' dalam WIB — untuk bandingkan dengan due date. */
export const wibDayKey = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10)

/** Format tanggal JQL (zona waktu mengikuti profil akun Jira — set akun service ke Asia/Jakarta). */
export const jqlDate = (d: Date) => wibDayKey(d)

/** Awal-akhir bulan berjalan WIB, sebagai pasangan 'YYYY-MM-DD' inklusif. */
export function wibMonthRange(now: Date): [string, string] {
  const wib = new Date(now.getTime() + 7 * 3_600_000)
  const y = wib.getUTCFullYear()
  const m = wib.getUTCMonth()
  const first = new Date(Date.UTC(y, m, 1))
  const last = new Date(Date.UTC(y, m + 1, 0))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return [fmt(first), fmt(last)]
}

/** Senin-Minggu minggu berjalan WIB, sebagai pasangan 'YYYY-MM-DD' inklusif. */
export function wibWeekRange(now: Date): [string, string] {
  const wib = new Date(now.getTime() + 7 * 3_600_000)
  const dow = wib.getUTCDay() // 0=Minggu..6=Sabtu
  const mondayOffset = (dow + 6) % 7 // hari sejak Senin
  const monday = new Date(Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate() - mondayOffset))
  const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return [fmt(monday), fmt(sunday)]
}

function monthName(m: number) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m % 12]!
}
