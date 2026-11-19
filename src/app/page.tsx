'use client'

import * as React from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Loader2, LogOut, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SawahScene } from '@/components/sawah/sawah-scene'
import { LoginScreen } from '@/components/sawah/login-screen'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { UserDashboard } from '@/components/dashboard/user-dashboard'
import { api } from '@/lib/ui-shared'
import type { SessionUser } from '@/lib/types'

export default function Home() {
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [booting, setBooting] = React.useState(true)

  React.useEffect(() => {
    api<{ user: SessionUser | null }>('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setBooting(false))
  }, [])

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
      setUser(null)
      toast.success('Anda telah keluar. Sampai jumpa!')
    } catch {
      toast.error('Gagal keluar.')
    }
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="relative min-h-screen">
      <SawahScene dim={!!user} />

      {/* Kepala aplikasi */}
      {user && (
        <header className="sticky top-0 z-20 border-b border-white/25 bg-[#132a18]/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-11 w-20 items-center justify-center rounded-xl bg-white p-1 shadow">
                <Image
                  src="/logo-dtphp.png"
                  alt="Logo DTPHP"
                  width={322}
                  height={155}
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <p className="text-base font-bold leading-tight text-white">RESERV DTPHP</p>
                <p className="text-[11px] leading-tight text-amber-100/90">
                  Reservasi Ruang Rapat
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-white">{user.name}</p>
                <p className="text-[11px] leading-tight text-amber-100/80">
                  Kode akses {user.accessCode}
                </p>
              </div>
              <Badge
                className={
                  isAdmin
                    ? 'gap-1 border-orange-300 bg-orange-500/90 text-white'
                    : 'gap-1 border-emerald-300 bg-emerald-600/90 text-white'
                }
              >
                {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                {isAdmin ? 'Admin' : 'Pengguna'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-1.5 border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Konten utama */}
      <main className="relative z-10 flex min-h-[calc(100vh-64px)] flex-col">
        {booting ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2 rounded-full bg-black/40 px-5 py-3 text-amber-100 backdrop-blur-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Memeriksa sesi...
            </div>
          </div>
        ) : user ? (
          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
            {isAdmin ? <AdminDashboard me={user} /> : <UserDashboard me={user} />}
          </div>
        ) : (
          <LoginScreen onSuccess={() => api<{ user: SessionUser | null }>('/api/auth/me').then((d) => setUser(d.user))} />
        )}
      </main>

      {/* Kaki aplikasi — menempel di bawah, terdorong saat konten panjang */}
      {user && (
        <footer className="relative z-10 mt-auto border-t border-white/20 bg-[#132a18]/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-amber-100/80">
            <p>RESERV DTPHP · Sistem Reservasi Ruang Rapat</p>
            <p className="italic">Hamparan sawah asri, rapat lancar tepat waktu.</p>
          </div>
        </footer>
      )}
    </div>
  )
}
