import { NextResponse, type NextRequest } from 'next/server'

/**
 * Basic auth — dashboard berisi data kinerja personal, jangan pernah terbuka publik.
 * Untuk produksi, ganti dengan SSO perusahaan (mis. Vercel Password Protection / Auth.js + Azure AD).
 */
export function proxy(req: NextRequest) {
  const user = process.env.DASHBOARD_USER
  const pass = process.env.DASHBOARD_PASSWORD
  if (!user || !pass) {
    return process.env.NODE_ENV === 'production'
      ? new NextResponse('DASHBOARD_USER / DASHBOARD_PASSWORD belum diset', { status: 500 })
      : NextResponse.next()
  }

  const [scheme, encoded] = (req.headers.get('authorization') ?? '').split(' ')
  if (scheme === 'Basic' && encoded) {
    const [u, ...rest] = atob(encoded).split(':')
    if (u === user && rest.join(':') === pass) return NextResponse.next()
  }
  return new NextResponse('Autentikasi diperlukan', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="KPI Report", charset="UTF-8"' },
  })
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
