import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'rishika-computers-secret'

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/track',
  '/api/v1/auth/login',
  '/api/v1/auth/signup',
  '/api/v1/track',
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get('token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    jwt.verify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    // Token invalid or expired — clear it and redirect to login
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.delete('token')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
