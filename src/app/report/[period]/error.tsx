'use client'

export default function ReportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isAuth = /Jira API 40[13]/.test(error.message)
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-2xl font-semibold">Data Jira tidak bisa diambil</h1>
      <p className="mt-2 text-muted">
        {isAuth
          ? 'Token Jira ditolak. Periksa JIRA_EMAIL dan JIRA_API_TOKEN, dan pastikan akun punya akses Browse Projects ke semua project.'
          : 'Koneksi ke Jira gagal atau responsnya tidak sesuai format. Coba muat ulang; jika berulang, cek log server.'}
      </p>
      {error.digest && <p className="mt-4 text-xs text-muted">Kode referensi: {error.digest}</p>}
      <button onClick={reset} className="mt-6 rounded bg-accent px-4 py-2 font-medium text-white">
        Muat ulang
      </button>
    </main>
  )
}
