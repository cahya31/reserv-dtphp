'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Clock,
  DoorOpen,
  Hourglass,
  LayoutDashboard,
  Loader2,
  Play,
  Square,
  Users,
  Wheat,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, GlassPanel, StatusBadge, formatDateID, todayLocal } from '@/lib/ui-shared'
import type { AppSettings, Reservation, SessionUser, Stats } from '@/lib/types'
import { AdminReservasi } from './admin-reservasi'
import { AdminPengguna } from './admin-pengguna'
import { AdminRuangan } from './admin-ruangan'
import { AdminPengaturan } from './admin-pengaturan'

type AgendaItem = Reservation & {
  room: { id: string; name: string; color: string }
  user: { id: string; name: string }
}

export function AdminDashboard({ me }: { me: SessionUser }) {
  const [settings, setSettings] = React.useState<AppSettings | null>(null)

  React.useEffect(() => {
    api<{ settings: AppSettings }>('/api/settings')
      .then((d) => setSettings(d.settings))
      .catch(() => toast.error('Gagal memuat pengaturan awal.'))
  }, [])

  return (
    <Tabs defaultValue="ringkasan" className="w-full">
      <TabsList className="mb-4 flex h-auto w-full flex-wrap gap-1 rounded-2xl border border-white/40 bg-black/30 p-1.5 backdrop-blur-md">
        <TabsTrigger
          value="ringkasan"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <LayoutDashboard className="h-4 w-4" /> Ringkasan
        </TabsTrigger>
        <TabsTrigger
          value="reservasi"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <Clock className="h-4 w-4" /> Reservasi
        </TabsTrigger>
        <TabsTrigger
          value="ruangan"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <DoorOpen className="h-4 w-4" /> Ruang Rapat
        </TabsTrigger>
        <TabsTrigger
          value="pengguna"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <Users className="h-4 w-4" /> Pengguna
        </TabsTrigger>
        <TabsTrigger
          value="pengaturan"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <Wheat className="h-4 w-4" /> Pengaturan
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ringkasan">
        <PanelRingkasan me={me} />
      </TabsContent>
      <TabsContent value="reservasi">
        {settings && <AdminReservasi settings={settings} />}
      </TabsContent>
      <TabsContent value="ruangan">
        <AdminRuangan />
      </TabsContent>
      <TabsContent value="pengguna">
        <AdminPengguna me={me} />
      </TabsContent>
      <TabsContent value="pengaturan">
        {settings && (
          <AdminPengaturan
            settings={settings}
            onSaved={(s) => setSettings(s)}
          />
        )}
      </TabsContent>
    </Tabs>
  )
}

function PanelRingkasan({ me }: { me: SessionUser }) {
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [agenda, setAgenda] = React.useState<AgendaItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      const data = await api<{ stats: Stats; agenda: AgendaItem[] }>('/api/stats')
      setStats(data.stats)
      setAgenda(data.agenda)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat ringkasan.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const act = async (rsv: AgendaItem, action: string, msg: string) => {
    setBusyId(rsv.id)
    try {
      await api(`/api/reservations/${rsv.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
      toast.success(msg)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Aksi gagal.')
    } finally {
      setBusyId(null)
    }
  }

  const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <GlassPanel className="flex items-center justify-center py-20 text-stone-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat ringkasan...
      </GlassPanel>
    )
  }

  const cards = [
    { label: 'Ruang Aktif', value: stats?.roomsActive ?? 0, icon: DoorOpen, tone: 'bg-emerald-600' },
    { label: 'Pengguna Aktif', value: stats?.usersActive ?? 0, icon: Users, tone: 'bg-teal-600' },
    { label: 'Reservasi Hari Ini', value: stats?.todayCount ?? 0, icon: Clock, tone: 'bg-amber-600' },
    { label: 'Rapat Berlangsung', value: stats?.ongoingCount ?? 0, icon: Play, tone: 'bg-orange-500' },
    { label: 'Menunggu Persetujuan', value: stats?.pendingCount ?? 0, icon: Hourglass, tone: 'bg-red-500' },
  ]

  return (
    <div className="space-y-4">
      <GlassPanel className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-lg font-bold text-stone-800">
            Selamat bertugas, {me.name.split(' ')[0]}!
          </h2>
          <p className="text-sm text-stone-600">
            Ringkasan aktivitas reservasi · {formatDateID(todayLocal())} · pukul {nowStr} WIB
          </p>
        </div>
        <Wheat className="h-9 w-9 text-amber-500" />
      </GlassPanel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <GlassPanel key={c.label} className="p-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow ${c.tone}`}
              >
                <c.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-2.5 text-2xl font-bold text-stone-800">{c.value}</p>
            <p className="text-xs font-medium text-stone-500">{c.label}</p>
          </GlassPanel>
        ))}
      </div>

      <GlassPanel className="p-5">
        <h3 className="mb-3 font-bold text-stone-800">Agenda Rapat Hari Ini</h3>
        {agenda.length === 0 ? (
          <p className="rounded-xl bg-stone-100 px-4 py-6 text-center text-sm text-stone-500">
            Belum ada rapat yang terjadwal hari ini.
          </p>
        ) : (
          <div className="space-y-2.5">
            {agenda.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: r.room.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-800">{r.title}</p>
                    <p className="text-xs text-stone-500">
                      {r.room.name} · {r.startTime}–{r.endTime} · {r.user.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-500"
                        disabled={busyId === r.id}
                        onClick={() => act(r, 'approve', 'Reservasi disetujui.')}
                      >
                        <Check className="h-3.5 w-3.5" /> Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1 text-red-700 hover:bg-red-50"
                        disabled={busyId === r.id}
                        onClick={() => act(r, 'reject', 'Reservasi ditolak.')}
                      >
                        <X className="h-3.5 w-3.5" /> Tolak
                      </Button>
                    </>
                  )}
                  {r.status === 'APPROVED' && (
                    <Button
                      size="sm"
                      className="h-8 gap-1 bg-orange-500 hover:bg-orange-400"
                      disabled={busyId === r.id}
                      onClick={() => act(r, 'start', 'Rapat dimulai.')}
                    >
                      <Play className="h-3.5 w-3.5" /> Mulai
                    </Button>
                  )}
                  {r.status === 'ONGOING' && (
                    <Button
                      size="sm"
                      className="h-8 gap-1 bg-stone-700 hover:bg-stone-600"
                      disabled={busyId === r.id}
                      onClick={() => act(r, 'end', 'Rapat diselesaikan.')}
                    >
                      <Square className="h-3.5 w-3.5" /> Selesai
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
