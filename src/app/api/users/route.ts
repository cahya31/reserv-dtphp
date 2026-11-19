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
  try {
    const me = await getSessionUser()
    if (!requireAdmin(me)) {
      return jsonError('Hanya admin yang dapat mengakses data pengguna.', 403)
    }

    // Hindari Prisma relation _count di adapter D1. Ambil ID pengguna
    // reservasi secara terpisah lalu hitung di JavaScript.
    const users = await db.user.findMany({
      orderBy: { accessCode: 'asc' },
      select: {
        id: true,
        name: true,
        accessCode: true,
        role: true,
        active: true,
      },
    })

    const reservations = await db.reservation.findMany({
      select: { userId: true },
    })

    const reservationCounts = new Map<string, number>()
    for (const reservation of reservations) {
      reservationCounts.set(
        reservation.userId,
        (reservationCounts.get(reservation.userId) ?? 0) + 1
      )
    }

    return jsonOk({
      users: users.map((user) => ({
        ...user,
        _count: { reservations: reservationCounts.get(user.id) ?? 0 },
      })),
    })
  } catch (error) {
    console.error('[GET /api/users] Gagal mengambil pengguna:', error)
    return jsonError('Gagal memuat data pengguna. Periksa koneksi database D1.', 500)
  }
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
  } catch (error) {
    console.error('[POST /api/users] Gagal menambah pengguna:', error)
    return jsonError('Gagal menambah pengguna.', 400)
  }
}
