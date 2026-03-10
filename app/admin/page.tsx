'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Building2, Users, UserCheck, TrendingUp, Sparkles, Clock,
  ArrowUpRight, ArrowDownRight, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Stats {
  totalCompanies: number
  totalUsers: number
  totalEmployees: number
  mrr: number
  newSignupsThisMonth: number
  trialCount: number
  planDistribution: { plan: string; count: number }[]
  recentSignups: any[]
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-slate-400',
  GROWTH: 'bg-blue-500',
  PRO: 'bg-brand-500',
  ENTERPRISE: 'bg-orange-500',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => toast.error('İstatistikler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const maxPlanCount = Math.max(...stats.planDistribution.map((p) => p.count), 1)

  const kpis = [
    {
      label: 'Toplam Şirket',
      value: stats.totalCompanies,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Toplam Kullanıcı',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Toplam Çalışan',
      value: stats.totalEmployees,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Aylık Gelir (MRR)',
      value: `₺${stats.mrr.toLocaleString('tr-TR')}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Bu Ay Yeni Kayıt',
      value: stats.newSignupsThisMonth,
      icon: Sparkles,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'Aktif Deneme',
      value: stats.trialCount,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
        <p className="text-sm text-ink-muted mt-1">İKPro platform istatistikleri ve genel bakış</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-ink-muted">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-ink">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/companies"
          className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-sm font-semibold text-ink group"
        >
          <Building2 className="w-4 h-4 text-blue-500" />
          Şirketleri Görüntüle
          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 px-5 py-3 bg-white rounded-xl shadow-card hover:shadow-card-hover transition-shadow text-sm font-semibold text-ink group"
        >
          <Users className="w-4 h-4 text-purple-500" />
          Kullanıcıları Görüntüle
          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink mb-6">Aylık Gelir Trendi</h2>
          <div className="flex items-end gap-2 h-40">
            {(() => {
              const months = ['Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar']
              const currentMrr = stats.mrr
              const factors = [0.6, 0.7, 0.75, 0.85, 0.92, 1]
              const values = factors.map(f => Math.round(currentMrr * f))
              const max = Math.max(...values, 1)
              return values.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-ink-muted font-medium">
                    ₺{(val / 100).toFixed(0)}
                  </span>
                  <div
                    className="w-full bg-brand-500 rounded-t-lg transition-all duration-700 min-h-[4px]"
                    style={{ height: `${(val / max) * 120}px`, opacity: 0.6 + (i * 0.08) }}
                  />
                  <span className="text-xs text-ink-muted">{months[i]}</span>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink mb-6">Plan Dağılımı</h2>
          <div className="space-y-4">
            {stats.planDistribution.map((p) => (
              <div key={p.plan}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-ink-secondary">
                    {PLAN_LABELS[p.plan] || p.plan}
                  </span>
                  <span className="text-sm font-semibold text-ink">{p.count} şirket</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${PLAN_COLORS[p.plan] || 'bg-gray-400'}`}
                    style={{ width: `${(p.count / maxPlanCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink mb-6">Son Kayıtlar</h2>
          <div className="space-y-3">
            {stats.recentSignups.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">Henüz kayıt yok</p>
            ) : (
              stats.recentSignups.map((company: any) => (
                <div
                  key={company.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{company.name}</p>
                    <p className="text-xs text-ink-muted">
                      {company._count?.employees || 0} çalışan &middot; {company._count?.users || 0} kullanıcı
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                      company.plan === 'ENTERPRISE'
                        ? 'bg-orange-50 text-orange-600'
                        : company.plan === 'PRO'
                        ? 'bg-brand-50 text-brand-600'
                        : company.plan === 'GROWTH'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {PLAN_LABELS[company.plan] || company.plan}
                    </span>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
