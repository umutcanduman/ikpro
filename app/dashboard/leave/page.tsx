'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Check, X, Clock, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type LeaveRequest = {
  id: string
  days: number
  startDate: string
  endDate: string
  reason?: string
  status: string
  leaveType: { id: string; name: string; color: string }
  employee: { id: string; firstName: string; lastName: string; department?: string; avatarUrl?: string }
  createdAt: string
}

type LeaveType = { id: string; name: string; color: string; daysPerYear: number }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:  { label: 'Beklemede', color: 'bg-amber-100 text-amber-700',  icon: Clock },
  APPROVED: { label: 'Onaylandı', color: 'bg-green-100 text-green-700',  icon: Check },
  REJECTED: { label: 'Reddedildi', color: 'bg-red-100 text-red-700',    icon: X },
  CANCELLED:{ label: 'İptal',      color: 'bg-gray-100 text-gray-600',   icon: X },
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const colors = ['bg-brand-100 text-brand-600', 'bg-purple-100 text-purple-600', 'bg-green-100 text-green-600']
  const color = colors[name.charCodeAt(0) % 3]
  return <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>{initials}</div>
}

export default function LeavePage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newRequest, setNewRequest] = useState({
    employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: ''
  })
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string }[]>([])

  useEffect(() => {
    fetchData()
    fetchEmployees()
  }, [filterStatus])

  async function fetchData() {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ companyId, ...(filterStatus ? { status: filterStatus } : {}) })
      const res = await fetch(`/api/leave?${qs}`)
      const data = await res.json()
      setRequests(data.requests || [])
      setLeaveTypes(data.leaveTypes || [])
    } catch { toast.error('Veriler yüklenemedi') }
    finally { setLoading(false) }
  }

  async function fetchEmployees() {
    const res = await fetch(`/api/employees?companyId=${companyId}&status=ACTIVE`)
    const data = await res.json()
    setEmployees(data.employees || [])
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/leave/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    if (res.ok) {
      toast.success(action === 'approve' ? 'İzin onaylandı' : 'İzin reddedildi')
      fetchData()
    } else toast.error('İşlem başarısız')
  }

  async function handleSubmitNew() {
    if (!newRequest.employeeId || !newRequest.leaveTypeId || !newRequest.startDate || !newRequest.endDate) {
      toast.error('Tüm zorunlu alanları doldurun'); return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, ...newRequest })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('İzin talebi oluşturuldu')
      setShowNewForm(false)
      setNewRequest({ employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' })
      fetchData()
    } catch (e: any) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  const pending = requests.filter(r => r.status === 'PENDING')
  const others = requests.filter(r => r.status !== 'PENDING')

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">İzin & Mesai</h1>
            <p className="text-ink-muted text-sm mt-0.5">{pending.length} bekleyen talep</p>
          </div>
          <button onClick={() => setShowNewForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> İzin Talebi Oluştur
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const Icon = cfg.icon
            const count = requests.filter(r => r.status === status).length
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
                className={`card p-4 text-left transition-all hover:shadow-card-hover ${filterStatus === status ? 'ring-2 ring-brand-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge ${cfg.color}`}><Icon className="w-3 h-3" />{cfg.label}</span>
                </div>
                <p className="text-2xl font-black text-ink">{count}</p>
              </button>
            )
          })}
        </div>

        {/* New request form */}
        {showNewForm && (
          <div className="card p-6 border-2 border-brand-200 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-ink">Yeni İzin Talebi</h3>
              <button onClick={() => setShowNewForm(false)} className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center">
                <X className="w-4 h-4 text-ink-muted" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Çalışan *</label>
                <select className="input" value={newRequest.employeeId} onChange={e => setNewRequest(r => ({ ...r, employeeId: e.target.value }))}>
                  <option value="">Seçiniz</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">İzin Türü *</label>
                <select className="input" value={newRequest.leaveTypeId} onChange={e => setNewRequest(r => ({ ...r, leaveTypeId: e.target.value }))}>
                  <option value="">Seçiniz</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Başlangıç *</label>
                <input type="date" className="input" value={newRequest.startDate} onChange={e => setNewRequest(r => ({ ...r, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Bitiş *</label>
                <input type="date" className="input" value={newRequest.endDate} onChange={e => setNewRequest(r => ({ ...r, endDate: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Açıklama</label>
                <input className="input" placeholder="Opsiyonel not..." value={newRequest.reason} onChange={e => setNewRequest(r => ({ ...r, reason: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNewForm(false)} className="btn-secondary">İptal</button>
              <button onClick={handleSubmitNew} disabled={submitting} className="btn-primary">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Talep Oluştur'}
              </button>
            </div>
          </div>
        )}

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Onay Bekleyenler</h2>
            <div className="space-y-2">
              {pending.map(req => (
                <div key={req.id} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all">
                  <Avatar name={`${req.employee.firstName} ${req.employee.lastName}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-ink">{req.employee.firstName} {req.employee.lastName}</p>
                      <span className="text-xs text-ink-muted">{req.employee.department}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: req.leaveType.color + '20', color: req.leaveType.color }}>
                        {req.leaveType.name}
                      </span>
                      <span className="text-xs text-ink-secondary">
                        {new Date(req.startDate).toLocaleDateString('tr-TR')} — {new Date(req.endDate).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="text-xs font-bold text-ink">{req.days} gün</span>
                    </div>
                    {req.reason && <p className="text-xs text-ink-muted mt-0.5 truncate">{req.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      className="w-9 h-9 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      className="w-9 h-9 rounded-xl bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All requests table */}
        <div>
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Tüm Talepler</h2>
          <div className="card overflow-hidden">
            {loading ? (
              <div className="py-16 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
            ) : others.length === 0 && !pending.length ? (
              <div className="py-16 text-center">
                <Calendar className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                <p className="font-medium text-ink">Henüz izin talebi yok</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-surface-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Çalışan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase hidden md:table-cell">İzin Türü</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase hidden lg:table-cell">Tarih Aralığı</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Süre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...pending, ...others].map(req => {
                    const cfg = STATUS_CONFIG[req.status]
                    const Icon = cfg.icon
                    return (
                      <tr key={req.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={`${req.employee.firstName} ${req.employee.lastName}`} size="sm" />
                            <span className="text-sm font-medium text-ink">{req.employee.firstName} {req.employee.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: req.leaveType.color + '20', color: req.leaveType.color }}>
                            {req.leaveType.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-ink-secondary hidden lg:table-cell">
                          {new Date(req.startDate).toLocaleDateString('tr-TR')} — {new Date(req.endDate).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-ink">{req.days}g</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`badge ${cfg.color}`}><Icon className="w-3 h-3" />{cfg.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
