'use client'
import { useState, useEffect } from 'react'
import { CreditCard, ExternalLink, Check, Zap, Crown, Rocket, Building2, Loader2, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'

type CompanyData = {
  id: string
  plan: string
  subscriptionId: string | null
  customerId: string | null
  trialEndsAt: string | null
  _count?: { employees: number; users: number }
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  GROWTH: 'Growth',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-gray-100 text-gray-700',
  GROWTH: 'bg-brand-100 text-brand-700',
  PRO: 'bg-purple-100 text-purple-700',
  ENTERPRISE: 'bg-amber-100 text-amber-700',
}

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 0,
    priceLabel: 'Ücretsiz',
    description: 'Küçük ekipler için temel İK',
    icon: Zap,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    features: [
      'En fazla 15 çalışan',
      'Temel İK modülü',
      'E-posta desteği',
      'Tek yönetici',
    ],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: 29,
    priceLabel: '₺29 / çalışan / ay',
    description: 'Büyüyen şirketler için',
    icon: Rocket,
    color: 'text-brand-500',
    bgColor: 'bg-brand-50',
    popular: true,
    features: [
      'En fazla 100 çalışan',
      '5 modüle kadar',
      'Öncelikli destek',
      '3 yönetici',
      'API erişimi',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 49,
    priceLabel: '₺49 / çalışan / ay',
    description: 'Kapsamlı İK yönetimi',
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    features: [
      'Sınırsız çalışan',
      'Tüm modüller dahil',
      '7/24 destek',
      'Sınırsız yönetici',
      'API & Webhook',
      'Özel raporlar',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Teklif alın',
    description: 'Büyük kuruluşlar için',
    icon: Building2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    features: [
      'Sınırsız her şey',
      'Özel entegrasyonlar',
      'Ayrılmış destek müdürü',
      'SLA garantisi',
      'On-premise seçeneği',
      'SSO / SAML',
      'Özel eğitim',
    ],
  },
]

type Invoice = {
  id: string
  date: string
  amount: string
  status: string
  pdfUrl: string | null
}

export function BillingSettings({ company }: { company: CompanyData | null }) {
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)

  useEffect(() => {
    if (company?.customerId) {
      setInvoicesLoading(true)
      fetch('/api/stripe/invoices')
        .then(r => r.json())
        .then(data => setInvoices(data.invoices || []))
        .catch(() => {})
        .finally(() => setInvoicesLoading(false))
    }
  }, [company?.customerId])

  const currentPlan = company?.plan || 'STARTER'
  const planOrder = ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE']
  const currentPlanIndex = planOrder.indexOf(currentPlan)

  const trialActive = company?.trialEndsAt && new Date(company.trialEndsAt) > new Date()
  const trialEndDate = company?.trialEndsAt
    ? new Date(company.trialEndsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, companyId: company?.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Ödeme sayfası oluşturulamadı')
      }
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
      setUpgrading(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company?.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Portal açılamadı')
      }
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Banner */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-ink text-lg">Mevcut Plan</h3>
                <span className={`badge ${PLAN_COLORS[currentPlan]}`}>
                  {PLAN_LABELS[currentPlan]}
                </span>
                {trialActive && (
                  <span className="badge bg-amber-100 text-amber-700">
                    Deneme Sürümü
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-muted mt-0.5">
                {trialActive
                  ? `Deneme süreniz ${trialEndDate} tarihinde sona erecek`
                  : company?.subscriptionId
                    ? 'Aboneliğiniz aktif'
                    : 'Ücretsiz plan kullanıyorsunuz'
                }
              </p>
            </div>
          </div>

          {company?.customerId && (
            <button onClick={handlePortal} disabled={portalLoading} className="btn-secondary">
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Fatura Portalı
            </button>
          )}
        </div>

        {company?._count && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="p-3 rounded-xl bg-surface-muted">
              <p className="text-xs text-ink-muted">Aktif Çalışan</p>
              <p className="text-xl font-black text-ink">{company._count.employees}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface-muted">
              <p className="text-xs text-ink-muted">Platform Kullanıcısı</p>
              <p className="text-xl font-black text-ink">{company._count.users}</p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div>
        <h3 className="font-bold text-ink text-lg mb-4">Planları Karşılaştır</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan
            const isDowngrade = planOrder.indexOf(plan.id) < currentPlanIndex
            const isUpgrade = planOrder.indexOf(plan.id) > currentPlanIndex
            const Icon = plan.icon

            return (
              <div
                key={plan.id}
                className={`card p-5 relative transition-all ${
                  isCurrent
                    ? 'ring-2 ring-brand-500 shadow-glow-sm'
                    : 'hover:shadow-card-hover'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="badge bg-brand-500 text-white shadow-glow-sm">
                      En Popüler
                    </span>
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl ${plan.bgColor} ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>

                <h4 className="font-bold text-ink text-base">{plan.name}</h4>
                <p className="text-xs text-ink-muted mt-0.5 mb-3">{plan.description}</p>

                <div className="mb-4">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-ink">₺{plan.price}</span>
                      <span className="text-xs text-ink-muted">/ çalışan / ay</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-black text-ink">Özel Fiyat</span>
                  )}
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-ink-secondary">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isCurrent ? 'text-brand-500' : 'text-green-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-brand-50 text-brand-600 text-sm font-semibold text-center">
                      Mevcut Plan
                    </div>
                  ) : isUpgrade ? (
                    <button
                      onClick={() => plan.id === 'ENTERPRISE' ? toast('Satış ekibimiz sizinle iletişime geçecek') : handleUpgrade(plan.id)}
                      disabled={upgrading === plan.id}
                      className="btn-primary w-full"
                    >
                      {upgrading === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      {plan.id === 'ENTERPRISE' ? 'İletişime Geç' : 'Yükselt'}
                    </button>
                  ) : (
                    <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                      Düşürme
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invoice History */}
      {company?.customerId && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-ink">Fatura Geçmişi</h3>
              <p className="text-sm text-ink-muted">Son ödemeleriniz ve faturalarınız</p>
            </div>
          </div>

          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-ink-muted py-6 text-center">Henüz fatura bulunmuyor</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{inv.date}</p>
                    <p className="text-xs text-ink-muted">Fatura #{inv.id.slice(-8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{inv.amount}</p>
                    <span className={`text-xs font-medium ${
                      inv.status === 'paid' ? 'text-green-600' : inv.status === 'open' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {inv.status === 'paid' ? 'Ödendi' : inv.status === 'open' ? 'Bekliyor' : 'Başarısız'}
                    </span>
                  </div>
                  {inv.pdfUrl && (
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-surface-muted text-ink-muted hover:text-ink transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
