import { db } from '@/lib/db'
import { getSessionUser, requireAdmin } from '@/lib/session'
import { jsonError, jsonOk, todayStr } from '@/lib/api-helpers'

export async function GET() {
  const me = await getSessionUser()
  if (!requireAdmin(me)) return jsonError('Hanya admin yang dapat melihat statistik.', 403)

  const today = todayStr()
  const [roomsActive, usersActive, todayCount, ongoingCount, pendingCount] = await Promise.all([
    db.room.count({ where: { active: true } }),
    db.user.count({ where: { active: true } }),
    db.reservation.count({ where: { date: today, status: { notIn: ['CANCELLED', 'REJECTED'] } } }),
    db.reservation.count({ where: { status: 'ONGOING' } }),
    db.reservation.count({ where: { status: 'PENDING' } }),
  ])

  const agenda = await db.reservation.findMany({
    where: { date: today, status: { notIn: ['CANCELLED', 'REJECTED'] } },
    include: {
      room: { select: { id: true, name: true, color: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  })

  return jsonOk({
    stats: { roomsActive, usersActive, todayCount, ongoingCount, pendingCount },
    agenda,
  })
}
