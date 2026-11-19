'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Ban,
  CalendarPlus,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  api,
  GlassPanel,
  StatusBadge,
  formatDateID,
  formatDateShortID,
  todayLocal,
  addDaysLocal,
  timeOptions,
} from '@/lib/ui-shared'
import type { AppSettings, Reservation, Room, SessionUser } from '@/lib/types'
import { ConfirmDialog } from './confirm-dialog'

export function UserDashboard({ me }: { me: SessionUser }) {
  const [rooms, setRooms] = React.useState<Room[]>([])
  const [settings, setSettings] = React.useState<AppSettings | null>(null)

  React.useEffect(() => {
    Promise.all([api<{ rooms: Room[] }>('/api/rooms'), api<{ settings: AppSettings }>('/api/settings')])
      .then(([r, s]) => {
        setRooms(r.rooms.filter((x) => x.active))
        setSettings(s.settings)
      })
      .catch(() => toast.error('Gagal memuat data awal.'))
  }, [])

  return (
    <Tabs defaultValue="pesan" className="w-full">
      <TabsList className="mb-4 flex h-auto w-full flex-wrap gap-1 rounded-2xl border border-white/40 bg-black/30 p-1.5 backdrop-blur-md">
        <TabsTrigger
          value="pesan"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <CalendarPlus className="h-4 w-4" /> Buat Reservasi
        </TabsTrigger>
        <TabsTrigger
          value="saya"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <Clock className="h-4 w-4" /> Reservasi Saya
        </TabsTrigger>
        <TabsTrigger
          value="jadwal"
          className="gap-1.5 rounded-xl text-amber-100/90 data-[state=active]:bg-[#fffdf4] data-[state=active]:text-emerald-900 data-[state=active]:shadow"
        >
          <CalendarDays className="h-4 w-4" /> Jadwal Ruangan
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pesan">
        {settings && <PanelPesan rooms={rooms} settings={settings} />}
      </TabsContent>
      <TabsContent value="saya">
        <PanelReservasiSaya />
      </TabsContent>
      <TabsContent value="jadwal">
        {settings && <PanelJadwal rooms={rooms} />}
      </TabsContent>
    </Tabs>
  )
}

