'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Building2, Search, Filter, ChevronLeft, ChevronRight,
  Eye, UserCog, Ban, CheckCircle, ExternalLink, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Company {
  id: string
  name: string
  slug: string
  plan: string
  industry: string
  size: string
  city: string | null
  createdAt: string
  trialEndsAt: string | null
  _count: { users: number; employees: number }
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

const PLAN_PRICES: Record<string, number> = {
  STARTER: 0,
  GROWTH: 2990,
  PRO: 5990,
  ENTERPRISE: 14990,
}

const SIZE_LABELS: Record<string, string> = {
  MICRO: 'Mikro (1-15)',
  SMALL: 'Küçük (16-50)',
  MEDIUM: 'Orta (51-200)',
  LARGE: 'Büyük (201-500)',
  ENTERPRISE: 'Kurumsal (500+)',
}

const INDUSTRY_LABELS: Record<string, string> = {
  TECHNOLOGY: 'Teknoloji',
  RETAIL: 'Perakende',
  MANUFACTURING: 'Üretim',
  LOGISTICS: 'Lojistik',
  FINANCE: 'Finans',
  HEALTHCARE: 'Sağlık',
  EDUCATION: 'Eğitim',
  HOSPITALITY: 'Turizm',
  PROFESSIONAL_SERVICES: 'Profesyonel Hizmetler',
  OTHER: 'Diğer',
}

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [sizeFilter, setSizeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)
  const [extendingTrial, setExtendingTrial] = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      ...(search ? { search } : {}),
      ...(planFilter ? { plan: planFilter } : {}),
      ...(industryFilter ? { industry: industryFilter } : {}),
      ...(sizeFilter ? { size: sizeFilter } : {}),
    })

    try {
      const res = await fetch(`/api/admin/companies?${params}`)
      const data = await res.json()
      setCompanies(data.companies || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('Şirketler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [page, search, planFilter, industryFilter, sizeFilter])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleImpersonate = async (companyId: string, companyName: string) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${companyName} olarak giriş yapılıyor...`)
        // In production, this would set the impersonation context and redirect
        window.open(`/dashboard`, '_blank')
      } else {
        toast.error(data.error || 'Hata oluştu')
      }
    } catch {
      toast.error('Bağlantı hatası')
    }
  }

  const handleChangePlan = async (companyId: string, newPlan: string) => {
    setChangingPlan(companyId)
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: companyId, plan: newPlan }),
      })
      if (res.ok) {
        toast.success(`Plan ${PLAN_LABELS[newPlan]} olarak güncellendi`)
        fetchCompanies()
      } else {
        toast.error('Plan değiştirilemedi')
      }
    } catch {
      toast.error('Bağlantı hatası')
    } finally {
      setChangingPlan(null)
    }
  }

  const handleExtendTrial = async (companyId: string) => {
    setExtendingTrial(companyId)
    const newTrialEnd = new Date()
    newTrialEnd.setDate(newTrialEnd.getDate() + 14)
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: companyId, trialEndsAt: newTrialEnd.toISOString() }),
      })
      if (res.ok) {
        toast.success('Deneme süresi 14 gün uzatıldı')
        fetchCompanies()
      } else {
        toast.error('İşlem başarısız')
      }
    } catch {
      toast.error('Bağlantı hatası')
    } finally {
      setExtendingTrial(null)
    }
  }

  const handleSuspend = async (company: Company) => {
    // For now, we toggle the plan to STARTER as a "suspend" action
    // In production, add a `status` field to Company
    if (!confirm(`"${company.name}" şirketini askıya almak istediğinize emin misiniz?`)) return

    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, plan: 'STARTER' }),
      })
      if (res.ok) {
        toast.success('Şirket askıya alındı')
        fetchCompanies()
      } else {
        toast.error('İşlem başarısız')
      }
    } catch {
      toast.error('Bağlantı hatası')
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Şirketler</h1>
          <p className="text-sm text-ink-muted mt-1">Toplam {total} şirket kayıtlı</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Şirket adı veya şehir ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-slate-100' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filtreler
          {(planFilter || industryFilter || sizeFilter) && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
              {[planFilter, industryFilter, sizeFilter].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl shadow-card">
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
            className="input text-sm min-w-[140px]"
          >
            <option value="">Tüm Planlar</option>
            {Object.entries(PLAN_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={industryFilter}
            onChange={(e) => { setIndustryFilter(e.target.value); setPage(1) }}
            className="input text-sm min-w-[160px]"
          >
            <option value="">Tüm Sektörler</option>
            {Object.entries(INDUSTRY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={sizeFilter}
            onChange={(e) => { setSizeFilter(e.target.value); setPage(1) }}
            className="input text-sm min-w-[160px]"
          >
            <option value="">Tüm Boyutlar</option>
            {Object.entries(SIZE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {(planFilter || industryFilter || sizeFilter) && (
            <button
              onClick={() => { setPlanFilter(''); setIndustryFilter(''); setSizeFilter(''); setPage(1) }}
              className="btn-ghost text-sm flex items-center gap-1 text-ink-muted"
            >
              <X className="w-3.5 h-3.5" />
              Temizle
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Şirket</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Plan</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">Çalışan</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">MRR</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">Kayıt Tarihi</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-5 bg-gray-100 rounded animate-pulse w-2/3" />
                    </td>
                  </tr>
                ))
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ink-muted text-sm">
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <>
                    <tr
                      key={company.id}
                      className="hover:bg-surface-muted/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink">{company.name}</p>
                            <p className="text-xs text-ink-muted">{company.city || '-'} &middot; {INDUSTRY_LABELS[company.industry] || company.industry}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
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
                        {company.trialEndsAt && new Date(company.trialEndsAt) > new Date() && (
                          <span className="ml-1.5 inline-block px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded">
                            DENEME
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-ink">{company._count.employees}</span>
                        <span className="text-xs text-ink-muted ml-1">({company._count.users} kullanıcı)</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm font-medium text-ink">
                          ₺{(PLAN_PRICES[company.plan] || 0).toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-ink-muted">
                          {new Date(company.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleImpersonate(company.id, company.name)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-ink-muted hover:text-blue-600 transition-colors"
                            title="Giriş yap"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSuspend(company)}
                            className="p-2 rounded-lg hover:bg-red-50 text-ink-muted hover:text-red-600 transition-colors"
                            title="Askıya al"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {expandedId === company.id && (
                      <tr key={`${company.id}-detail`} className="bg-surface-muted/30">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-ink-muted text-xs mb-0.5">Slug</p>
                              <p className="font-medium text-ink">{company.slug}</p>
                            </div>
                            <div>
                              <p className="text-ink-muted text-xs mb-0.5">Boyut</p>
                              <p className="font-medium text-ink">{SIZE_LABELS[company.size] || company.size}</p>
                            </div>
                            <div>
                              <p className="text-ink-muted text-xs mb-0.5">Sektör</p>
                              <p className="font-medium text-ink">{INDUSTRY_LABELS[company.industry] || company.industry}</p>
                            </div>
                            <div>
                              <p className="text-ink-muted text-xs mb-0.5">Deneme Bitiş</p>
                              <p className="font-medium text-ink">
                                {company.trialEndsAt
                                  ? new Date(company.trialEndsAt).toLocaleDateString('tr-TR')
                                  : '-'}
                              </p>
                            </div>
                          </div>
                          {/* Admin Actions */}
                          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-ink-muted font-medium">Plan:</span>
                              <select
                                value={company.plan}
                                onChange={(e) => handleChangePlan(company.id, e.target.value)}
                                disabled={changingPlan === company.id}
                                className="input text-xs py-1 px-2 min-w-[120px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {Object.entries(PLAN_LABELS).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleExtendTrial(company.id) }}
                              disabled={extendingTrial === company.id}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              {extendingTrial === company.id ? 'Uzatılıyor...' : '+14 Gün Deneme'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-ink-muted">
              Sayfa {page} / {totalPages} &middot; Toplam {total} kayıt
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
