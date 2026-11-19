'use client'

import * as React from 'react'
import Image from 'next/image'
import { CalendarDays, Delete, LogIn, ShieldCheck, UserRound, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoginScreenProps = {
  onSuccess: () => void
}

const MAX_DIGITS = 4

type JadwalItem = {
  id: string
  title: string
  startTime: string
  endTime: string
  status: string
  roomName: string
  roomColor: string
  pic: string
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-400/90 text-amber-950',
  APPROVED: 'bg-emerald-500/90 text-white',
  ONGOING: 'bg-sky-500/90 text-white',
  COMPLETED: 'bg-stone-400/90 text-stone-900',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  ONGOING: 'Berlangsung',
  COMPLETED: 'Selesai',
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [shaking, setShaking] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [jadwal, setJadwal] = React.useState<JadwalItem[] | null>(null)
  const [jadwalDate, setJadwalDate] = React.useState('')

  // Ambil jadwal hari ini untuk panel di bawah kartu
  React.useEffect(() => {
    const today = new Date()
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setJadwalDate(ymd)
    fetch(`/api/public/jadwal?date=${ymd}`)
      .then((r) => r.json())
      .then((d) => setJadwal(Array.isArray(d.items) ? d.items : []))
      .catch(() => setJadwal([]))
  }, [])

  const tanggalLabel = React.useMemo(() => {
    if (!jadwalDate) return ''
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${jadwalDate}T00:00:00`))
    } catch {
      return jadwalDate
    }
  }, [jadwalDate])

  const press = (d: string) => {
    setError('')
    if (d === 'back') {
      setCode((c) => c.slice(0, -1))
      return
    }
    if (d === 'clear') {
      setCode('')
      return
    }
    setCode((c) => (c.length >= MAX_DIGITS ? c : c + d))
  }

  const submit = async () => {
    if (!code || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Gagal masuk.')
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
        setCode('')
        return
      }
      onSuccess()
    } catch {
      setError('Tidak dapat terhubung ke server.')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    } finally {
      setLoading(false)
    }
  }

  // Izinkan ketik angka + Enter dari keyboard fisik
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('back')
      else if (e.key === 'Enter') submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const slots = Array.from({ length: Math.max(2, code.length) }, (_, i) => code[i])

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Kartu kaca login */}
        <div
          className={cn(
            'relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-white/30 bg-[#0f2c12]/55 shadow-2xl backdrop-blur-xl',
            shaking && 'anim-shake'
          )}
          style={{ boxShadow: '0 24px 70px rgba(30,10,20,0.45)' }}
        >
          <div className="relative px-6 pt-8 pb-5 text-center">
            <div className="mx-auto mb-3 flex h-16 w-28 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
              <Image
                src="/logo-dtphp.png"
                alt="Logo DTPHP — Dinas Tanaman Pangan Hortikultura dan Perkebunan"
                width={322}
                height={155}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              RESERV DTPHP
            </h1>
            <p className="mt-1 text-sm text-amber-100/90">Reservasi Ruang Rapat</p>

            <div className="mt-5 text-left">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-amber-100/90">
                <Wind className="h-3.5 w-3.5" />
                Kode Akses
              </label>
              <div className="flex justify-center gap-2.5">
                {slots.map((ch, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex h-13 w-11 items-center justify-center rounded-xl border text-2xl font-bold transition-all',
                      ch
                        ? 'border-amber-300/80 bg-white/25 text-white shadow-inner'
                        : 'border-white/30 bg-white/10 text-white/70'
                    )}
                    style={{ height: 52 }}
                  >
                    {ch ? '••' : '–'}
                  </div>
                ))}
              </div>
              {error && (
                <p className="mt-2.5 rounded-lg bg-red-900/60 px-3 py-2 text-center text-xs font-medium text-red-100">
                  {error}
                </p>
              )}
            </div>

            {/* Keypad */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => press(k)}
                  disabled={loading}
                  aria-label={k === 'clear' ? 'Hapus semua' : k === 'back' ? 'Hapus satu' : `Angka ${k}`}
                  className={cn(
                    'flex h-12 items-center justify-center rounded-xl border text-lg font-semibold transition-all active:scale-95 disabled:opacity-50',
                    k === 'clear' || k === 'back'
                      ? 'border-white/25 bg-white/10 text-amber-100 hover:bg-white/20'
                      : 'border-white/30 bg-white/15 text-white hover:bg-white/28'
                  )}
                >
                  {k === 'clear' ? (
                    <span className="text-xs tracking-wide">HAPUS</span>
                  ) : k === 'back' ? (
                    <Delete className="h-5 w-5" />
                  ) : (
                    k
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!code || loading}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 font-semibold text-white shadow-lg transition-all hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-5 w-5" />
              {loading ? 'Memeriksa kode...' : 'Masuk'}
            </button>

            <p className="mx-auto mt-3 inline-block rounded-xl bg-black/45 px-3.5 py-2 text-[11px] leading-relaxed text-amber-100">
              Masukkan kode akses yang diberikan admin.
            </p>
          </div>

          {/* === Pita sawah asli (statis, tanpa animasi) === */}
          <div className="relative h-24 overflow-hidden border-t border-white/20">
            <div
              className="absolute inset-0 bg-cover bg-no-repeat"
              style={{ backgroundImage: 'url(/sawah-bg.jpg)', backgroundPosition: 'center 62%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f2c12]/50 via-transparent to-[#0f2c12]/45" />

            {/* Hak cipta */}
            <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3.5 py-1 backdrop-blur-sm">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-100">
                © CFH_DIGITAL.IND
              </p>
            </div>
          </div>
        </div>

        {/* Jadwal hari ini — tampil di bawah kartu login */}
        <div className="mt-5 rounded-3xl border border-white/25 bg-[#0f2c12]/60 p-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <CalendarDays className="h-4 w-4 text-amber-300" />
              Jadwal Hari Ini
            </p>
            <p className="text-[11px] text-amber-100/80">{tanggalLabel}</p>
          </div>
          <div className="nice-scroll mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {jadwal === null ? (
              <p className="py-3 text-center text-xs text-amber-100/70">Memuat jadwal...</p>
            ) : jadwal.length === 0 ? (
              <p className="py-3 text-center text-xs text-amber-100/70">
                Tidak ada jadwal rapat hari ini.
              </p>
            ) : (
              jadwal.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2"
                >
                  <div className="w-[84px] shrink-0 text-center">
                    <p className="text-xs font-bold text-amber-200">{j.startTime}</p>
                    <p className="text-[10px] text-amber-100/70">s.d. {j.endTime}</p>
                  </div>
                  <div className="min-w-0 flex-1 border-l border-white/20 pl-3">
                    <p className="truncate text-xs font-semibold text-white">{j.title}</p>
                    <p className="truncate text-[10px] text-amber-100/75">
                      {j.roomName} · {j.pic}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      STATUS_STYLE[j.status] ?? 'bg-white/20 text-white'
                    )}
                  >
                    {STATUS_LABEL[j.status] ?? j.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info peran kecil di bawah kartu */}
        <div className="mt-5 flex items-center justify-center gap-5 text-xs text-amber-100/90">
          <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            Admin: kelola semua
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <UserRound className="h-3.5 w-3.5 text-amber-200" />
            Pengguna: pesan ruangan
          </span>
        </div>
      </div>
    </div>
  )
}
