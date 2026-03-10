'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, BookOpen, Clock, Users, CheckCircle, Play, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type Course = {
  id: string; title: string; description?: string; category?: string
  durationMins?: number; isRequired: boolean; status: string
  _count: { enrollments: number; lessons: number }
  enrollments?: { status: string; progress: number }[]
}

const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-600', PUBLISHED: 'bg-green-100 text-green-700', ARCHIVED: 'bg-red-100 text-red-600' }
const ENROLLMENT_COLORS: Record<string, string> = { NOT_STARTED: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-blue-100 text-blue-600', COMPLETED: 'bg-green-100 text-green-700', FAILED: 'bg-red-100 text-red-600' }

const CATEGORIES = ['Teknik', 'Liderlik', 'İletişim', 'Uyum & Mevzuat', 'Oryantasyon', 'Güvenlik', 'Kişisel Gelişim']

export default function LMSPage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', category: '', durationMins: '', isRequired: false, status: 'PUBLISHED' })

  useEffect(() => { fetchCourses() }, [])

  async function fetchCourses() {
    setLoading(true)
    const res = await fetch(`/api/lms?companyId=${companyId}`)
    const data = await res.json()
    setCourses(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!newCourse.title) { toast.error('Başlık zorunlu'); return }
    const res = await fetch('/api/lms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, ...newCourse, durationMins: newCourse.durationMins ? parseInt(newCourse.durationMins) : undefined })
    })
    if (res.ok) { toast.success('Kurs oluşturuldu'); setShowNew(false); fetchCourses() }
  }

  const published = courses.filter(c => c.status === 'PUBLISHED')
  const required = courses.filter(c => c.isRequired)

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">Eğitim (LMS)</h1>
            <p className="text-ink-muted text-sm mt-0.5">{published.length} aktif kurs · {required.length} zorunlu</p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="w-4 h-4" /> Kurs Oluştur</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><BookOpen className="w-5 h-5 text-brand-500" /></div>
            <div><p className="text-2xl font-black text-ink">{courses.length}</p><p className="text-sm text-ink-muted">Toplam Kurs</p></div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-amber-500" /></div>
            <div><p className="text-2xl font-black text-ink">{required.length}</p><p className="text-sm text-ink-muted">Zorunlu Eğitim</p></div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center"><Users className="w-5 h-5 text-green-500" /></div>
            <div><p className="text-2xl font-black text-ink">{courses.reduce((s, c) => s + c._count.enrollments, 0)}</p><p className="text-sm text-ink-muted">Toplam Kayıt</p></div>
          </div>
        </div>

        {/* Course grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
        ) : courses.length === 0 ? (
          <div className="card py-20 text-center">
            <BookOpen className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <p className="font-medium text-ink">Henüz kurs yok</p>
            <button onClick={() => setShowNew(true)} className="btn-primary mt-4"><Plus className="w-4 h-4" /> İlk Kursu Oluştur</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <div key={course.id} className="card p-5 hover:shadow-card-hover transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl">📚</div>
                  <div className="flex items-center gap-1.5">
                    {course.isRequired && <span className="badge bg-red-100 text-red-600">Zorunlu</span>}
                    <span className={`badge ${STATUS_COLORS[course.status]}`}>{course.status === 'PUBLISHED' ? 'Yayında' : course.status === 'DRAFT' ? 'Taslak' : 'Arşiv'}</span>
                  </div>
                </div>
                <h3 className="font-bold text-ink mb-1">{course.title}</h3>
                {course.description && <p className="text-xs text-ink-secondary line-clamp-2 mb-3">{course.description}</p>}
                <div className="flex items-center gap-3 text-xs text-ink-muted mt-auto pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course._count.enrollments} kişi</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course._count.lessons} ders</span>
                  {course.durationMins && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.durationMins}dk</span>}
                  {course.category && <span className="ml-auto text-brand-400 font-medium">{course.category}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Course Modal */}
        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-up p-7 space-y-4">
              <h2 className="font-bold text-xl text-ink font-display">Yeni Kurs</h2>
              <div>
                <label className="label">Kurs Adı *</label>
                <input className="input" placeholder="KVKK Farkındalık Eğitimi" value={newCourse.title} onChange={e => setNewCourse(c => ({ ...c, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Açıklama</label>
                <textarea className="input h-20 resize-none" value={newCourse.description} onChange={e => setNewCourse(c => ({ ...c, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Kategori</label>
                  <select className="input" value={newCourse.category} onChange={e => setNewCourse(c => ({ ...c, category: e.target.value }))}>
                    <option value="">Seçiniz</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Süre (dakika)</label>
                  <input type="number" className="input" placeholder="60" value={newCourse.durationMins} onChange={e => setNewCourse(c => ({ ...c, durationMins: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted border border-gray-100">
                <input type="checkbox" id="required" checked={newCourse.isRequired} onChange={e => setNewCourse(c => ({ ...c, isRequired: e.target.checked }))} className="rounded" />
                <label htmlFor="required" className="text-sm font-medium text-ink cursor-pointer">Zorunlu eğitim olarak işaretle</label>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">İptal</button>
                <button onClick={handleCreate} className="btn-primary flex-1">Kurs Oluştur</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
