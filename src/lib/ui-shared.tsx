'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/** Helper fetch JSON dengan pesan error berbahasa Indonesia. */
export async function api<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Terjadi kesalahan.')
  return data as T
}

export const STATUS_META: Record<
  string,
  { label: string; className: string; pulse?: boolean }
> = {
  PENDING: { label: 'Menunggu', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  APPROVED: { label: 'Disetujui', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  ONGOING: {
    label: 'Berlangsung',
    className: 'bg-orange-500 text-white border-orange-600 shadow-orange-300',
    pulse: true,
  },
  COMPLETED: { label: 'Selesai', className: 'bg-stone-200 text-stone-700 border-stone-400' },
  REJECTED: { label: 'Ditolak', className: 'bg-red-100 text-red-800 border-red-300' },
  CANCELLED: { label: 'Dibatalkan', className: 'bg-stone-100 text-stone-500 border-stone-300' },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: 'bg-stone-100 text-stone-600 border-stone-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        meta.className,
        className
      )}
    >
      {meta.pulse && <span className="h-2 w-2 rounded-full bg-white" />}
      {meta.label}
    </span>
  )
}

export function formatDateID(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShortID(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDaysLocal(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Pilihan jam tiap 30 menit dari jam buka sampai jam tutup. */
export function timeOptions(openHour: number, closeHour: number): string[] {
  const opts: string[] = []
  for (let m = openHour * 60; m <= closeHour * 60; m += 30) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    opts.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }
  return opts
}

/** Panel kaca krem hangat yang dipakai semua dashboard. */
export function GlassPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/50 bg-[#fffdf4]/92 shadow-xl backdrop-blur-md',
        className
      )}
    >
      {children}
    </div>
  )
}
