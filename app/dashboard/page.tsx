'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Users, Calendar, DollarSign, Target, ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type Stats = {
  headcount?: { active: number; onLeave: number }
  openJobs?: number
  pendingLeave?: number
  activeCourses?: number
  lastPayroll?: { period: string; totalNet: number; status: string } | null
  growth?: { attritionRate: number; hiredThisYear: number }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({})
  const companyId = (session?.user as any)?.companyId

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (companyId) {
      fetch(`/api/analytics?companyId=${companyId}`)
        .then(r => r.json()).then(d => setStats(d)).catch(() => {})
    }
  }, [companyId])

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  const user = session?.user as any
  const firstName = user?.name?.split(' ')[0] || 'Hoş geldiniz'

  const kpis = [
    { icon: Users, label: 'Aktif Çalışan', value: stats.headcount?.active ?? '—', href: '/dashboard/employees', color: 'bg-brand-50 text-brand-500' },
    { icon: Calendar, label: 'Bekleyen İzin', value: stats.pendingLeave ?? '—', href: '/dashboard/leave', color: 'bg-amber-50 text-amber-500' },
    { icon: Target, label: 'Açık Pozisyon', value: stats.openJobs ?? '—', href: '/dashboard/ats', color: 'bg-purple-50 text-purple-500' },
    { icon: BookOpen, label: 'Aktif Eğitim', value: stats.activeCourses ?? '—', href: '/dashboard/lms', color: 'bg-green-50 text-green-500' },
  ]

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">Merhaba, {firstName} 👋</h1>
          <p className="text-ink-muted text-sm mt-1">İşte şirketinizin güncel durumu</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ icon: Icon, label, value, href, color }) => (
            <Link key={href} href={href} className="card p-5 hover:shadow-card-hover transition-all group">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-black text-ink">{value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-ink-muted">{label}</p>
                <ArrowRight className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-ink">Son Bordro</h2>
              <Link href="/dashboard/payroll" className="text-xs text-brand-500 font-semibold hover:underline flex items-center gap-1">Tümünü gör <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
            {stats.lastPayroll ? (
              <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-brand-50 to-white border border-brand-100">
                <div>
                  <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">{stats.lastPayroll.period}</p>
                  <p className="text-3xl font-black text-ink mt-1">₺{stats.lastPayroll.totalNet.toLocaleString('tr-TR')}</p>
                  <p className="text-sm text-ink-muted mt-0.5">Toplam net ödeme</p>
                </div>
                <span className={`badge ${stats.lastPayroll.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {stats.lastPayroll.status === 'PAID' ? '✓ Ödendi' : 'Hazır'}
                </span>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-surface-muted text-center">
                <DollarSign className="w-8 h-8 text-ink-muted mx-auto mb-2" />
                <p className="text-sm font-medium text-ink">Henüz bordro çalıştırılmadı</p>
                <Link href="/dashboard/payroll" className="text-xs text-brand-500 font-semibold mt-2 inline-block hover:underline">Bordro Çalıştır →</Link>
              </div>
            )}
            {stats.growth && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-surface-muted">
                  <p className="text-xs text-ink-muted">Bu Yıl İşe Alınan</p>
                  <p className="text-xl font-black text-ink">{stats.growth.hiredThisYear}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-muted">
                  <p className="text-xs text-ink-muted">Ayrılma Oranı</p>
                  <p className={`text-xl font-black ${stats.growth.attritionRate > 15 ? 'text-red-500' : 'text-ink'}`}>%{stats.growth.attritionRate}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-ink mb-4">Hızlı Eylemler</h2>
            <div className="space-y-2">
              {[
                { label: 'İzin Onayla', href: '/dashboard/leave', badge: stats.pendingLeave },
                { label: 'Bordro Çalıştır', href: '/dashboard/payroll' },
                { label: 'Çalışan Ekle', href: '/dashboard/employees' },
                { label: 'Anket Gönder', href: '/dashboard/engagement' },
                { label: 'İlan Oluştur', href: '/dashboard/ats' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-muted transition-colors group">
                  <span className="text-sm font-medium text-ink">{link.label}</span>
                  <div className="flex items-center gap-2">
                    {(link as any).badge > 0 && <span className="badge bg-amber-100 text-amber-700">{(link as any).badge}</span>}
                    <ArrowRight className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
