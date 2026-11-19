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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser()
  if (!me) return jsonError('Silakan masuk terlebih dahulu.', 401)
  const isAdmin = requireAdmin(me)

  const { id } = await params
  const rsv = await db.reservation.findUnique({
    where: { id },
    include: { room: { select: { name: true } } },
  })
  if (!rsv) return jsonError('Reservasi tidak ditemukan.', 404)

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action ?? '')

  // ===== Ubah jadwal (admin) =====
  if (action === 'reschedule') {
    if (!isAdmin) return jsonError('Hanya admin yang dapat mengubah jadwal.', 403)
    if (['COMPLETED', 'CANCELLED', 'REJECTED'].includes(rsv.status))
      return jsonError('Jadwal untuk reservasi berstatus selesai/dibatalkan/ditolak tidak dapat diubah.')

    const roomId = String(body?.roomId ?? rsv.roomId)
    const date = String(body?.date ?? rsv.date)
    const startTime = String(body?.startTime ?? rsv.startTime)
    const endTime = String(body?.endTime ?? rsv.endTime)
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : rsv.title
    const agenda =
      body?.agenda !== undefined ? String(body?.agenda ?? '').trim() || null : rsv.agenda

    if (!isValidDate(date)) return jsonError('Tanggal tidak valid.')
    if (!isValidTime(startTime) || !isValidTime(endTime))
      return jsonError('Jam mulai dan jam selesai wajib dipilih.')
    if (endTime <= startTime) return jsonError('Jam selesai harus lebih besar dari jam mulai.')

    const settings = await db.settings.findUnique({ where: { id: 'main' } })
    const openHour = settings?.openHour ?? 7
    const closeHour = settings?.closeHour ?? 18
    const maxDaysAhead = settings?.maxDaysAhead ?? 30
    const limitDate = addDaysStr(maxDaysAhead)
    if (date < todayStr()) return jsonError('Tidak dapat menjadwalkan ke tanggal yang sudah lewat.')
    if (date > limitDate)
      return jsonError(`Penjadwalan maksimal ${maxDaysAhead} hari ke depan (sampai ${limitDate}).`)

    const startMin = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5))
    const endMin = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5))
    if (startMin < openHour * 60 || endMin > closeHour * 60)
      return jsonError(
        `Jam operasional reservasi adalah ${String(openHour).padStart(2, '0')}:00 - ${String(closeHour).padStart(2, '0')}:00.`
      )

    const room = await db.room.findUnique({ where: { id: roomId } })
    if (!room || !room.active) return jsonError('Ruangan tidak tersedia.')

    const conflicts = await db.reservation.findMany({
      where: {
        roomId,
        date,
        status: { in: ['PENDING', 'APPROVED', 'ONGOING'] },
        id: { not: id },
      },
    })
    const clash = conflicts.find((c) => overlaps(startTime, endTime, c.startTime, c.endTime))
    if (clash)
      return jsonError(
        `Bentrok dengan "${clash.title}" pada ${clash.startTime} - ${clash.endTime}.`,
        409
      )

    const updated = await db.reservation.update({
      where: { id },
      data: { roomId, date, startTime, endTime, title, agenda },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true, color: true },
        },
        user: { select: { id: true, name: true, accessCode: true } },
      },
    })
    return jsonOk({ reservation: updated })
  }

  // ===== Mulai rapat (admin) =====
  if (action === 'start') {
    if (!isAdmin) return jsonError('Hanya admin yang dapat memulai rapat.', 403)
    if (rsv.status !== 'APPROVED')
      return jsonError('Rapat hanya dapat dimulai dari status Disetujui.')
    const updated = await db.reservation.update({
      where: { id },
      data: { status: 'ONGOING', actualStart: new Date() },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true, color: true },
        },
        user: { select: { id: true, name: true, accessCode: true } },
      },
    })
    return jsonOk({ reservation: updated })
  }

  // ===== Selesaikan rapat (admin) =====
  if (action === 'end') {
    if (!isAdmin) return jsonError('Hanya admin yang dapat menyelesaikan rapat.', 403)
    if (rsv.status !== 'ONGOING') return jsonError('Rapat sedang tidak berlangsung.')
    const updated = await db.reservation.update({
      where: { id },
      data: { status: 'COMPLETED', actualEnd: new Date() },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true, color: true },
        },
        user: { select: { id: true, name: true, accessCode: true } },
      },
    })
    return jsonOk({ reservation: updated })
  }

  // ===== Setujui / tolak (admin) =====
  if (action === 'approve') {
    if (!isAdmin) return jsonError('Hanya admin yang dapat menyetujui reservasi.', 403)
    if (rsv.status !== 'PENDING')
      return jsonError('Hanya reservasi berstatus Menunggu yang dapat disetujui.')
    const updated = await db.reservation.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true, color: true },
        },
        user: { select: { id: true, name: true, accessCode: true } },
      },
    })
    return jsonOk({ reservation: updated })
  }

  if (action === 'reject') {
    if (!isAdmin) return jsonError('Hanya admin yang dapat menolak reservasi.', 403)
    if (rsv.status !== 'PENDING')
      return jsonError('Hanya reservasi berstatus Menunggu yang dapat ditolak.')
    const updated = await db.reservation.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true, color: true },
        },
        user: { select: { id: true, name: true, accessCode: true } },
      },
    })
    return jsonOk({ reservation: updated })
  }

  // ===== Batalkan (pemilik atau admin) =====
  if (action === 'cancel') {
    const isOwner = rsv.userId === me.id
    if (!isAdmin && !isOwner) return jsonError('Anda hanya dapat membatalkan reservasi sendiri.', 403)
    if (!['PENDING', 'APPROVED'].includes(rsv.status))
      return jsonError('Reservasi berlangsung/selesai tidak dapat dibatalkan. Gunakan aksi lain.')
    const updated = await db.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        room: {
          select: { id: true, name: true, location: true, capacity: true, color: true },
        },
        user: { select: { id: true, name: true, accessCode: true } },
      },
    })
    return jsonOk({ reservation: updated })
  }

  return jsonError('Aksi tidak dikenal.', 400)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser()
  if (!me) return jsonError('Silakan masuk terlebih dahulu.', 401)
  const isAdmin = requireAdmin(me)

  const { id } = await params
  const rsv = await db.reservation.findUnique({ where: { id } })
  if (!rsv) return jsonError('Reservasi tidak ditemukan.', 404)

  if (!isAdmin && rsv.userId !== me.id)
    return jsonError('Anda hanya dapat menghapus reservasi sendiri.', 403)
  if (!isAdmin && !['PENDING', 'APPROVED', 'CANCELLED', 'REJECTED'].includes(rsv.status))
    return jsonError('Reservasi berlangsung/selesai tidak dapat dihapus.')

  await db.reservation.delete({ where: { id } })
  return jsonOk({ ok: true })
}
