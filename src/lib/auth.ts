import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'rishika-computers-secret'

export type AuthUser = {
  userId: string
  shopId: string
  role: 'OWNER' | 'STAFF' | 'CUSTOMER'
  name: string
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

// For API route handlers — reads cookie from NextRequest
export function getAuthFromRequest(req: NextRequest): AuthUser | null {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}
