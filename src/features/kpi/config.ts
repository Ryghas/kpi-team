import type { EngineerConfig } from './types'

/**
 * Konfigurasi tim. Semua "input leader" hidup di file ini dan berubah lewat PR —
 * aplikasinya sendiri view-only, jadi tidak ada form, tidak ada database.
 */
export const DONE_STATUSES = new Set(['Done', 'Development Done'])

/** Dikeluarkan dari Ketersediaan Tim (hitungan maupun daftar) — dianggap selesai/tidak berlanjut, sama seperti Done. */
export const AVAILABILITY_DONE_STATUSES = new Set(['Done', 'Development Done', 'Dropped'])

/**
 * Ujung cycle time. 'updated' = paritas dengan workbook Excel (kolom Resolved kosong di export).
 * Ganti ke 'resolved' setelah workflow Jira mengisi resolutiondate secara konsisten —
 * hasilnya lebih akurat karena tidak memanjang saat tiket disentuh ulang.
 */
export const CYCLE_TIME_END: 'updated' | 'resolved' = 'updated'

export const ENGINEERS: EngineerConfig[] = [
  { name: 'Riza Ari', role: 'Front End Developer', group: 'FE', status: 'Ranked' },
  { name: 'Irwan Aryanto', role: 'Front End Developer', group: 'FE', status: 'Ranked' },
  { name: 'Prames Ray Lapian', role: 'Front End Developer', group: 'FE', status: 'Ranked' },
  { name: 'Maulana Zidan Adi Wibowo', role: 'Intern (Front End)', group: 'FE', status: 'Ranked', note: 'Magang' },
  { name: 'Muhammad Rifaldi Judri', role: 'Mobile Developer', group: 'Mobile', status: 'Ranked' },
  { name: 'Farhad Zaman Zuhdi', role: 'Mobile Developer', group: 'Mobile', status: 'Ranked' },
  { name: 'Bobby Ryan Hartono', role: 'Mobile Developer', group: 'Mobile', status: 'Ranked' },
  { name: 'm alfin nurdiansyah', role: 'Mobile Developer', group: 'Mobile', status: 'Ranked' },
  { name: 'Christian', role: 'Mobile Developer', group: 'Mobile', status: 'Ranked' },
]

/**
 * Override status per periode. Aturan otomatis "bulan aktif minimum" tetap berlaku di atas override ini.
 */
export const STATUS_OVERRIDES: Record<string, Partial<Record<string, { status: 'Ranked' | 'Non-Ranked'; note: string }>>> = {}
