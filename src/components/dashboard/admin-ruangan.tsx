'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  DoorOpen,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api, GlassPanel } from '@/lib/ui-shared'
import type { Room } from '@/lib/types'
import { ConfirmDialog } from './confirm-dialog'

const COLORS = ['#16a34a', '#c026d3', '#ea580c', '#0d9488', '#ca8a04', '#dc2626']

type RoomForm = {
  id?: string
  name: string
  location: string
  capacity: string
  facilities: string
  color: string
  active: boolean
}

const EMPTY_FORM: RoomForm = {
  name: '',
  location: '',
  capacity: '10',
  facilities: '',
  color: '#16a34a',
  active: true,
}

export function AdminRuangan() {
  const [rooms, setRooms] = React.useState<Room[]>([])
  const [loading, setLoading] = React.useState(true)
  const [formOpen, setFormOpen] = React.useState(false)
  const [form, setForm] = React.useState<RoomForm>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = React.useState<Room | null>(null)
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ rooms: Room[] }>('/api/rooms')
      setRooms(data.rooms)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat ruangan.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (r: Room) => {
    setForm({
      id: r.id,
      name: r.name,
      location: r.location ?? '',
      capacity: String(r.capacity),
      facilities: r.facilities ?? '',
      color: r.color,
      active: r.active,
    })
    setFormOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const body = {
        name: form.name,
        location: form.location,
        capacity: Number(form.capacity),
        facilities: form.facilities,
        color: form.color,
        active: form.active,
      }
      if (form.id) {
        await api(`/api/rooms/${form.id}`, { method: 'PATCH', body: JSON.stringify(body) })
        toast.success('Ruangan diperbarui.')
      } else {
        await api('/api/rooms', { method: 'POST', body: JSON.stringify(body) })
        toast.success('Ruangan baru ditambahkan.')
      }
      setFormOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan ruangan.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (r: Room) => {
    try {
      await api(`/api/rooms/${r.id}`, { method: 'DELETE' })
      toast.success(`Ruangan ${r.name} dihapus.`)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus ruangan.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <DoorOpen className="h-5 w-5 text-emerald-700" />
            Kelola Ruang Rapat
          </h2>
          <p className="text-sm text-stone-600">
            Tambah, ubah, atau nonaktifkan ruangan beserta kapasitas dan fasilitasnya.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-1.5 bg-emerald-700 hover:bg-emerald-600">
          <Plus className="h-4 w-4" /> Tambah Ruangan
        </Button>
      </div>

      {loading ? (
        <GlassPanel className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat ruangan...
        </GlassPanel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((r) => (
            <GlassPanel key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow"
                    style={{ backgroundColor: r.color }}
                  >
                    <DoorOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-stone-800">{r.name}</p>
                    <p className="flex items-center gap-1 text-xs text-stone-500">
                      <MapPin className="h-3 w-3" /> {r.location || 'Tanpa lokasi'}
                    </p>
                  </div>
                </div>
                {r.active ? (
                  <Badge className="bg-emerald-100 text-emerald-800">Aktif</Badge>
                ) : (
                  <Badge variant="outline" className="text-stone-500">
                    Nonaktif
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700">
                  <UsersRound className="h-3.5 w-3.5" /> Kapasitas {r.capacity} orang
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700">
                  {r._count?.reservations ?? 0} reservasi
                </span>
              </div>
              <p className="mt-2 line-clamp-2 min-h-8 text-xs text-stone-500">
                {r.facilities || 'Tanpa deskripsi fasilitas.'}
              </p>
              <div className="mt-3 flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 gap-1.5"
                  onClick={() => openEdit(r)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 gap-1.5 text-red-700 hover:bg-red-50"
                  onClick={() => setDeleteTarget(r)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </Button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Dialog tambah/edit ruangan */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#fffdf4] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Ruangan' : 'Tambah Ruangan'}</DialogTitle>
            <DialogDescription>
              Ruangan aktif akan langsung dapat dipilih pengguna saat memesan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <Label htmlFor="room-name">Nama Ruangan</Label>
              <Input
                id="room-name"
                value={form.name}
                placeholder="Contoh: Ruang Cemara"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="room-location">Lokasi</Label>
              <Input
                id="room-location"
                value={form.location}
                placeholder="Contoh: Lantai 1 - Sayap Timur"
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="room-capacity">Kapasitas (orang)</Label>
              <Input
                id="room-capacity"
                type="number"
                min={1}
                max={999}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="room-facilities">Fasilitas</Label>
              <Textarea
                id="room-facilities"
                rows={2}
                value={form.facilities}
                placeholder="Proyektor, AC, Whiteboard, ..."
                onChange={(e) => setForm({ ...form, facilities: e.target.value })}
              />
            </div>
            <div>
              <Label>Warna Penanda</Label>
              <div className="mt-1.5 flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Warna ${c}`}
                    onClick={() => setForm({ ...form, color: c })}
                    className={
                      form.color === c
                        ? 'h-8 w-8 rounded-full ring-2 ring-stone-700 ring-offset-2'
                        : 'h-8 w-8 rounded-full'
                    }
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-3">
              <div>
                <p className="text-sm font-medium text-stone-800">Ruangan Aktif</p>
                <p className="text-xs text-stone-500">Nonaktif = disembunyikan dari pemesanan</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              onClick={save}
              disabled={saving || !form.name.trim() || !form.capacity}
              className="bg-emerald-700 hover:bg-emerald-600"
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Simpan Ruangan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus ruangan?"
        description={
          deleteTarget
            ? `${deleteTarget.name} akan dihapus permanen. Ruangan dengan reservasi aktif tidak dapat dihapus.`
            : ''
        }
        onConfirm={() => deleteTarget && remove(deleteTarget)}
      />
    </div>
  )
}
