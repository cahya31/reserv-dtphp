'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Ban,
  CalendarClock,
  Check,
  ClipboardList,
  Play,
  Square,
  Trash2,
  X,
  Loader2,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, StatusBadge, formatDateID, todayLocal, timeOptions, GlassPanel } from '@/lib/ui-shared'
import type { Reservation, Room, AppSettings } from '@/lib/types'
import { ConfirmDialog } from './confirm-dialog'

type FilterKey = 'semua' | 'hari-ini' | 'menunggu' | 'berlangsung' | 'mendatang'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'semua', label: 'Semua' },
  { key: 'hari-ini', label: 'Hari Ini' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'berlangsung', label: 'Berlangsung' },
  { key: 'mendatang', label: 'Mendatang' },
]

export function AdminReservasi({ settings }: { settings: AppSettings }) {
  const [items, setItems] = React.useState<Reservation[]>([])
  const [rooms, setRooms] = React.useState<Room[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<FilterKey>('semua')
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [editTarget, setEditTarget] = React.useState<Reservation | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Reservation | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [r, roomsData] = await Promise.all([
        api<{ reservations: Reservation[] }>('/api/reservations?scope=all'),
        api<{ rooms: Room[] }>('/api/rooms'),
      ])
      setItems(r.reservations)
      setRooms(roomsData.rooms)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat reservasi.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const act = async (rsv: Reservation, action: string, successMsg: string) => {
    setBusyId(rsv.id)
    try {
      await api(`/api/reservations/${rsv.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      })
      toast.success(successMsg)
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

  const today = todayLocal()
  const filtered = React.useMemo(() => {
    let list = items
    if (filter === 'hari-ini') list = list.filter((r) => r.date === today)
    if (filter === 'menunggu') list = list.filter((r) => r.status === 'PENDING')
    if (filter === 'berlangsung') list = list.filter((r) => r.status === 'ONGOING')
    if (filter === 'mendatang')
      list = list.filter(
        (r) => r.date >= today && (r.status === 'PENDING' || r.status === 'APPROVED')
      )
    if (filter === 'mendatang')
      return [...list].sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    return list
  }, [items, filter, today])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <ClipboardList className="h-5 w-5 text-emerald-700" />
            Kelola Reservasi
          </h2>
          <p className="text-sm text-stone-600">
            Setujui, mulai rapat, selesaikan, ubah jadwal, atau batalkan reservasi.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <Loader2 className={loading ? 'h-4 w-4 animate-spin' : 'hidden'} />
          Segarkan
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={
              filter === f.key
                ? 'rounded-full bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow'
                : 'rounded-full border border-emerald-800/25 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50'
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat reservasi...
        </div>
      ) : filtered.length === 0 ? (
        <GlassPanel className="p-10 text-center text-stone-500">
          Tidak ada reservasi pada filter ini.
        </GlassPanel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
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
                <p className="mt-1 text-stone-500">
                  Pemesan: <span className="font-medium text-stone-700">{r.user.name}</span>{' '}
                  <span className="rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[10px]">
                    {r.user.accessCode}
                  </span>
                </p>
                {r.agenda && <p className="mt-1 italic text-stone-500">&ldquo;{r.agenda}&rdquo;</p>}
                {r.status === 'ONGOING' && r.actualStart && (
                  <p className="mt-1 font-medium text-orange-700">
                    Dimulai pukul{' '}
                    {new Date(r.actualStart).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.status === 'PENDING' && (
                  <>
                    <ActionBtn
                      icon={<Check className="h-3.5 w-3.5" />}
                      label="Setujui"
                      variant="approve"
                      busy={busyId === r.id}
                      onClick={() => act(r, 'approve', 'Reservasi disetujui.')}
                    />
                    <ActionBtn
                      icon={<X className="h-3.5 w-3.5" />}
                      label="Tolak"
                      variant="reject"
                      busy={busyId === r.id}
                      onClick={() => act(r, 'reject', 'Reservasi ditolak.')}
                    />
                  </>
                )}
                {r.status === 'APPROVED' && (
                  <>
                    <ActionBtn
                      icon={<Play className="h-3.5 w-3.5" />}
                      label="Mulai Rapat"
                      variant="start"
                      busy={busyId === r.id}
                      onClick={() => act(r, 'start', 'Rapat dimulai. Selamat bekerja!')}
                    />
                    <ActionBtn
                      icon={<Ban className="h-3.5 w-3.5" />}
                      label="Batalkan"
                      variant="cancel"
                      busy={busyId === r.id}
                      onClick={() => act(r, 'cancel', 'Reservasi dibatalkan.')}
                    />
                  </>
                )}
                {r.status === 'ONGOING' && (
                  <ActionBtn
                    icon={<Square className="h-3.5 w-3.5" />}
                    label="Selesai Rapat"
                    variant="end"
                    busy={busyId === r.id}
                    onClick={() => act(r, 'end', 'Rapat diselesaikan.')}
                  />
                )}
                {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(r.status) && (
                  <ActionBtn
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                    label="Ubah Jadwal"
                    variant="edit"
                    busy={false}
                    onClick={() => setEditTarget(r)}
                  />
                )}
                <ActionBtn
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  label="Hapus"
                  variant="delete"
                  busy={busyId === r.id}
                  onClick={() => setDeleteTarget(r)}
                />
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Dialog Ubah Jadwal */}
      <RescheduleDialog
        target={editTarget}
        rooms={rooms}
        settings={settings}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null)
          load()
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus reservasi?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" (${deleteTarget.date} ${deleteTarget.startTime}) akan dihapus permanen.`
            : ''
        }
        onConfirm={() => deleteTarget && remove(deleteTarget)}
      />
    </div>
  )
}

function ActionBtn({
  icon,
  label,
  onClick,
  variant,
  busy,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant: 'approve' | 'reject' | 'start' | 'end' | 'edit' | 'cancel' | 'delete'
  busy: boolean
}) {
  const styles: Record<string, string> = {
    approve: 'bg-emerald-600 text-white hover:bg-emerald-500',
    reject: 'bg-red-600 text-white hover:bg-red-500',
    start: 'bg-orange-500 text-white hover:bg-orange-400',
    end: 'bg-stone-700 text-white hover:bg-stone-600',
    edit: 'bg-amber-500 text-white hover:bg-amber-400',
    cancel: 'bg-stone-500 text-white hover:bg-stone-400',
    delete: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  }
  return (
    <Button
      size="sm"
      className={`h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold ${styles[variant]}`}
      onClick={onClick}
      disabled={busy}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </Button>
  )
}

function RescheduleDialog({
  target,
  rooms,
  settings,
  onClose,
  onSaved,
}: {
  target: Reservation | null
  rooms: Room[]
  settings: AppSettings
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = React.useState('')
  const [roomId, setRoomId] = React.useState('')
  const [date, setDate] = React.useState('')
  const [startTime, setStartTime] = React.useState('')
  const [endTime, setEndTime] = React.useState('')
  const [agenda, setAgenda] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (target) {
      setTitle(target.title)
      setRoomId(target.roomId)
      setDate(target.date)
      setStartTime(target.startTime)
      setEndTime(target.endTime)
      setAgenda(target.agenda ?? '')
    }
  }, [target])

  const times = timeOptions(settings.openHour, settings.closeHour)
  const activeRooms = rooms.filter((r) => r.active || r.id === target?.roomId)

  const save = async () => {
    if (!target) return
    setSaving(true)
    try {
      await api(`/api/reservations/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reschedule', title, roomId, date, startTime, endTime, agenda }),
      })
      toast.success('Jadwal berhasil diubah.')
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengubah jadwal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#fffdf4] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-amber-600" />
            Ubah Jadwal Reservasi
          </DialogTitle>
          <DialogDescription>
            Atur ulang ruangan, tanggal, dan jam untuk &ldquo;{target?.title}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5">
          <div>
            <Label htmlFor="rsv-title">Judul Rapat</Label>
            <Input id="rsv-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Ruangan</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih ruangan" />
              </SelectTrigger>
              <SelectContent>
                {activeRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} (kap. {r.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="rsv-date">Tanggal</Label>
            <Input
              id="rsv-date"
              type="date"
              value={date}
              min={todayLocal()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jam Mulai</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Mulai" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {times.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jam Selesai</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selesai" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {times.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="rsv-agenda">Agenda (opsional)</Label>
            <Textarea
              id="rsv-agenda"
              rows={2}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Detail pembahasan rapat..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={save}
            disabled={saving || !title || !roomId || !date || !startTime || !endTime}
            className="bg-emerald-700 hover:bg-emerald-600"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Simpan Jadwal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
