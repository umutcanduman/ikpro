'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Briefcase, Users, Eye, Loader2, ChevronRight, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type Job = { id: string; title: string; department?: string; location?: string; type: string; status: string; _count: { candidates: number } }
type Candidate = {
  id: string; firstName: string; lastName: string; email: string; phone?: string
  source: string; stage: string; score?: number; notes?: string
  job: { id: string; title: string; department?: string }
  createdAt: string
}

const STAGES = [
  { id: 'APPLIED',    label: 'Başvurdu',  color: 'bg-gray-100', dot: 'bg-gray-400' },
  { id: 'SCREENING',  label: 'Ön Eleme',  color: 'bg-blue-50',  dot: 'bg-blue-400' },
  { id: 'INTERVIEW',  label: 'Mülakat',   color: 'bg-purple-50',dot: 'bg-purple-400' },
  { id: 'OFFER',      label: 'Teklif',    color: 'bg-amber-50', dot: 'bg-amber-400' },
  { id: 'HIRED',      label: 'İşe Alındı',color: 'bg-green-50', dot: 'bg-green-500' },
  { id: 'REJECTED',   label: 'Reddedildi',color: 'bg-red-50',   dot: 'bg-red-400' },
]
const SOURCE_LABELS: Record<string, string> = {
  KARIYER_NET: 'Kariyer.net', LINKEDIN: 'LinkedIn', INDEED: 'Indeed',
  REFERRAL: 'Referans', DIRECT: 'Direkt', GITHUB: 'GitHub', OTHER: 'Diğer'
}

