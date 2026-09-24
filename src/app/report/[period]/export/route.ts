import ExcelJS from 'exceljs'
import { NextResponse, type NextRequest } from 'next/server'
import { getPeriodReport } from '@/features/kpi/queries'
import { parsePeriod } from '@/features/kpi/period'

type Props = { params: Promise<{ period: string }> }

/** Export Excel per individu — hanya tersedia untuk periode 1 tahun penuh (id "<tahun>-FY"). */
export async function GET(req: NextRequest, { params }: Props) {
  const { period: periodId } = await params
  const period = parsePeriod(periodId)
  if (!period) return new NextResponse('Periode tidak valid', { status: 404 })
  if (period.kind !== 'year') {
    return new NextResponse('Export Excel hanya tersedia untuk periode 1 tahun penuh', { status: 400 })
  }

  const engineerName = req.nextUrl.searchParams.get('engineer')
  if (!engineerName) return new NextResponse('Parameter engineer wajib diisi', { status: 400 })

  const { report } = await getPeriodReport(periodId)
  const result = report.results.find((r) => r.engineer.name === engineerName)
  if (!result) return new NextResponse(`Engineer "${engineerName}" tidak ditemukan di periode ini`, { status: 404 })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'KPI Engineering Dashboard'
  workbook.created = report.generatedAt

  // Sheet 1 — Ringkasan skor
  const summary = workbook.addWorksheet('Ringkasan')
  summary.columns = [
    { header: 'Kategori', key: 'kategori', width: 28 },
    { header: 'Nilai', key: 'nilai', width: 40 },
  ]
  summary.getRow(1).font = { bold: true }
  summary.addRows([
    { kategori: 'Nama', nilai: result.engineer.name },
    { kategori: 'Role', nilai: result.engineer.role },
    { kategori: 'Group', nilai: result.engineer.group },
    { kategori: 'Periode', nilai: period.label },
    { kategori: 'Status', nilai: result.status },
    { kategori: 'Peringkat (grup)', nilai: result.rankInGroup ?? '-' },
    { kategori: 'Peringkat (keseluruhan)', nilai: result.rankOverall ?? '-' },
    { kategori: 'Skor Akhir', nilai: result.score },
    { kategori: '', nilai: '' },
    { kategori: 'Total Story Points', nilai: result.totalStoryPoints },
    { kategori: 'Total Work Item', nilai: result.totalWorkItems },
    { kategori: 'Done Work Item', nilai: result.doneWorkItems },
    { kategori: 'Done %', nilai: result.donePct === null ? '-' : `${Math.round(result.donePct * 100)}%` },
    { kategori: 'Bulan Aktif', nilai: result.activeMonths },
    { kategori: '', nilai: '' },
  ])
  for (const ind of result.explain) {
    summary.addRow({ kategori: `${ind.label} (${Math.round(ind.weight * 100)}%) — L${ind.level}`, nilai: ind.detail })
  }
  summary.getColumn('nilai').alignment = { wrapText: true, vertical: 'top' }

  // Sheet 2 — Daftar tiket lengkap
  const tickets = workbook.addWorksheet('Daftar Tiket')
  tickets.columns = [
    { header: 'Key', key: 'key', width: 14 },
    { header: 'Judul', key: 'summary', width: 60 },
    { header: 'Tipe', key: 'issueType', width: 14 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Done', key: 'done', width: 8 },
    { header: 'Dibuat', key: 'created', width: 14 },
  ]
  tickets.getRow(1).font = { bold: true }
  for (const t of result.tickets) {
    tickets.addRow({
      key: t.key, summary: t.summary, issueType: t.issueType, status: t.status,
      done: t.done ? 'Ya' : 'Tidak', created: t.created.toLocaleDateString('id-ID'),
    })
  }
  tickets.getColumn('summary').alignment = { wrapText: true }

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `KPI_${result.engineer.name.replace(/\s+/g, '_')}_${periodId}.xlsx`

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
