'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Heart, MessageCircle, Star, Users, Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type Survey = {
  id: string; title: string; type: string; status: string
  anonymous: boolean; scheduledAt?: string; closedAt?: string
  createdAt: string
  _count: { responses: number; questions: number }
}

const TYPE_LABELS: Record<string, string> = { PULSE: '💓 Nabız', ENPS: '📊 eNPS', ONBOARDING: '🎉 Oryantasyon', EXIT: '👋 Çıkış', CUSTOM: '🎯 Özel' }
const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-600', ACTIVE: 'bg-green-100 text-green-700', CLOSED: 'bg-red-100 text-red-600' }
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Taslak', ACTIVE: 'Aktif', CLOSED: 'Kapandı' }

const PULSE_TEMPLATES = [
  { title: 'Haftalık Nabız Anketi', type: 'PULSE', questions: [
    { text: 'Bu hafta genel memnuniyetinizi değerlendirin', type: 'RATING' },
    { text: 'Yöneticinizden yeterli destek alıyor musunuz?', type: 'RATING' },
    { text: 'Bu hafta öne çıkmak istediğiniz bir şey var mı?', type: 'TEXT' },
  ]},
  { title: 'eNPS Ölçümü', type: 'ENPS', questions: [
    { text: 'Şirketimizi bir arkadaşınıza/ailenize iş yeri olarak önerir misiniz? (0-10)', type: 'SCALE' },
    { text: 'Bu puanı neden verdirdiniz?', type: 'TEXT' },
  ]},
  { title: 'Çalışan Bağlılık Anketi', type: 'PULSE', questions: [
    { text: 'İşinizde kendinizi değerli hissediyor musunuz?', type: 'RATING' },
    { text: 'İş-yaşam dengenizden memnun musunuz?', type: 'RATING' },
    { text: 'Kariyer gelişiminiz için gerekli fırsatlara sahip misiniz?', type: 'RATING' },
    { text: 'Şirkette değiştirmek istediğiniz en önemli şey nedir?', type: 'TEXT' },
  ]},
]

export default function EngagementPage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof PULSE_TEMPLATES[0] | null>(null)
  const [newSurvey, setNewSurvey] = useState({ title: '', type: 'PULSE', anonymous: true })

  useEffect(() => { fetchSurveys() }, [])

  async function fetchSurveys() {
    setLoading(true)
    const res = await fetch(`/api/surveys?companyId=${companyId}`)
    const data = await res.json()
    setSurveys(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleCreate(template?: typeof PULSE_TEMPLATES[0]) {
    const surveyData = template || newSurvey
    if (!surveyData.title) { toast.error('Başlık zorunlu'); return }
    const res = await fetch('/api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        title: surveyData.title,
        type: surveyData.type,
        anonymous: true,
        status: 'ACTIVE',
        questions: (template as any)?.questions || [],
      })
    })
    if (res.ok) {
      toast.success('Anket oluşturuldu ve gönderildi!')
      setShowNew(false)
      setSelectedTemplate(null)
      fetchSurveys()
    }
  }

  const activeSurveys = surveys.filter(s => s.status === 'ACTIVE')
  const totalResponses = surveys.reduce((s, sv) => s + sv._count.responses, 0)

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">Bağlılık & Refah</h1>
            <p className="text-ink-muted text-sm mt-0.5">{activeSurveys.length} aktif anket · {totalResponses} toplam yanıt</p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="w-4 h-4" /> Anket Oluştur</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center"><Heart className="w-5 h-5 text-pink-500" /></div>
            <div><p className="text-2xl font-black text-ink">{activeSurveys.length}</p><p className="text-sm text-ink-muted">Aktif Anket</p></div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-blue-500" /></div>
            <div><p className="text-2xl font-black text-ink">{totalResponses}</p><p className="text-sm text-ink-muted">Toplam Yanıt</p></div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Star className="w-5 h-5 text-amber-500" /></div>
            <div><p className="text-2xl font-black text-ink">—</p><p className="text-sm text-ink-muted">Ort. eNPS Skoru</p></div>
          </div>
        </div>

        {/* Templates teaser */}
        <div>
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Hazır Şablonlar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PULSE_TEMPLATES.map(t => (
              <button
                key={t.title}
                onClick={() => handleCreate(t)}
                className="card p-4 text-left hover:shadow-card-hover hover:border-brand-300 border-2 border-transparent transition-all group"
              >
                <div className="text-2xl mb-2">{TYPE_LABELS[t.type]?.split(' ')[0]}</div>
                <p className="font-semibold text-sm text-ink">{t.title}</p>
                <p className="text-xs text-ink-muted mt-1">{t.questions.length} soru</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-brand-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <Send className="w-3.5 h-3.5" /> Hemen Gönder
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Survey list */}
        <div>
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Anketler</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
          ) : surveys.length === 0 ? (
            <div className="card py-16 text-center">
              <Heart className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <p className="font-medium text-ink">Henüz anket gönderilmedi</p>
              <p className="text-sm text-ink-muted mt-1">Hazır şablonları kullanarak hemen başlayın</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-surface-muted/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Anket</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase hidden md:table-cell">Tür</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-ink-muted uppercase">Soru</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-ink-muted uppercase">Yanıt</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {surveys.map(s => (
                    <tr key={s.id} className="hover:bg-surface-muted/50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-sm text-ink">{s.title}</p>
                        {s.anonymous && <p className="text-xs text-ink-muted">Anonim</p>}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm">{TYPE_LABELS[s.type]}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-ink">{s._count.questions}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-bold text-ink">{s._count.responses}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${STATUS_COLORS[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* New Survey Modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-up p-7 space-y-4">
              <h2 className="font-bold text-xl text-ink font-display">Yeni Anket</h2>
              <div>
                <label className="label">Başlık *</label>
                <input className="input" value={newSurvey.title} onChange={e => setNewSurvey(s => ({ ...s, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tür</label>
                <select className="input" value={newSurvey.type} onChange={e => setNewSurvey(s => ({ ...s, type: e.target.value }))}>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">İptal</button>
                <button onClick={() => handleCreate()} className="btn-primary flex-1">Oluştur</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
