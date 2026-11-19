import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'sawah_session'

export type SessionUser = {
  id: string
  name: string
  accessCode: string
  role: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const userId = store.get(SESSION_COOKIE)?.value
  if (!userId) return null
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || !user.active) return null
  return {
    id: user.id,
    name: user.name,
    accessCode: user.accessCode,
    role: user.role,
  }
}

export async function setSession(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export function requireAdmin(user: SessionUser | null) {
  return !!user && user.role === 'ADMIN'
}
