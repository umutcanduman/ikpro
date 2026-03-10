'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { TrendingUp, TrendingDown, Users, UserMinus, UserPlus, Briefcase, Loader2, BarChart2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type AnalyticsData = {
  headcount: { total: number; active: number; onLeave: number; terminated: number }
  growth: { hiredThisYear: number; terminatedThisYear: number; attritionRate: number }
  deptBreakdown: { name: string; count: number }[]
  typeBreakdown: { type: string; count: number }[]
  monthlyHires: Record<string, number>
  openJobs: number
  pendingLeave: number
  activeCourses: number
  lastPayroll: { period: string; totalNet: number; status: string } | null
}

const TYPE_LABELS: Record<string, string> = { FULL_TIME: 'Tam Zamanlı', PART_TIME: 'Yarı Zamanlı', CONTRACT: 'Sözleşmeli', INTERN: 'Stajyer', FREELANCE: 'Freelance' }
const COLORS = ['bg-brand-500', 'bg-purple-400', 'bg-green-400', 'bg-amber-400', 'bg-pink-400']

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
      </div>
      <span className="text-sm font-bold text-ink w-6 text-right">{value}</span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, trend, color }: { icon: any; label: string; value: string | number; sub?: string; trend?: 'up' | 'down' | 'neutral'; color: string }) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-black text-ink">{value}</p>
      <p className="text-sm text-ink-muted mt-0.5">{label}</p>
      {sub && <p className="text-xs text-ink-muted mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics?companyId=${companyId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    </DashboardLayout>
  )

  if (!data) return <DashboardLayout><div className="p-8 text-center text-ink-muted">Veri yüklenemedi</div></DashboardLayout>

  const maxDept = Math.max(...data.deptBreakdown.map(d => d.count), 1)
  const monthKeys = Object.keys(data.monthlyHires).sort().slice(-6)
  const maxHires = Math.max(...Object.values(data.monthlyHires), 1)

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">İK Analitik</h1>
          <p className="text-ink-muted text-sm mt-0.5">Şirket geneli iş gücü verileri</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Toplam Çalışan" value={data.headcount.total} sub={`${data.headcount.active} aktif`} color="bg-brand-500" />
          <StatCard icon={UserPlus} label="Bu Yıl İşe Alınan" value={data.growth.hiredThisYear} color="bg-green-500" />
          <StatCard icon={UserMinus} label="İşten Ayrılma Oranı" value={`%${data.growth.attritionRate}`} sub="Bu yıl" color={data.growth.attritionRate > 15 ? 'bg-red-500' : 'bg-amber-500'} />
          <StatCard icon={Briefcase} label="Açık Pozisyon" value={data.openJobs} color="bg-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly hires chart */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="font-bold text-ink mb-5">Son 6 Ay — İşe Alımlar</h3>
            {monthKeys.length === 0 ? (
              <div className="py-12 text-center text-ink-muted text-sm">Veri yok</div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {monthKeys.map((month, i) => {
                  const count = data.monthlyHires[month] || 0
                  const heightPct = maxHires > 0 ? (count / maxHires) * 100 : 0
                  const monthLabel = new Date(month + '-01').toLocaleDateString('tr-TR', { month: 'short' })
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-ink">{count > 0 ? count : ''}</span>
                      <div className="w-full flex items-end" style={{ height: '100px' }}>
                        <div
                          className="w-full rounded-t-lg bg-brand-500 transition-all duration-500 hover:bg-brand-400"
                          style={{ height: `${Math.max(heightPct, count > 0 ? 8 : 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-muted">{monthLabel}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dept breakdown */}
          <div className="card p-6">
            <h3 className="font-bold text-ink mb-5">Departman Dağılımı</h3>
            {data.deptBreakdown.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-sm">Veri yok</div>
            ) : (
              <div className="space-y-3">
                {data.deptBreakdown.sort((a, b) => b.count - a.count).map((d, i) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-ink truncate max-w-[120px]">{d.name}</span>
                    </div>
                    <MiniBar value={d.count} max={maxDept} color={COLORS[i % COLORS.length]} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Employment type + Payroll summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-bold text-ink mb-5">Çalışma Tipi</h3>
            {data.typeBreakdown.length === 0 ? (
              <div className="py-8 text-center text-ink-muted text-sm">Veri yok</div>
            ) : (
              <div className="space-y-3">
                {data.typeBreakdown.map((t, i) => (
                  <div key={t.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-ink">{TYPE_LABELS[t.type] || t.type}</span>
                    </div>
                    <MiniBar value={t.count} max={data.headcount.active} color={COLORS[i % COLORS.length]} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-ink mb-5">Hızlı Özet</h3>
            <div className="space-y-4">
              {[
                { label: 'Bekleyen İzin Talebi', value: data.pendingLeave, icon: '🗓️' },
                { label: 'Aktif Eğitim', value: data.activeCourses, icon: '📚' },
                { label: 'İzindeki Çalışan', value: data.headcount.onLeave, icon: '🏖️' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium text-ink">{item.label}</span>
                  </div>
                  <span className="text-lg font-black text-ink">{item.value}</span>
                </div>
              ))}
              {data.lastPayroll && (
                <div className="p-3 rounded-xl bg-surface-muted">
                  <p className="text-xs text-ink-muted mb-1">Son Bordro — {data.lastPayroll.period}</p>
                  <p className="text-lg font-black text-green-600">₺{data.lastPayroll.totalNet.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-ink-muted">Net ödeme</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attrition risk banner */}
        {data.growth.attritionRate > 15 && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-bold text-red-700">Yüksek İşten Ayrılma Riski</p>
              <p className="text-sm text-red-600 mt-0.5">
                Bu yılki işten ayrılma oranı %{data.growth.attritionRate} ile sektör ortalamasının üzerinde.
                Bağlılık anketleri ve 1-on-1 görüşmeleri planlamayı düşünün.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
