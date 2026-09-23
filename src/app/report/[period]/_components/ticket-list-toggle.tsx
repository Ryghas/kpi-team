'use client'

import { useState } from 'react'
import type { IndicatorExplain, TicketRef } from '@/features/kpi/types'

const fmtId = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

/** Tombol nama engineer — klik untuk expand daftar tiketnya (done & belum done) + penjelasan indikator skor. Satu-satunya bagian interaktif, sisanya tetap Server Component. */
export function TicketListToggle({ name, tickets, indicators, className }: { name: string; tickets: TicketRef[]; indicators?: IndicatorExplain[]; className?: string }) {
  const [open, setOpen] = useState(false)
  const doneCount = tickets.filter((t) => t.done).length

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`text-left font-medium text-ink underline decoration-dotted underline-offset-2 hover:decoration-solid ${className ?? ''}`}
        aria-expanded={open}
      >
        {name}
      </button>
      {open && indicators && indicators.length > 0 && (
        <div className="mt-2 rounded-md border border-line bg-paper p-3">
          <p className="text-xs font-medium text-ink">Kenapa skornya begitu</p>
          <dl className="mt-1.5 space-y-1.5">
            {indicators.map((ind) => (
              <div key={ind.key} className="text-xs">
                <dt className="inline font-medium text-ink">{ind.label} ({Math.round(ind.weight * 100)}%, L{ind.level}): </dt>
                <dd className="inline text-muted">{ind.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {open && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-line bg-paper">
          {tickets.length === 0 ? (
            <p className="p-3 text-xs text-muted">Tidak ada tiket di periode ini.</p>
          ) : (
            <>
              <p className="border-b border-line px-3 py-1.5 text-xs text-muted">
                {tickets.length} tiket - {doneCount} done, {tickets.length - doneCount} belum done
              </p>
              <ul>
                {tickets.map((t) => (
                  <li key={t.key} className="flex items-start gap-2 border-b border-line px-3 py-2 text-xs last:border-0">
                    <span className={`mt-0.5 inline-block shrink-0 rounded-full px-1.5 py-0.5 font-medium ${t.done ? 'bg-l5/15 text-l5' : 'bg-l2/15 text-l2'}`}>
                      {t.done ? 'Done' : t.status}
                    </span>
                    <span className="flex-1">
                      <span className="text-muted">{t.key}</span> - {t.summary}
                      <span className="block text-muted">{t.issueType} - dibuat {fmtId(t.created)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
