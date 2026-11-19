import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireAdmin } from '@/lib/session'
import { jsonError, jsonOk } from '@/lib/api-helpers'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat mengubah ruangan.', 403)

  const { id } = await params
  const room = await db.room.findUnique({ where: { id } })
  if (!room) return jsonError('Ruangan tidak ditemukan.', 404)

  const body = await req.json().catch(() => ({}))
  const data: {
    name?: string
    location?: string | null
    capacity?: number
    facilities?: string | null
    color?: string
    active?: boolean
  } = {}

  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) return jsonError('Nama ruangan wajib diisi.')
    data.name = name
  }
  if (body.capacity !== undefined) {
    const capacity = Number(body.capacity)
    if (!Number.isFinite(capacity) || capacity < 1 || capacity > 999)
      return jsonError('Kapasitas harus berupa angka 1-999.')
    data.capacity = Math.round(capacity)
  }
  if (body.location !== undefined) data.location = String(body.location ?? '').trim() || null
  if (body.facilities !== undefined) data.facilities = String(body.facilities ?? '').trim() || null
  if (typeof body.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(body.color)) data.color = body.color
  if (typeof body.active === 'boolean') data.active = body.active

  if (Object.keys(data).length === 0) return jsonError('Tidak ada perubahan data.')

  const updated = await db.room.update({ where: { id }, data })
  return jsonOk({ room: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat menghapus ruangan.', 403)

  const { id } = await params
  const room = await db.room.findUnique({
    where: { id },
    include: { _count: { select: { reservations: true } } },
  })
  if (!room) return jsonError('Ruangan tidak ditemukan.', 404)

  const activeCount = await db.reservation.count({
    where: { roomId: id, status: { in: ['PENDING', 'APPROVED', 'ONGOING'] } },
  })
  if (activeCount > 0)
    return jsonError('Ruangan masih memiliki reservasi aktif. Nonaktifkan saja ruangan ini.', 409)

  await db.room.delete({ where: { id } })
  return jsonOk({ ok: true })
}
