import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireAdmin } from '@/lib/session'
import { jsonError, jsonOk } from '@/lib/api-helpers'

/** Regenerasi kode akses berikutnya bila bentrok dengan kode lain. */
async function regenerateCode(): Promise<string> {
  const users = await db.user.findMany({ select: { accessCode: true } })
  const max = users.reduce((acc, u) => {
    const n = parseInt(u.accessCode, 10)
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return String(max + 1).padStart(2, '0')
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat mengubah pengguna.', 403)

  const { id } = await params
  const target = await db.user.findUnique({ where: { id } })
  if (!target) return jsonError('Pengguna tidak ditemukan.', 404)

  const isPrimaryAdmin = target.accessCode === '01'
  const body = await req.json().catch(() => ({}))

  const data: { name?: string; role?: string; active?: boolean; accessCode?: string } = {}

  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) return jsonError('Nama pengguna wajib diisi.')
    data.name = name
  }
  if (body.role === 'ADMIN' || body.role === 'USER') {
    if (isPrimaryAdmin && body.role !== 'ADMIN')
      return jsonError('Admin utama (kode 01) tidak dapat diubah perannya.')
    data.role = body.role
  }
  if (typeof body.active === 'boolean') {
    if (isPrimaryAdmin && !body.active)
      return jsonError('Admin utama (kode 01) tidak dapat dinonaktifkan.')
    if (me.id === target.id && !body.active)
      return jsonError('Anda tidak dapat menonaktifkan akun sendiri.')
    data.active = body.active
  }
  if (body.resetCode === true) {
    if (isPrimaryAdmin) return jsonError('Kode admin utama (01) tidak dapat direset.')
    const users = await db.user.findMany({ select: { accessCode: true } })
    const used = new Set(users.map((u) => u.accessCode))
    let code = await regenerateCode()
    let guard = 0
    while (used.has(code) && guard < 500) {
      const n = parseInt(code, 10) + 1
      code = String(n).padStart(2, '0')
      guard++
    }
    data.accessCode = code
  }

  if (Object.keys(data).length === 0) return jsonError('Tidak ada perubahan data.')

  const user = await db.user.update({ where: { id }, data })
  return jsonOk({ user })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat menghapus pengguna.', 403)

  const { id } = await params
  const target = await db.user.findUnique({ where: { id } })
  if (!target) return jsonError('Pengguna tidak ditemukan.', 404)
  if (target.accessCode === '01') return jsonError('Admin utama (kode 01) tidak dapat dihapus.')
  if (me.id === target.id) return jsonError('Anda tidak dapat menghapus akun sendiri.')

  await db.user.delete({ where: { id } })
  return jsonOk({ ok: true })
}
