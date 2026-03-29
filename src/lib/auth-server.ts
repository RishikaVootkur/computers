// Server-only auth helpers — uses next/headers (cannot be imported by client components)
import { cookies } from 'next/headers'
import { verifyToken, AuthUser } from './auth'

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}
