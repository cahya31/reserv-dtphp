// Tipe binding Cloudflare — D1 dengan nama binding "DB"
import type { D1Database } from '@cloudflare/workers-types'

declare module '@opennextjs/cloudflare' {
  interface CloudflareEnv {
    DB: D1Database
  }
}

export {}
