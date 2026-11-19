import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonOk, isValidDate, todayStr } from '@/lib/api-helpers'

/** Endpoint publik (tanpa sesi): jadwal rapat yang tampil di bawah kartu login. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date') ?? ''
  const date = isValidDate(dateParam) ? dateParam : todayStr()

  const reservations = await db.reservation.findMany({
    where: {
      date,
      status: { in: ['PENDING', 'APPROVED', 'ONGOING', 'COMPLETED'] },
    },
    include: {
      room: { select: { name: true, color: true } },
      user: { select: { name: true } },
    },
    orderBy: { startTime: 'asc' },
    take: 50,
  })

  return jsonOk({
    date,
    items: reservations.map((r) => ({
      id: r.id,
      title: r.title,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      roomName: r.room.name,
      roomColor: r.room.color,
      pic: r.user.name,
    })),
  })
}
