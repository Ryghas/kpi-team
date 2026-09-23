import type { Level } from './types'

/**
 * Rubrik = 1:1 dengan sheet "Index Penilaian" (Mar–Jul 2026, 5 bulan).
 * Metrik yang bersifat ABSOLUT (jumlah bug, jumlah tech debt) di-prorate ke panjang periode,
 * karena ambang "<= 4 bug" untuk 5 bulan tidak adil dipakai untuk 3 bulan maupun 6 bulan.
 * Metrik rasio (PCR) dan rata-rata (cycle time) tidak perlu di-scale.
 */
export const BASELINE_MONTHS = 5

export const WEIGHTS = { pcr: 0.3, timeline: 0.2, cr: 0.2, stability: 0.2, tech: 0.1 } as const

export const scaleFor = (months: number) => months / BASELINE_MONTHS

export function pcrLevel(ratio: number): Level {
  if (ratio >= 1.1) return 5
  if (ratio >= 1.0) return 4
  if (ratio >= 0.9) return 3
  if (ratio >= 0.8) return 2
  return 1
}

export function crLevel(avgDays: number): Level {
  if (avgDays <= 3) return 5
  if (avgDays <= 7) return 4
  if (avgDays <= 14) return 3
  if (avgDays <= 21) return 2
  return 1
}

/** Ambang tetap (tidak di-skala per panjang periode) — sama persis di semua periode Q1-Q4/H1-H2. */
export const stabilityThresholds = (): [number, number, number, number] => [3, 6, 9, 12]

export function stabilityLevel(bugs: number): Level {
  const [l5, l4, l3, l2] = stabilityThresholds()
  if (bugs <= l5) return 5
  if (bugs <= l4) return 4
  if (bugs <= l3) return 3
  if (bugs <= l2) return 2
  return 1
}

/** Ambang tetap (tidak di-skala per panjang periode) — sama persis di semua periode Q1-Q4/H1-H2. */
export const techThresholds = (): [number, number, number, number] => [6, 4, 2, 1]

export function techLevel(count: number): Level {
  const [l5, l4, l3, l2] = techThresholds()
  if (count >= l5) return 5
  if (count >= l4) return 4
  if (count >= l3) return 3
  if (count >= l2) return 2
  return 1
}

/** Syarat eligibility #1: aktif min. 3 dari 5 bulan → 60% dari panjang periode. */
export const minActiveMonths = (months: number) => Math.ceil(months * 0.6)

/** Excel ROUND(x, 2) */
export const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100
