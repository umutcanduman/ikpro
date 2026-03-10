'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Shield, AlertCircle, CheckCircle, Clock, Plus, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type KvkkRequest = {
  id: string; type: string; status: string; description?: string
  responseNote?: string; dueDate: string; resolvedAt?: string; createdAt: string
  employee: { id: string; firstName: string; lastName: string; email: string }
}

const TYPE_LABELS: Record<string, string> = { ACCESS: 'Erişim', CORRECTION: 'Düzeltme', DELETION: 'Silme', OBJECTION: 'İtiraz', PORTABILITY: 'Taşınabilirlik' }
const TYPE_COLORS: Record<string, string> = { ACCESS: 'bg-blue-100 text-blue-700', CORRECTION: 'bg-amber-100 text-amber-700', DELETION: 'bg-red-100 text-red-700', OBJECTION: 'bg-purple-100 text-purple-700', PORTABILITY: 'bg-green-100 text-green-700' }
const STATUS_COLORS: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', IN_PROGRESS: 'bg-blue-100 text-blue-700', RESOLVED: 'bg-green-100 text-green-700', REJECTED: 'bg-red-100 text-red-600' }
const STATUS_LABELS: Record<string, string> = { PENDING: 'Bekliyor', IN_PROGRESS: 'İşlemde', RESOLVED: 'Çözüldü', REJECTED: 'Reddedildi' }

export default function KVKKPage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'

  const [requests, setRequests] = useState<KvkkRequest[]>([])
  const [stats, setStats] = useState<{ status: string; _count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [newReq, setNewReq] = useState({ employeeId: '', type: 'ACCESS', description: '' })

  useEffect(() => { fetchData(); fetchEmployees() }, [])

  async function fetchData() {
    setLoading(true)
    const res = await fetch(`/api/kvkk?companyId=${companyId}`)
    const data = await res.json()
    setRequests(data.requests || [])
    setStats(data.stats || [])
    setLoading(false)
  }

  async function fetchEmployees() {
    const res = await fetch(`/api/employees?companyId=${companyId}`)
    const data = await res.json()
    setEmployees(data.employees || [])
  }

  async function handleCreate() {
    if (!newReq.employeeId) { toast.error('Çalışan seçiniz'); return }
    const res = await fetch('/api/kvkk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, ...newReq })
    })
    if (res.ok) {
      toast.success('KVKK talebi oluşturuldu')
      setShowNew(false)
      fetchData()
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    const res = await fetch(`/api/kvkk/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (res.ok) { toast.success('Güncellendi'); fetchData() }
  }

  const pending = requests.filter(r => r.status === 'PENDING')
  const overdue = requests.filter(r => r.status !== 'RESOLVED' && r.status !== 'REJECTED' && new Date(r.dueDate) < new Date())

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">KVKK Uyumu</h1>
            <p className="text-ink-muted text-sm mt-0.5">Veri koruma talepleri ve onay yönetimi</p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="w-4 h-4" /> Talep Oluştur</button>
        </div>

        {/* Compliance banner */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg">KVKK Uyum Durumu</p>
            <p className="text-white/70 text-sm mt-0.5">
              {overdue.length === 0
                ? '✓ Tüm talepler yasal süre içinde — uyumdasınız'
                : `⚠️ ${overdue.length} talep yasal süreyi aştı — acil işlem gerekiyor`}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-black">{requests.length > 0 ? Math.round(((requests.length - pending.length) / requests.length) * 100) : 100}%</p>
            <p className="text-white/70 text-xs">Çözüm oranı</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Toplam Talep', value: requests.length, icon: FileText, color: 'bg-brand-50 text-brand-500' },
            { label: 'Bekleyen', value: pending.length, icon: Clock, color: 'bg-amber-50 text-amber-500' },
            { label: 'Süresi Dolmuş', value: overdue.length, icon: AlertCircle, color: 'bg-red-50 text-red-500' },
            { label: 'Çözüldü', value: requests.filter(r => r.status === 'RESOLVED').length, icon: CheckCircle, color: 'bg-green-50 text-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-2`}><Icon className="w-4 h-4" /></div>
              <p className="text-xl font-black text-ink">{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* Requests table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-ink">Veri Talepleri</h3>
            <p className="text-xs text-ink-muted">Yasal yanıt süresi: 30 gün</p>
          </div>
          {loading ? (
            <div className="py-16 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <p className="font-medium text-ink">Henüz KVKK talebi yok</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Çalışan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Talep Türü</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase hidden md:table-cell">Son Tarih</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Durum</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map(req => {
                  const isOverdue = req.status !== 'RESOLVED' && req.status !== 'REJECTED' && new Date(req.dueDate) < new Date()
                  return (
                    <tr key={req.id} className={`hover:bg-surface-muted/50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-sm text-ink">{req.employee.firstName} {req.employee.lastName}</p>
                        <p className="text-xs text-ink-muted">{req.employee.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${TYPE_COLORS[req.type]}`}>{TYPE_LABELS[req.type]}</span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className={`text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-ink'}`}>
                          {new Date(req.dueDate).toLocaleDateString('tr-TR')}
                        </p>
                        {isOverdue && <p className="text-xs text-red-400">Süresi doldu!</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${STATUS_COLORS[req.status]}`}>{STATUS_LABELS[req.status]}</span>
                      </td>
                      <td className="px-5 py-4">
                        {req.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdateStatus(req.id, 'IN_PROGRESS')} className="btn-secondary text-xs px-2 py-1">İşleme Al</button>
                            <button onClick={() => handleUpdateStatus(req.id, 'RESOLVED')} className="btn-primary text-xs px-2 py-1">Çöz</button>
                          </div>
                        )}
                        {req.status === 'IN_PROGRESS' && (
                          <button onClick={() => handleUpdateStatus(req.id, 'RESOLVED')} className="btn-primary text-xs px-2 py-1">Çözüldü</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* New request modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-up p-7 space-y-4">
              <h2 className="font-bold text-xl text-ink font-display">KVKK Talebi Oluştur</h2>
              <div>
                <label className="label">Çalışan *</label>
                <select className="input" value={newReq.employeeId} onChange={e => setNewReq(r => ({ ...r, employeeId: e.target.value }))}>
                  <option value="">Seçiniz</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Talep Türü</label>
                <select className="input" value={newReq.type} onChange={e => setNewReq(r => ({ ...r, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea className="input h-20 resize-none" value={newReq.description} onChange={e => setNewReq(r => ({ ...r, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">İptal</button>
                <button onClick={handleCreate} className="btn-primary flex-1">Oluştur</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
