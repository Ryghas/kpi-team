import type { Level } from '@/features/kpi/types'

const BG: Record<Level, string> = { 1: 'bg-l1', 2: 'bg-l2', 3: 'bg-l3', 4: 'bg-l4', 5: 'bg-l5' }

/** Lima segmen terisi sesuai level — terbaca tanpa warna (jumlah segmen), aman untuk color-blind. */
export function LevelCell({ level, hint }: { level: Level; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1" title={hint}>
      <span className="text-xs font-semibold">L{level}</span>
      <span className="flex gap-px" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-1.5 w-2 rounded-[1px] ${i <= level ? BG[level] : 'bg-line'}`} />
        ))}
      </span>
    </div>
  )
}
