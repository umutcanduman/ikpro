'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Target, TrendingUp, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type OKR = {
  id: string; title: string; description?: string; period: string
  type: string; progress: number; status: string; dueDate?: string
  owner: { id: string; firstName: string; lastName: string; avatarUrl?: string; jobTitle?: string }
  children: OKR[]
}

const STATUS_COLORS: Record<string, string> = {
  ON_TRACK: 'bg-green-100 text-green-700',
  AT_RISK:  'bg-amber-100 text-amber-700',
  BEHIND:   'bg-red-100 text-red-700',
  COMPLETED:'bg-brand-100 text-brand-600',
}
const STATUS_LABELS: Record<string, string> = {
  ON_TRACK: 'Yolunda', AT_RISK: 'Risk Var', BEHIND: 'Geride', COMPLETED: 'Tamamlandı'
}

function ProgressBar({ value, status }: { value: number; status: string }) {
  const colors: Record<string, string> = { ON_TRACK: 'bg-green-400', AT_RISK: 'bg-amber-400', BEHIND: 'bg-red-400', COMPLETED: 'bg-brand-500' }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colors[status] || 'bg-brand-400'}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold text-ink-muted w-8 text-right">{Math.round(value)}%</span>
    </div>
  )
}

function OKRCard({ okr, onUpdate }: { okr: OKR; onUpdate: (id: string, progress: number) => void }) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [progress, setProgress] = useState(okr.progress)

  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">{okr.period}</span>
              <span className={`badge ${STATUS_COLORS[okr.status]}`}>{STATUS_LABELS[okr.status]}</span>
            </div>
            <h3 className="font-bold text-ink">{okr.title}</h3>
            {okr.description && <p className="text-sm text-ink-secondary mt-1">{okr.description}</p>}

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                  {okr.owner.firstName[0]}{okr.owner.lastName[0]}
                </div>
                <span className="text-xs text-ink-muted">{okr.owner.firstName} {okr.owner.lastName}</span>
              </div>
              {okr.dueDate && (
                <span className="text-xs text-ink-muted">
                  📅 {new Date(okr.dueDate).toLocaleDateString('tr-TR')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {okr.children.length > 0 && (
              <button onClick={() => setExpanded(v => !v)} className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center text-ink-muted transition-colors">
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          {editing ? (
            <div className="flex items-center gap-3">
              <input
                type="range" min="0" max="100" value={progress}
                onChange={e => setProgress(parseInt(e.target.value))}
                className="flex-1 accent-brand-500"
              />
              <span className="text-sm font-bold text-ink w-8">{progress}%</span>
              <button onClick={() => { onUpdate(okr.id, progress); setEditing(false) }} className="btn-primary text-xs px-3 py-1.5">
                Kaydet
              </button>
              <button onClick={() => setEditing(false)} className="btn-ghost text-xs">İptal</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1"><ProgressBar value={okr.progress} status={okr.status} /></div>
              <button onClick={() => setEditing(true)} className="text-xs text-brand-500 hover:underline flex-shrink-0">
                Güncelle
              </button>
            </div>
          )}
        </div>
      </div>

      {expanded && okr.children.length > 0 && (
        <div className="border-t border-gray-100 bg-surface-muted/30 px-5 py-3 space-y-2">
          {okr.children.map(kr => (
            <div key={kr.id} className="flex items-center gap-3 py-2">
              <div className="w-1 h-1 rounded-full bg-brand-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{kr.title}</p>
                <ProgressBar value={kr.progress} status={kr.status} />
              </div>
              <span className={`badge text-xs ${STATUS_COLORS[kr.status]}`}>{STATUS_LABELS[kr.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PERIODS = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4', '2025-Q1', '2025-Q2']

export default function PerformancePage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'

  const [okrs, setOkrs] = useState<OKR[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('2025-Q1')
  const [showNew, setShowNew] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string }[]>([])
  const [newOkr, setNewOkr] = useState({ title: '', description: '', ownerId: '', period, type: 'OBJECTIVE', dueDate: '', status: 'ON_TRACK' })

  useEffect(() => { fetchOkrs() }, [period])
  useEffect(() => { fetchEmployees() }, [])

  async function fetchOkrs() {
    setLoading(true)
    const res = await fetch(`/api/performance/okrs?companyId=${companyId}&period=${period}`)
    const data = await res.json()
    setOkrs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function fetchEmployees() {
    const res = await fetch(`/api/employees?companyId=${companyId}&status=ACTIVE`)
    const data = await res.json()
    setEmployees(data.employees || [])
  }

  async function handleUpdate(id: string, progress: number) {
    const status = progress === 100 ? 'COMPLETED' : progress >= 70 ? 'ON_TRACK' : progress >= 40 ? 'AT_RISK' : 'BEHIND'
    await fetch(`/api/performance/okrs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress, status })
    })
    fetchOkrs()
    toast.success('OKR güncellendi')
  }

  async function handleCreate() {
    if (!newOkr.title || !newOkr.ownerId) { toast.error('Başlık ve sahip zorunlu'); return }
    const res = await fetch('/api/performance/okrs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, ...newOkr, period })
    })
    if (res.ok) { toast.success('OKR oluşturuldu'); setShowNew(false); fetchOkrs() }
  }

  const avgProgress = okrs.length ? Math.round(okrs.reduce((s, o) => s + o.progress, 0) / okrs.length) : 0

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">Performans & OKR</h1>
            <p className="text-ink-muted text-sm mt-0.5">{okrs.length} hedef · Ortalama ilerleme: %{avgProgress}</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="input w-auto" value={period} onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="w-4 h-4" /> OKR Ekle</button>
          </div>
        </div>

        {/* Progress summary */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(STATUS_LABELS).map(([status, label]) => {
            const count = okrs.filter(o => o.status === status).length
            return (
              <div key={status} className="card p-4 text-center">
                <p className="text-2xl font-black text-ink">{count}</p>
                <span className={`badge mt-1 ${STATUS_COLORS[status]}`}>{label}</span>
              </div>
            )
          })}
        </div>

        {/* OKR list */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
        ) : okrs.length === 0 ? (
          <div className="card py-20 text-center">
            <Target className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <p className="font-medium text-ink">Bu dönem için OKR yok</p>
            <button onClick={() => setShowNew(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" /> İlk OKR'ı Oluştur</button>
          </div>
        ) : (
          <div className="space-y-4">
            {okrs.map(okr => <OKRCard key={okr.id} okr={okr} onUpdate={handleUpdate} />)}
          </div>
        )}

        {/* New OKR modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-up p-7 space-y-4">
              <h2 className="font-bold text-xl text-ink font-display">Yeni OKR</h2>
              <div>
                <label className="label">Başlık *</label>
                <input className="input" placeholder="2025 Q1 ürün büyümesi..." value={newOkr.title} onChange={e => setNewOkr(o => ({ ...o, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea className="input h-20 resize-none" value={newOkr.description} onChange={e => setNewOkr(o => ({ ...o, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sahip *</label>
                  <select className="input" value={newOkr.ownerId} onChange={e => setNewOkr(o => ({ ...o, ownerId: e.target.value }))}>
                    <option value="">Seçiniz</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Bitiş Tarihi</label>
                  <input type="date" className="input" value={newOkr.dueDate} onChange={e => setNewOkr(o => ({ ...o, dueDate: e.target.value }))} />
                </div>
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
