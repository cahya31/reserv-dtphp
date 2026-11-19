'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserRoundCheck,
  UserRoundX,
  Users,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, GlassPanel } from '@/lib/ui-shared'
import type { SessionUser } from '@/lib/types'
import { ConfirmDialog } from './confirm-dialog'

type UserRow = {
  id: string
  name: string
  accessCode: string
  role: string
  active: boolean
  _count?: { reservations: number }
}

export function AdminPengguna({ me }: { me: SessionUser }) {
  const [users, setUsers] = React.useState<UserRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<UserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<UserRow | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ users: UserRow[] }>('/api/users')
      setUsers(data.users)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat pengguna.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const patchUser = async (u: UserRow, body: Record<string, unknown>, msg: string) => {
    setBusyId(u.id)
    try {
      await api(`/api/users/${u.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      toast.success(msg)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Aksi gagal.')
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (u: UserRow) => {
    setBusyId(u.id)
    try {
      await api(`/api/users/${u.id}`, { method: 'DELETE' })
      toast.success(`Pengguna ${u.name} dihapus.`)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <Users className="h-5 w-5 text-emerald-700" />
            Kelola Pengguna
          </h2>
          <p className="text-sm text-stone-600">
            Tambah pengguna — kode akses berikutnya dibuat otomatis (02, 03, 04, dan seterusnya).
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5 bg-emerald-700 hover:bg-emerald-600">
          <Plus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <GlassPanel className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-stone-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memuat pengguna...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-emerald-900/10 bg-emerald-900/5 text-left text-xs uppercase tracking-wide text-emerald-900">
                  <th className="px-4 py-3 font-semibold">Kode</th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Peran</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Reservasi</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-stone-200/70 last:border-0">
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-emerald-900/10 px-2.5 py-1 font-mono text-sm font-bold text-emerald-900">
                        {u.accessCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-800">
                      {u.name}
                      {u.id === me.id && (
                        <span className="ml-1.5 text-xs font-normal text-stone-400">(Anda)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'ADMIN' ? (
                        <Badge className="gap-1 bg-orange-100 text-orange-800">
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-white text-stone-600">
                          Pengguna
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.active ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-stone-500">
                          Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{u._count?.reservations ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5"
                          onClick={() => setEditTarget(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        {u.accessCode !== '01' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            disabled={busyId === u.id}
                            onClick={() =>
                              patchUser(
                                u,
                                { resetCode: true },
                                `Kode akses baru untuk ${u.name} dibuat.`
                              )
                            }
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Reset Kode
                          </Button>
                        )}
                        {u.accessCode !== '01' && u.id !== me.id && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5"
                              disabled={busyId === u.id}
                              onClick={() =>
                                patchUser(
                                  u,
                                  { active: !u.active },
                                  u.active ? 'Pengguna dinonaktifkan.' : 'Pengguna diaktifkan.'
                                )
                              }
                            >
                              {u.active ? (
                                <UserRoundX className="h-3.5 w-3.5" />
                              ) : (
                                <UserRoundCheck className="h-3.5 w-3.5" />
                              )}
                              {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false)
          load()
        }}
      />

      <EditUserDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null)
          load()
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Hapus pengguna?"
        description={
          deleteTarget
            ? `${deleteTarget.name} (kode ${deleteTarget.accessCode}) beserta seluruh reservasinya akan dihapus permanen.`
            : ''
        }
        onConfirm={() => deleteTarget && remove(deleteTarget)}
      />
    </div>
  )
}

function AddUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = React.useState('')
  const [role, setRole] = React.useState('USER')
  const [saving, setSaving] = React.useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      const data = await api<{ user: { name: string; accessCode: string } }>('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name, role }),
      })
      toast.success(
        `Pengguna "${data.user.name}" dibuat dengan kode akses ${data.user.accessCode}.`
      )
      setName('')
      setRole('USER')
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menambah pengguna.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#fffdf4] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna</DialogTitle>
          <DialogDescription>
            Kode akses akan diberikan otomatis melanjutkan urutan terakhir (misal 05, 06, ...).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5">
          <div>
            <Label htmlFor="user-name">Nama Pengguna</Label>
            <Input
              id="user-name"
              value={name}
              placeholder="Contoh: Dewi Lestari"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name && submit()}
            />
          </div>
          <div>
            <Label>Peran</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Pengguna (pesan ruangan)</SelectItem>
                <SelectItem value="ADMIN">Admin (kelola semua)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="bg-emerald-700 hover:bg-emerald-600"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Buat Pengguna
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({
  target,
  onClose,
  onSaved,
}: {
  target: UserRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = React.useState('')
  const [role, setRole] = React.useState('USER')
  const [active, setActive] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (target) {
      setName(target.name)
      setRole(target.role)
      setActive(target.active)
    }
  }, [target])

  const isPrimary = target?.accessCode === '01'

  const save = async () => {
    if (!target) return
    setSaving(true)
    try {
      await api(`/api/users/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, role, active }),
      })
      toast.success('Perubahan pengguna tersimpan.')
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#fffdf4] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>
            Kode akses {target?.accessCode} · ubah nama, peran, dan status aktif.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5">
          <div>
            <Label htmlFor="edit-name">Nama</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Peran</Label>
            <Select
              value={role}
              onValueChange={setRole}
              disabled={isPrimary}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Pengguna</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {isPrimary && (
              <p className="mt-1 text-xs text-stone-500">
                Peran admin utama (kode 01) tidak dapat diubah.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-3">
            <div>
              <p className="text-sm font-medium text-stone-800">Akun Aktif</p>
              <p className="text-xs text-stone-500">Nonaktif = tidak bisa login</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} disabled={isPrimary} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={save}
            disabled={saving || !name.trim()}
            className="bg-emerald-700 hover:bg-emerald-600"
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
