import { NextResponse } from 'next/server'

const COOKIE_NAME = 'token'

// Routes that require authentication (any role)
const PRIVATE_PREFIXES = [
  '/dashboard', '/orders', '/reports', '/profile', '/settings', '/cart',
]

// Routes that require ADMIN or SUPER_ADMIN role
const ADMIN_PREFIXES = ['/inventory', '/admin']

// Routes only for unauthenticated users
const AUTH_ONLY_PATHS = ['/login', '/signup', '/register']

/**
 * Decode JWT payload without verifying signature.
 * Signature is verified by the backend on every API call.
 * We only need the role claim here for routing decisions.
 */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]
    const json    = Buffer.from(base64, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function proxy(req) {
  const { pathname } = req.nextUrl
  const tokenCookie  = req.cookies.get(COOKIE_NAME)?.value
  const isAuthenticated = !!tokenCookie

  const payload = isAuthenticated ? decodeJwtPayload(tokenCookie) : null
  const role    = payload?.role || null

  const isPrivate    = PRIVATE_PREFIXES.some(p => pathname.startsWith(p))
  const isAdminRoute = ADMIN_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthOnly   = AUTH_ONLY_PATHS.some(p => pathname.startsWith(p))

  // Unauthenticated → login
  if ((isPrivate || isAdminRoute) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Authenticated but wrong role for admin routes — normalise to lowercase
  const normRole = (role || '').toLowerCase()
  if (isAdminRoute && isAuthenticated && normRole !== 'admin' && normRole !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Already logged in → skip auth pages
  if (isAuthOnly && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/orders/:path*',
    '/reports/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/cart/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
    '/register',
  ],
}
