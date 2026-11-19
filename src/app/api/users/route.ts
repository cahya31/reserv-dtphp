import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireAdmin } from '@/lib/session'
import { jsonError, jsonOk } from '@/lib/api-helpers'

/** Kode akses berikutnya: 01 admin, 02 dst. */
async function nextAccessCode(): Promise<string> {
  const users = await db.user.findMany({ select: { accessCode: true } })
  const max = users.reduce((acc, u) => {
    const n = parseInt(u.accessCode, 10)
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return String(max + 1).padStart(2, '0')
}

export async function GET() {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat mengakses data pengguna.', 403)

  const users = await db.user.findMany({
    orderBy: { accessCode: 'asc' },
    include: { _count: { select: { reservations: true } } },
  })
  return jsonOk({ users })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat menambah pengguna.', 403)

  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim()
    const role = body?.role === 'ADMIN' ? 'ADMIN' : 'USER'
    if (!name) return jsonError('Nama pengguna wajib diisi.')
    if (name.length > 60) return jsonError('Nama pengguna terlalu panjang (maksimal 60 karakter).')

    const accessCode = await nextAccessCode()
    const user = await db.user.create({ data: { name, role, accessCode, active: true } })
    return jsonOk({ user }, 201)
  } catch {
    return jsonError('Gagal menambah pengguna.', 400)
  }
}
