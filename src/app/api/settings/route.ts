import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireAdmin } from '@/lib/session'
import { jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET() {
  const me = await getSessionUser()
  if (!me) return jsonError('Silakan masuk terlebih dahulu.', 401)

  let settings = await db.settings.findUnique({ where: { id: 'main' } })
  if (!settings) {
    settings = await db.settings.create({ data: { id: 'main' } })
  }
  return jsonOk({ settings })
}

export async function PUT(req: NextRequest) {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat mengubah pengaturan.', 403)

  const body = await req.json().catch(() => ({}))
  const data: {
    openHour?: number
    closeHour?: number
    autoApprove?: boolean
    maxDaysAhead?: number
  } = {}

  if (body.openHour !== undefined) {
    const v = Number(body.openHour)
    if (!Number.isInteger(v) || v < 0 || v > 23) return jsonError('Jam buka tidak valid (0-23).')
    data.openHour = v
  }
  if (body.closeHour !== undefined) {
    const v = Number(body.closeHour)
    if (!Number.isInteger(v) || v < 1 || v > 24) return jsonError('Jam tutup tidak valid (1-24).')
    data.closeHour = v
  }
  if (typeof body.autoApprove === 'boolean') data.autoApprove = body.autoApprove
  if (body.maxDaysAhead !== undefined) {
    const v = Number(body.maxDaysAhead)
    if (!Number.isInteger(v) || v < 1 || v > 365) return jsonError('Maksimal hari ke depan tidak valid (1-365).')
    data.maxDaysAhead = v
  }

  const current = (await db.settings.findUnique({ where: { id: 'main' } })) ?? {
    openHour: 7,
    closeHour: 18,
  }
  const openHour = data.openHour ?? current.openHour
  const closeHour = data.closeHour ?? current.closeHour
  if (openHour >= closeHour) return jsonError('Jam buka harus lebih kecil dari jam tutup.')

  const settings = await db.settings.upsert({
    where: { id: 'main' },
    update: data,
    create: { id: 'main', ...data },
  })
  return jsonOk({ settings })
}
