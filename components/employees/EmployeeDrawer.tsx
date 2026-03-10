'use client'
import { useState } from 'react'
import {
  X, Mail, Phone, Calendar, Building2, MapPin,
  Edit2, Save, Trash2, ChevronRight, ExternalLink,
  Loader2, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  location?: string
  employmentType: string
  status: string
  startDate?: string
  employeeNumber?: string
  avatarUrl?: string
  salary?: number
  salaryCurrency?: string
  salaryPeriod?: string
  gender?: string
  nationalId?: string
  bankName?: string
  bankIban?: string
  sgkNumber?: string
  emergencyName?: string
  emergencyPhone?: string
  emergencyRel?: string
  manager?: { id: string; firstName: string; lastName: string; jobTitle?: string; avatarUrl?: string }
  reports?: { id: string; firstName: string; lastName: string; jobTitle?: string; avatarUrl?: string }[]
}

type Props = {
  employee: Employee
  onClose: () => void
  onUpdated: (updated: Employee) => void
  onDeleted: () => void
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  TERMINATED: 'bg-red-100 text-red-700',
  PENDING: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif', ON_LEAVE: 'İzinde', TERMINATED: 'Ayrıldı', PENDING: 'Beklemede',
}

function Avatar({ emp, size = 'lg' }: { emp: Employee; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-lg' }
  const colors = ['bg-brand-100 text-brand-600', 'bg-purple-100 text-purple-600', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600']
  const color = colors[(emp.firstName.charCodeAt(0) + emp.lastName.charCodeAt(0)) % colors.length]
  const initials = `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase()
  if (emp.avatarUrl) return <img src={emp.avatarUrl} className={`${sizes[size]} rounded-2xl object-cover`} />
  return <div className={`${sizes[size]} ${color} rounded-2xl flex items-center justify-center font-bold flex-shrink-0`}>{initials}</div>
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-ink-muted" />
      </div>
      <div>
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm font-medium text-ink mt-0.5">{value}</p>
      </div>
    </div>
  )
}

export function EmployeeDrawer({ employee, onClose, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState<Partial<Employee>>({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    jobTitle: employee.jobTitle,
    department: employee.department,
    location: employee.location,
    status: employee.status,
    salary: employee.salary,
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Güncellendi')
      setEditing(false)
      onUpdated({ ...employee, ...data })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`${employee.firstName} ${employee.lastName} işten çıkarıldı`)
      onDeleted()
    } catch {
      toast.error('İşlem başarısız')
    } finally {
      setDeleting(false)
    }
  }

  const emp = { ...employee, ...form }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in" style={{ animation: 'slideInRight 0.3s ease forwards' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start justify-between mb-5">
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-surface-muted flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-ink-muted" />
            </button>
            <div className="flex items-center gap-2">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">
                  <Edit2 className="w-3.5 h-3.5" /> Düzenle
                </button>
              ) : (
                <>
                  <button onClick={() => setEditing(false)} className="btn-ghost text-xs px-3 py-1.5">İptal</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Save className="w-3.5 h-3.5" /> Kaydet</>}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Avatar emp={employee} />
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex gap-2 mb-1">
                  <input className="input text-sm py-1.5 px-2 font-bold" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                  <input className="input text-sm py-1.5 px-2 font-bold" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                </div>
              ) : (
                <h2 className="font-bold text-ink text-xl font-display">
                  {emp.firstName} {emp.lastName}
                </h2>
              )}
              {editing ? (
                <input className="input text-xs py-1 px-2 mt-1" value={form.jobTitle || ''} onChange={e => set('jobTitle', e.target.value)} placeholder="Görev" />
              ) : (
                <p className="text-ink-secondary text-sm">{emp.jobTitle || '—'}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge ${STATUS_COLORS[emp.status || 'ACTIVE']}`}>
                  {STATUS_LABELS[emp.status || 'ACTIVE']}
                </span>
                {emp.employeeNumber && (
                  <span className="text-xs text-ink-muted font-mono">{emp.employeeNumber}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Contact */}
          <section>
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">İletişim</h3>
            <div className="space-y-3">
              {editing ? (
                <>
                  <div>
                    <label className="label">E-posta</label>
                    <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Telefon</label>
                    <input className="input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
                  </div>
                </>
              ) : (
                <>
                  <InfoRow icon={Mail} label="E-posta" value={emp.email} />
                  <InfoRow icon={Phone} label="Telefon" value={emp.phone} />
                </>
              )}
            </div>
          </section>

          {/* Work */}
          <section>
            <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">İş Bilgileri</h3>
            <div className="space-y-3">
              {editing ? (
                <>
                  <div>
                    <label className="label">Departman</label>
                    <input className="input" value={form.department || ''} onChange={e => set('department', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Lokasyon</label>
                    <input className="input" value={form.location || ''} onChange={e => set('location', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Durum</label>
                    <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                      <option value="ACTIVE">Aktif</option>
                      <option value="ON_LEAVE">İzinde</option>
                      <option value="TERMINATED">Ayrıldı</option>
                      <option value="PENDING">Beklemede</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <InfoRow icon={Building2} label="Departman" value={emp.department} />
                  <InfoRow icon={MapPin} label="Lokasyon" value={emp.location} />
                  <InfoRow icon={Calendar} label="İşe Başlama" value={
                    emp.startDate
                      ? new Date(emp.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : undefined
                  } />
                </>
              )}
            </div>
          </section>

          {/* Manager */}
          {employee.manager && (
            <section>
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Yönetici</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted">
                <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                  {employee.manager.firstName[0]}{employee.manager.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </p>
                  <p className="text-xs text-ink-muted">{employee.manager.jobTitle}</p>
                </div>
              </div>
            </section>
          )}

          {/* Direct reports */}
          {employee.reports && employee.reports.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">
                Direkt Raporlar ({employee.reports.length})
              </h3>
              <div className="space-y-2">
                {employee.reports.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                      {r.firstName[0]}{r.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-ink">{r.firstName} {r.lastName}</p>
                      <p className="text-xs text-ink-muted">{r.jobTitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Salary (blurred unless editing) */}
          {(emp.salary || editing) && (
            <section>
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-3">Maaş</h3>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input flex-1"
                    value={form.salary || ''}
                    onChange={e => set('salary', parseFloat(e.target.value))}
                    placeholder="50000"
                  />
                  <span className="input w-20 text-center bg-surface-muted">₺</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-muted">
                  <span className="text-base">💰</span>
                  <span className="font-bold text-ink">
                    {emp.salary?.toLocaleString('tr-TR')} {emp.salaryCurrency || 'TRY'}
                  </span>
                  <span className="text-xs text-ink-muted">/ {emp.salaryPeriod === 'MONTHLY' ? 'ay' : 'yıl'}</span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer - Delete */}
        <div className="px-6 py-4 border-t border-gray-100">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              İşten Çıkar
            </button>
          ) : (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">
                  {employee.firstName} işten çıkarılsın mı? Bu işlem geri alınabilir.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary flex-1 text-sm py-1.5">
                  Vazgeç
                </button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Evet, Çıkar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
