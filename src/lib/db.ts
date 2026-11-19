import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Klien Prisma dengan dukungan dua lingkungan:
 * - Cloudflare Workers (produksi): D1 melalui driver adapter (binding "DB").
 * - Pengembangan lokal: file SQLite (db/custom.db) seperti biasa.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient(): PrismaClient {
  // 1) Coba binding D1 Cloudflare — hanya ada saat berjalan di Workers/wrangler
  try {
    const { env } = getCloudflareContext()
    if (env?.DB) {
      const adapter = new PrismaD1(env.DB)
      return new PrismaClient({ adapter })
    }
  } catch {
    // Bukan lingkungan Cloudflare (mis. `next dev` lokal) — lanjut ke fallback.
  }

  // 2) Fallback lokal: SQLite file via DATABASE_URL (.env)
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL ?? 'file:./db/custom.db' } },
  })
}

function resolveClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient()
  }
  return globalForPrisma.prisma
}

/**
 * Proxy agar kode lama `db.user.findMany(...)` tetap bekerja:
 * klien sesungguhnya dibuat saat akses pertama (di dalam request),
 * sehingga binding D1 sudah tersedia.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = resolveClient()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
