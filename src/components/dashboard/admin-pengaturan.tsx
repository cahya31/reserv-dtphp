'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Save, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, GlassPanel } from '@/lib/ui-shared'
import type { AppSettings } from '@/lib/types'

export function AdminPengaturan({
  settings,
  onSaved,
}: {
  settings: AppSettings
  onSaved: (s: AppSettings) => void
}) {
  const [openHour, setOpenHour] = React.useState(String(settings.openHour))
  const [closeHour, setCloseHour] = React.useState(String(settings.closeHour))
  const [maxDaysAhead, setMaxDaysAhead] = React.useState(String(settings.maxDaysAhead))
  const [autoApprove, setAutoApprove] = React.useState(settings.autoApprove)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    setOpenHour(String(settings.openHour))
    setCloseHour(String(settings.closeHour))
    setMaxDaysAhead(String(settings.maxDaysAhead))
    setAutoApprove(settings.autoApprove)
  }, [settings])

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const save = async () => {
    setSaving(true)
    try {
      const data = await api<{ settings: AppSettings }>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          openHour: Number(openHour),
          closeHour: Number(closeHour),
          maxDaysAhead: Number(maxDaysAhead),
          autoApprove,
        }),
      })
      toast.success('Pengaturan sistem tersimpan.')
      onSaved(data.settings)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
          <Settings2 className="h-5 w-5 text-emerald-700" />
          Pengaturan Sistem
        </h2>
        <p className="text-sm text-stone-600">
          Aturan pemesanan yang berlaku untuk semua pengguna aplikasi.
        </p>
      </div>

      <GlassPanel className="max-w-2xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Jam Buka Reservasi</Label>
            <Select value={openHour} onValueChange={setOpenHour}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {hours.map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    {fmtHour(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-stone-500">Jam paling pagi yang boleh dipesan.</p>
          </div>
          <div>
            <Label>Jam Tutup Reservasi</Label>
            <Select value={closeHour} onValueChange={setCloseHour}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {hours.map((h) => (
                  <SelectItem key={h + 1} value={String(h + 1)}>
                    {fmtHour(h + 1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-stone-500">Jam paling akhir yang boleh dipesan.</p>
          </div>
          <div>
            <Label htmlFor="max-days">Maksimal Pesan (hari ke depan)</Label>
            <Input
              id="max-days"
              type="number"
              min={1}
              max={365}
              value={maxDaysAhead}
              onChange={(e) => setMaxDaysAhead(e.target.value)}
            />
            <p className="mt-1 text-xs text-stone-500">
              Batas jauhnya tanggal yang boleh dipesan mulai hari ini.
            </p>
          </div>
          <div className="flex items-end">
            <div className="flex w-full items-center justify-between rounded-xl bg-white px-3.5 py-3 shadow-sm">
              <div>
                <p className="text-sm font-medium text-stone-800">Setujui Otomatis</p>
                <p className="text-xs text-stone-500">
                  Reservasi langsung Disetujui tanpa perlu persetujuan admin.
                </p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="font-semibold">Catatan</p>
          <p className="mt-1 leading-relaxed">
            Jam operasional saat ini <b>{fmtHour(Number(openHour))}</b> –{' '}
            <b>{fmtHour(Number(closeHour))}</b>. Admin tetap dapat memulai/menyelesaikan rapat
            dan mengubah jadwal dari menu Reservasi kapan pun.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={save}
            disabled={saving || Number(openHour) >= Number(closeHour)}
            className="gap-1.5 bg-emerald-700 hover:bg-emerald-600"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