function CandidateCard({ cand, onMove }: { cand: Candidate; onMove: (id: string, stage: string) => void }) {
  const [showMenu, setShowMenu] = useState(false)
  const nextStages = STAGES.filter(s => s.id !== cand.stage && s.id !== 'REJECTED')

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-card-hover transition-all group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm text-ink">{cand.firstName} {cand.lastName}</p>
          <p className="text-xs text-ink-muted truncate max-w-[140px]">{cand.email}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-7 h-7 rounded-lg hover:bg-surface-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-32 z-10">
              {nextStages.map(s => (
                <button
                  key={s.id}
                  onClick={() => { onMove(cand.id, s.id); setShowMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-muted flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              ))}
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { onMove(cand.id, 'REJECTED'); setShowMenu(false) }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Reddet
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-600 font-medium truncate max-w-[100px]">
          {cand.job.title}
        </span>
        <span className="text-xs text-ink-muted">{SOURCE_LABELS[cand.source]}</span>
      </div>
    </div>
  )
}

export default function ATSPage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'

  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [showNewJob, setShowNewJob] = useState(false)
  const [showNewCand, setShowNewCand] = useState(false)
  const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'FULL_TIME', status: 'PUBLISHED', description: '' })
  const [newCand, setNewCand] = useState({ firstName: '', lastName: '', email: '', jobId: '', source: 'DIRECT' })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [jobsRes, candsRes] = await Promise.all([
        fetch(`/api/jobs?companyId=${companyId}`),
        fetch(`/api/jobs/candidates?companyId=${companyId}`)
      ])
      const [jobsData, candsData] = await Promise.all([jobsRes.json(), candsRes.json()])
      setJobs(jobsData)
      setCandidates(candsData)
    } catch { toast.error('Veriler yüklenemedi') }
    finally { setLoading(false) }
  }

  async function handleMoveCandidate(id: string, stage: string) {
    const res = await fetch(`/api/jobs/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage })
    })
    if (res.ok) {
      setCandidates(cs => cs.map(c => c.id === id ? { ...c, stage } : c))
      toast.success(STAGES.find(s => s.id === stage)?.label + ' aşamasına taşındı')
    }
  }

  async function handleCreateJob() {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, ...newJob })
    })
    if (res.ok) {
      toast.success('İlan oluşturuldu')
      setShowNewJob(false)
      setNewJob({ title: '', department: '', location: '', type: 'FULL_TIME', status: 'PUBLISHED', description: '' })
      fetchAll()
    }
  }

  async function handleCreateCand() {
    if (!newCand.firstName || !newCand.email || !newCand.jobId) { toast.error('Zorunlu alanlar eksik'); return }
    const res = await fetch('/api/jobs/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, ...newCand, stage: 'APPLIED', lastName: newCand.lastName || '-' })
    })
    if (res.ok) {
      toast.success('Aday eklendi')
      setShowNewCand(false)
      fetchAll()
    }
  }

  const filteredCands = selectedJobId
    ? candidates.filter(c => c.job.id === selectedJobId)
    : candidates

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">İşe Alım (ATS)</h1>
            <p className="text-ink-muted text-sm mt-0.5">{jobs.filter(j => j.status === 'PUBLISHED').length} açık ilan · {candidates.length} aday</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNewCand(true)} className="btn-secondary"><Users className="w-4 h-4" /> Aday Ekle</button>
            <button onClick={() => setShowNewJob(true)} className="btn-primary"><Plus className="w-4 h-4" /> Yeni İlan</button>
          </div>
        </div>

        {/* Job filter pills */}
        {jobs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedJobId(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!selectedJobId ? 'bg-ink text-white border-ink' : 'bg-white text-ink-secondary border-gray-200'}`}>
              Tüm İlanlar ({candidates.length})
            </button>
            {jobs.filter(j => j.status === 'PUBLISHED').map(j => (
              <button key={j.id} onClick={() => setSelectedJobId(selectedJobId === j.id ? null : j.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedJobId === j.id ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-ink-secondary border-gray-200'}`}>
                {j.title} ({j._count.candidates})
              </button>
            ))}
          </div>
        )}

        {/* Kanban board */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const stageCands = filteredCands.filter(c => c.stage === stage.id)
              return (
                <div key={stage.id} className={`flex-shrink-0 w-52 rounded-2xl ${stage.color} p-3`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                      <span className="text-xs font-bold text-ink">{stage.label}</span>
                    </div>
                    <span className="text-xs font-bold text-ink-muted bg-white/80 rounded-full w-5 h-5 flex items-center justify-center">{stageCands.length}</span>
                  </div>
                  <div className="space-y-2 min-h-16">
                    {stageCands.map(c => (
                      <CandidateCard key={c.id} cand={c} onMove={handleMoveCandidate} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* New Job Modal */}
        {showNewJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-up p-7 space-y-4">
              <h2 className="font-bold text-xl text-ink font-display">Yeni İş İlanı</h2>
              <div>
                <label className="label">Pozisyon Başlığı *</label>
                <input className="input" placeholder="Senior React Developer" value={newJob.title} onChange={e => setNewJob(j => ({ ...j, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Departman</label>
                  <input className="input" placeholder="Mühendislik" value={newJob.department} onChange={e => setNewJob(j => ({ ...j, department: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Lokasyon</label>
                  <input className="input" placeholder="İstanbul" value={newJob.location} onChange={e => setNewJob(j => ({ ...j, location: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">İş Tanımı</label>
                <textarea className="input h-24 resize-none" placeholder="Pozisyon hakkında bilgi..." value={newJob.description} onChange={e => setNewJob(j => ({ ...j, description: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNewJob(false)} className="btn-secondary flex-1">İptal</button>
                <button onClick={handleCreateJob} className="btn-primary flex-1">İlanı Yayınla</button>
              </div>
            </div>
          </div>
        )}

        {/* New Candidate Modal */}
        {showNewCand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-up p-7 space-y-4">
              <h2 className="font-bold text-xl text-ink font-display">Aday Ekle</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ad *</label>
                  <input className="input" value={newCand.firstName} onChange={e => setNewCand(c => ({ ...c, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Soyad</label>
                  <input className="input" value={newCand.lastName} onChange={e => setNewCand(c => ({ ...c, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">E-posta *</label>
                <input type="email" className="input" value={newCand.email} onChange={e => setNewCand(c => ({ ...c, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">İlan *</label>
                <select className="input" value={newCand.jobId} onChange={e => setNewCand(c => ({ ...c, jobId: e.target.value }))}>
                  <option value="">Seçiniz</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Kaynak</label>
                <select className="input" value={newCand.source} onChange={e => setNewCand(c => ({ ...c, source: e.target.value }))}>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNewCand(false)} className="btn-secondary flex-1">İptal</button>
                <button onClick={handleCreateCand} className="btn-primary flex-1">Aday Ekle</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
