import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { setSession } from '@/lib/session'
import { jsonError, jsonOk } from '@/lib/api-helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = String(body?.code ?? '').trim()
    if (!code) return jsonError('Kode akses wajib diisi.')

    const user = await db.user.findUnique({ where: { accessCode: code } })
    if (!user) return jsonError('Kode akses tidak ditemukan. Periksa kembali.', 401)
    if (!user.active) return jsonError('Akun dengan kode ini sedang dinonaktifkan.', 403)

    await setSession(user.id)
    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        accessCode: user.accessCode,
        role: user.role,
      },
    })
  } catch {
    return jsonError('Permintaan tidak valid.', 400)
  }
}
