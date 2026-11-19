import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireAdmin } from '@/lib/session'
import {
  jsonError,
  jsonOk,
  isValidDate,
  isValidTime,
  overlaps,
  todayStr,
  addDaysStr,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return jsonError('Silakan masuk terlebih dahulu.', 401)

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') ?? 'mine'
  const roomId = searchParams.get('roomId') ?? undefined
  const date = searchParams.get('date') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const upcoming = searchParams.get('upcoming') === '1'

  const where: Record<string, unknown> = {}
  if (scope === 'all') {
    // Semua reservasi — khusus admin (kelola)
    if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat melihat semua reservasi.', 403)
  } else if (scope === 'room') {
    // Ketersediaan ruangan untuk semua pengguna (tanpa data pribadi lain)
    if (!date) return jsonError('Parameter date wajib untuk melihat ketersediaan ruangan.')
  } else {
    where.userId = me.id
  }
  if (roomId) where.roomId = roomId
  if (date) where.date = date
  if (status) where.status = status
  if (upcoming) where.date = { gte: todayStr() }

  const reservations = await db.reservation.findMany({
    where,
    include: {
      room: { select: { id: true, name: true, location: true, capacity: true, color: true } },
      user: { select: { id: true, name: true, accessCode: true } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    take: 300,
  })
  return jsonOk({ reservations })
}

export async function POST(req: NextRequest) {
  const me = await getSessionUser()
  if (!me) return jsonError('Silakan masuk terlebih dahulu.', 401)

  const body = await req.json().catch(() => ({}))
  const title = String(body?.title ?? '').trim()
  const agenda = String(body?.agenda ?? '').trim() || null
  const roomId = String(body?.roomId ?? '')
  const date = String(body?.date ?? '')
  const startTime = String(body?.startTime ?? '')
  const endTime = String(body?.endTime ?? '')

  if (!title) return jsonError('Judul rapat wajib diisi.')
  if (!isValidDate(date)) return jsonError('Tanggal tidak valid.')

  const settings = await db.settings.findUnique({ where: { id: 'main' } })
  const openHour = settings?.openHour ?? 7
  const closeHour = settings?.closeHour ?? 18
  const maxDaysAhead = settings?.maxDaysAhead ?? 30

  const today = todayStr()
  const limitDate = addDaysStr(maxDaysAhead)
  if (date < today) return jsonError('Tidak dapat memesan untuk tanggal yang sudah lewat.')
  if (date > limitDate)
    return jsonError(`Pemesanan maksimal ${maxDaysAhead} hari ke depan (sampai ${limitDate}).`)

  if (!isValidTime(startTime) || !isValidTime(endTime))
    return jsonError('Jam mulai dan jam selesai wajib dipilih.')
  if (endTime <= startTime) return jsonError('Jam selesai harus lebih besar dari jam mulai.')

  const startMin = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5))
  const endMin = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5))
  const openMin = openHour * 60
  const closeMin = closeHour * 60
  if (startMin < openMin || endMin > closeMin)
    return jsonError(
      `Jam operasional reservasi adalah ${String(openHour).padStart(2, '0')}:00 - ${String(closeHour).padStart(2, '0')}:00.`
    )

  const room = await db.room.findUnique({ where: { id: roomId } })
  if (!room || !room.active) return jsonError('Ruangan tidak tersedia.')

  const conflicts = await db.reservation.findMany({
    where: { roomId, date, status: { in: ['PENDING', 'APPROVED', 'ONGOING'] } },
  })
  const clash = conflicts.find((c) => overlaps(startTime, endTime, c.startTime, c.endTime))
  if (clash)
    return jsonError(
      `Bentrok dengan "${clash.title}" pada ${clash.startTime} - ${clash.endTime}. Pilih jam lain.`,
      409
    )

  const autoApprove = settings?.autoApprove ?? false
  const reservation = await db.reservation.create({
    data: {
      title,
      agenda,
      roomId,
      userId: me.id,
      date,
      startTime,
      endTime,
      status: autoApprove ? 'APPROVED' : 'PENDING',
    },
    include: {
      room: { select: { id: true, name: true, location: true, capacity: true, color: true } },
      user: { select: { id: true, name: true, accessCode: true } },
    },
  })
  return jsonOk({ reservation }, 201)
}
