export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8" aria-busy="true">
      <div className="h-9 w-72 animate-pulse rounded bg-line" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-11 animate-pulse rounded bg-line/60" />
        ))}
      </div>
      <p className="sr-only">Mengambil data dari Jira</p>
    </main>
  )
}
