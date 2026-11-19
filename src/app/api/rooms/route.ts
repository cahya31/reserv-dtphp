import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireAdmin } from '@/lib/session'
import { jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return jsonError('Silakan masuk terlebih dahulu.', 401)

  const rooms = await db.room.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { reservations: true } } },
  })
  // Admin melihat semua ruangan, user hanya ruangan aktif
  const filtered = me.role === 'ADMIN' ? rooms : rooms.filter((r) => r.active)
  return jsonOk({ rooms: filtered })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat menambah ruangan.', 403)

  const body = await req.json().catch(() => ({}))
  const name = String(body?.name ?? '').trim()
  if (!name) return jsonError('Nama ruangan wajib diisi.')

  const capacity = Number(body?.capacity)
  if (!Number.isFinite(capacity) || capacity < 1 || capacity > 999)
    return jsonError('Kapasitas harus berupa angka 1-999.')

  const room = await db.room.create({
    data: {
      name,
      location: String(body?.location ?? '').trim() || null,
      capacity: Math.round(capacity),
      facilities: String(body?.facilities ?? '').trim() || null,
      color: /^#[0-9a-fA-F]{6}$/.test(String(body?.color ?? '')) ? body.color : '#16a34a',
      active: body?.active === false ? false : true,
    },
  })
  return jsonOk({ room }, 201)
}
