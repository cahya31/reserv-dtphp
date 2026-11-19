import { clearSession } from '@/lib/session'
import { jsonOk } from '@/lib/api-helpers'

export async function POST() {
  await clearSession()
  return jsonOk({ ok: true })
}