/* ================= Buat Reservasi ================= */
function PanelPesan({ rooms, settings }: { rooms: Room[]; settings: AppSettings }) {
  const [roomId, setRoomId] = React.useState('')
  const [date, setDate] = React.useState(todayLocal())
  const [startTime, setStartTime] = React.useState('')
  const [endTime, setEndTime] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [agenda, setAgenda] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const times = timeOptions(settings.openHour, settings.closeHour)
  const room = rooms.find((r) => r.id === roomId) ?? null

  // Ketersediaan ruangan terpilih pada tanggal terpilih
  const [booked, setBooked] = React.useState<Reservation[]>([])
  const [checking, setChecking] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    if (!roomId || !date) {
      setBooked([])
      return
    }
    let alive = true
    setChecking(true)
    api<{ reservations: Reservation[] }>(`/api/reservations?scope=room&roomId=${roomId}&date=${date}`)
      .then((d) => {
        if (alive && d) setBooked(d.reservations)
      })
      .catch(() => {})
      .finally(() => alive && setChecking(false))
    return () => {
      alive = false
    }
  }, [roomId, date, refreshKey])

  const slotTaken = (t: string) =>
    booked.some(
      (b) =>
        t >= b.startTime && t < b.endTime && ['PENDING', 'APPROVED', 'ONGOING'].includes(b.status)
    )

  const submit = async () => {
    setSaving(true)
    try {
      const data = await api<{ reservation: Reservation }>('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ roomId, date, startTime, endTime, title, agenda }),
      })
      const st = data.reservation.status
      toast.success(
        st === 'APPROVED'
          ? `Reservasi "${title}" langsung disetujui!`
          : `Reservasi "${title}" terkirim, menunggu persetujuan admin.`
      )
      setTitle('')
      setAgenda('')
      setStartTime('')
      setEndTime('')
      setRefreshKey((k) => k + 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan reservasi.')
    } finally {
      setSaving(false)
    }
  }

  const disabled = saving || !roomId || !date || !startTime || !endTime || !title.trim()

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <GlassPanel className="p-6 lg:col-span-3">
        <h2 className="text-lg font-bold text-stone-800">Pesan Ruang Rapat</h2>
        <p className="mb-4 text-sm text-stone-600">
          Jam operasional {String(settings.openHour).padStart(2, '0')}:00–
          {String(settings.closeHour).padStart(2, '0')}:00 · maksimal {settings.maxDaysAhead} hari
          ke depan.
        </p>
        <div className="space-y-3.5">
          <div>
            <Label htmlFor="bk-title">Judul Rapat</Label>
            <Input
              id="bk-title"
              value={title}
              placeholder="Contoh: Rapat Persiapan Panen"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Ruangan</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoomId(r.id)}
                  className={
                    roomId === r.id
                      ? 'flex items-center gap-2.5 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-3 py-2.5 text-left shadow-sm'
                      : 'flex items-center gap-2.5 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-left hover:border-emerald-400'
                  }
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-lg"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-stone-800">
                      {r.name}
                    </span>
                    <span className="block truncate text-xs text-stone-500">
                      Kap. {r.capacity} · {r.location || '-'}
                    </span>
                  </span>
                </button>
              ))}
              {rooms.length === 0 && (
                <p className="text-sm text-stone-500">Belum ada ruangan tersedia.</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="bk-date">Tanggal</Label>
            <Input
              id="bk-date"
              type="date"
              value={date}
              min={todayLocal()}
              max={addDaysLocal(settings.maxDaysAhead)}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jam Mulai</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {times.map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                      disabled={roomId ? slotTaken(t) : false}
                    >
                      {t} {roomId && slotTaken(t) ? '· terisi' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jam Selesai</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {times.map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                      disabled={startTime ? t <= startTime : false}
                    >
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="bk-agenda">Agenda (opsional)</Label>
            <Textarea
              id="bk-agenda"
              rows={3}
              value={agenda}
              placeholder="Detail pembahasan yang akan dilakukan..."
              onChange={(e) => setAgenda(e.target.value)}
            />
          </div>
          <Button
            onClick={submit}
            disabled={disabled}
            className="w-full gap-2 bg-emerald-700 py-2.5 text-base hover:bg-emerald-600"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarPlus className="h-5 w-5" />}
            Kirim Reservasi
          </Button>
        </div>
      </GlassPanel>

      {/* Info ketersediaan */}
      <GlassPanel className="p-6 lg:col-span-2">
        <h3 className="font-bold text-stone-800">Ketersediaan Ruangan</h3>
        {!room ? (
          <p className="mt-2 text-sm text-stone-500">
            Pilih ruangan untuk melihat jadwal yang sudah terisi.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="rounded-xl bg-emerald-900/5 px-3.5 py-3">
              <p className="font-semibold text-stone-800">{room.name}</p>
              <p className="mt-0.5 text-xs text-stone-500">
                <MapPin className="mr-1 inline h-3 w-3" />
                {room.location || '-'} · <UsersRound className="mr-1 inline h-3 w-3" />
                {room.capacity} orang
              </p>
              {room.facilities && (
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{room.facilities}</p>
              )}
            </div>
            <p className="text-sm font-medium text-stone-700">
              Terisi pada {formatDateShortID(date)}:
            </p>
            {checking ? (
              <p className="flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa...
              </p>
            ) : booked.filter((b) => ['PENDING', 'APPROVED', 'ONGOING'].includes(b.status)).length ===
              0 ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                Semua slot kosong — ruangan bebas untuk hari itu!
              </p>
            ) : (
              <div className="space-y-1.5">
                {booked
                  .filter((b) => ['PENDING', 'APPROVED', 'ONGOING'].includes(b.status))
                  .map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs"
                    >
                      <span className="font-mono font-bold text-stone-700">
                        {b.startTime}–{b.endTime}
                      </span>
                      <span className="truncate px-2 text-stone-600">{b.title}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}

/* ================= Reservasi Saya ================= */
function PanelReservasiSaya() {
  const [items, setItems] = React.useState<Reservation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Reservation | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ reservations: Reservation[] }>('/api/reservations?scope=mine')
      setItems(data.reservations)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat reservasi.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const act = async (rsv: Reservation, action: string, msg: string) => {
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

  const remove = async (rsv: Reservation) => {
    setBusyId(rsv.id)
    try {
      await api(`/api/reservations/${rsv.id}`, { method: 'DELETE' })
      toast.success('Reservasi dihapus.')
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <GlassPanel className="flex items-center justify-center py-16 text-stone-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat reservasi Anda...
      </GlassPanel>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-stone-800">Riwayat Reservasi Saya</h2>
      {items.length === 0 ? (
        <GlassPanel className="p-10 text-center text-stone-500">
          Anda belum memiliki reservasi. Mulai dari tab <b>Buat Reservasi</b>.
        </GlassPanel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <GlassPanel key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: r.room.color }}
                    />
                    <p className="truncate font-semibold text-stone-800">{r.title}</p>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3 w-3" /> {r.room.name}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-2.5 rounded-xl bg-emerald-900/5 px-3 py-2 text-xs text-stone-700">
                <p className="font-medium">{formatDateID(r.date)}</p>
                <p className="mt-0.5 font-bold tracking-wide text-emerald-800">
                  {r.startTime} – {r.endTime} WIB
                </p>
                {r.agenda && <p className="mt-1 italic text-stone-500">&ldquo;{r.agenda}&rdquo;</p>}
                {r.status === 'ONGOING' && (
                  <p className="mt-1 font-medium text-orange-700">Rapat sedang berlangsung.</p>
                )}
                {r.status === 'COMPLETED' && r.actualStart && (
                  <p className="mt-1 text-stone-500">
                    Rapat berlangsung {new Date(r.actualStart).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {r.actualEnd &&
                      ` – ${new Date(r.actualEnd).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['PENDING', 'APPROVED'].includes(r.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-amber-800 hover:bg-amber-50"
                    disabled={busyId === r.id}
                    onClick={() => act(r, 'cancel', 'Reservasi dibatalkan.')}
                  >
                    <Ban className="h-3.5 w-3.5" /> Batalkan
                  </Button>
                )}
                {!['ONGOING', 'COMPLETED'].includes(r.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-red-700 hover:bg-red-50"
                    disabled={busyId === r.id}
                    onClick={() => setDeleteTarget(r)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </Button>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus reservasi?"
        description={
          deleteTarget ? `"${deleteTarget.title}" akan dihapus permanen.` : ''
        }
        onConfirm={() => deleteTarget && remove(deleteTarget)}
      />
    </div>
  )
}

/* ================= Jadwal Ruangan ================= */
function PanelJadwal({ rooms }: { rooms: Room[] }) {
  const [date, setDate] = React.useState(todayLocal())
  const [items, setItems] = React.useState<Reservation[]>([])
  const [loading, setLoading] = React.useState(false)

  const load = React.useCallback(async (d: string) => {
    setLoading(true)
    try {
      const data = await api<{ reservations: Reservation[] }>(
        `/api/reservations?scope=room&date=${d}`
      )
      setItems(data.reservations)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load(date)
  }, [date, load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <CalendarDays className="h-5 w-5 text-emerald-700" />
            Jadwal Ruangan
          </h2>
          <p className="text-sm text-stone-600">Lihat siapa saja yang menggunakan ruangan pada tanggal tertentu.</p>
        </div>
        <div className="w-44">
          <Label>Tanggal</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <GlassPanel className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat jadwal...
        </GlassPanel>
      ) : rooms.length === 0 ? (
        <GlassPanel className="p-10 text-center text-stone-500">Belum ada ruangan aktif.</GlassPanel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const dayItems = items
              .filter((r) => r.roomId === room.id && ['PENDING', 'APPROVED', 'ONGOING'].includes(r.status))
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
            return (
              <GlassPanel key={room.id} className="p-4">
                <div className="flex items-center gap-2.5 border-b border-stone-200 pb-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: room.color }}
                  >
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-stone-800">{room.name}</p>
                    <p className="text-xs text-stone-500">
                      Kap. {room.capacity} · {room.location || '-'}
                    </p>
                  </div>
                </div>
                <div className="pt-3">
                  {dayItems.length === 0 ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-center text-xs text-emerald-800">
                      Kosong — tersedia seharian
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayItems.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-mono font-bold text-stone-700">
                            {r.startTime}–{r.endTime}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-stone-600">
                            {r.title} · {r.user.name}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}
