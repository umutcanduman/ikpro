'use client'
import { useState } from 'react'
import { Bell, Calendar, DollarSign, Target, BarChart2, Shield, Save, Loader2 } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import toast from 'react-hot-toast'

type NotifGroup = {
  id: string
  label: string
  icon: any
  color: string
  bgColor: string
  items: { key: string; label: string; description: string }[]
}

const NOTIFICATION_GROUPS: NotifGroup[] = [
  {
    id: 'leave',
    label: 'İzin Talepleri',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    items: [
      { key: 'leave_new', label: 'Yeni talep geldiğinde', description: 'Bir çalışan yeni izin talebi oluşturduğunda bildirim al' },
      { key: 'leave_status', label: 'Talep onaylandığında/reddedildiğinde', description: 'İzin talebinizin durumu değiştiğinde bildirim al' },
    ],
  },
  {
    id: 'payroll',
    label: 'Bordro',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    items: [
      { key: 'payroll_run', label: 'Bordro çalıştırıldığında', description: 'Aylık bordro işlemi tamamlandığında bildirim al' },
      { key: 'payroll_reminder', label: 'Maaş günü hatırlatması', description: 'Maaş ödemesi gününden 2 gün önce hatırlatma' },
    ],
  },
  {
    id: 'ats',
    label: 'İşe Alım',
    icon: Target,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    items: [
      { key: 'ats_application', label: 'Yeni başvuru geldiğinde', description: 'Açık pozisyona yeni bir aday başvurduğunda bildirim al' },
      { key: 'ats_interview', label: 'Mülakat hatırlatması', description: 'Planlanmış mülakatlardan 1 saat önce hatırlatma' },
    ],
  },
  {
    id: 'performance',
    label: 'Performans',
    icon: BarChart2,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    items: [
      { key: 'perf_okr', label: 'OKR değerlendirme zamanı', description: 'OKR dönem sonu değerlendirmesi yaklaştığında bildirim al' },
      { key: 'perf_feedback', label: 'Geri bildirim geldiğinde', description: 'Yeni bir performans geri bildirimi aldığınızda' },
    ],
  },
  {
    id: 'system',
    label: 'Sistem',
    icon: Shield,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    items: [
      { key: 'sys_updates', label: 'Platform güncellemeleri', description: 'Yeni özellikler ve iyileştirmeler hakkında bilgi al' },
      { key: 'sys_security', label: 'Güvenlik uyarıları', description: 'Şüpheli giriş ve güvenlik olayları bildirimleri' },
    ],
  },
]

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    NOTIFICATION_GROUPS.forEach(g => g.items.forEach(item => {
      initial[item.key] = true
    }))
    return initial
  })
  const [saving, setSaving] = useState(false)

  const toggle = (key: string) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulated save — will be connected to API later
    await new Promise(r => setTimeout(r, 600))
    toast.success('Bildirim tercihleri kaydedildi')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {NOTIFICATION_GROUPS.map(group => {
        const Icon = group.icon
        return (
          <div key={group.id} className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl ${group.bgColor} ${group.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-ink">{group.label}</h3>
            </div>

            <div className="space-y-4">
              {group.items.map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{item.description}</p>
                  </div>
                  <Switch.Root
                    checked={prefs[item.key]}
                    onCheckedChange={() => toggle(item.key)}
                    className={`w-[42px] h-[25px] rounded-full relative outline-none cursor-pointer transition-colors ${
                      prefs[item.key] ? 'bg-brand-500' : 'bg-gray-200'
                    }`}
                  >
                    <Switch.Thumb
                      className={`block w-[21px] h-[21px] bg-white rounded-full transition-transform shadow-sm ${
                        prefs[item.key] ? 'translate-x-[19px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </Switch.Root>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
        </button>
      </div>
    </div>
  )
}
