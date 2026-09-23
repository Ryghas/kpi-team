# KPI Report — Mobile & Frontend

Dashboard read-only untuk laporan KPI engineer per **kuartal** (`/report/2026-Q3`) dan **semester** (`/report/2026-H2`), ditarik langsung dari Jira Cloud. Tidak ada database, tidak ada form, tidak ada write call ke Jira.

## Setup

```bash
cp .env.example .env.local   # isi JIRA_* dan DASHBOARD_*
npm install
npm run dev                  # http://localhost:3000 → redirect ke kuartal berjalan
npm test                     # unit test domain layer
```

Token Jira: buat dari akun service yang hanya punya permission **Browse Projects** di 8 project tim, dan set timezone profil akun tersebut ke **Asia/Jakarta** (JQL `created >=` mengikuti timezone akun).

## Arsitektur

```
src/
├── app/
│   ├── page.tsx                      redirect ke kuartal berjalan (dinamis)
│   └── report/[period]/
│       ├── page.tsx                  Server Component — fetch + render
│       ├── loading.tsx / error.tsx   error.tsx satu-satunya "use client"
│       └── _components/              PeriodNav, GroupTable, LevelCell, RubricNotes
├── features/kpi/
│   ├── types.ts                      IssueRow, EngineerResult, KpiReport
│   ├── config.ts                     tim, project, override status, level Timeline  ← input leader
│   ├── rubric.ts                     ambang level + scaling periode
│   ├── period.ts                     parse Q/H, rentang WIB
│   ├── compute.ts                    pure function: issues → report
│   ├── jira.ts                       client read-only (GET /rest/api/3/search/jql)
│   └── queries.ts                    JQL + orkestrasi, 1 fetch per periode
├── lib/env.ts                        validasi env (zod, lazy)
└── proxy.ts                          basic auth
```

## Aturan penilaian

Identik dengan workbook `KPI_Ranking_MarJul_2026.xlsx` — sudah diverifikasi paritas terhadap 1.137 tiket Mar–Jul 2026 (9/9 skor sama). Dua penyesuaian untuk periode 3/6 bulan:

1. **Ambang absolut di-prorate** (faktor `bulan / 5`): Apps Stability dan Tech Enhancements. PCR (rasio) dan CR Delivery (rata-rata) tidak berubah.
2. **Eligibility bulan aktif** = 60% periode: 2 dari 3 bulan (kuartal), 4 dari 6 bulan (semester).

Semester menampilkan skor per kuartal penyusunnya + delta, dihitung dari data fetch yang sama.

## Input leader

Level Timeline Commitment dan override status diisi di `config.ts` lewat PR:

```ts
export const TIMELINE_LEVELS = {
  '2026-Q3': { 'Riza Ari': 4, 'Farhad Zaman Zuhdi': 3 },
}
```

## Cache

Setiap halaman hasil Jira di-cache di Next.js Data Cache selama `JIRA_REVALIDATE_SECONDS` (default 1 jam, tag `jira`).
