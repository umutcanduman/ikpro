'use client'
import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronRight, Info, Sparkles, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  MODULES, BUNDLES, ModuleSlug,
  calcMonthlyPrice, resolveDependencies
} from '@/lib/modules'

const EMPLOYEE_COUNTS: Record<string, number> = {
  MICRO: 10, SMALL: 30, MEDIUM: 100, LARGE: 300, ENTERPRISE: 750,
}

export default function ModulePickerPage() {
  const router = useRouter()
  const params = useSearchParams()
  const companyId = params.get('companyId')
  const companySize = params.get('size') || 'MEDIUM'
  const industry = params.get('industry') || 'TECHNOLOGY'

  const empCount = EMPLOYEE_COUNTS[companySize] ?? 100
  const [selected, setSelected] = useState<ModuleSlug[]>(['CORE_HR'])
  const [activeBundle, setActiveBundle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hoveredModule, setHoveredModule] = useState<ModuleSlug | null>(null)

  // Smart recommendation based on industry
  const recommended = useMemo<ModuleSlug[]>(() => {
    const base: ModuleSlug[] = ['CORE_HR', 'TIME_LEAVE', 'PAYROLL']
    if (['TECHNOLOGY', 'FINANCE', 'PROFESSIONAL_SERVICES'].includes(industry)) {
      return [...base, 'PERFORMANCE', 'ATS']
    }
    if (['MANUFACTURING', 'LOGISTICS', 'RETAIL'].includes(industry)) {
      return [...base, 'ENGAGEMENT']
    }
    return base
  }, [industry])

  const monthlyTotal = useMemo(
    () => calcMonthlyPrice(selected, empCount),
    [selected, empCount]
  )

  function toggleModule(slug: ModuleSlug) {
    if (slug === 'CORE_HR') return // always required
    setActiveBundle(null)

    if (selected.includes(slug)) {
      // Check if anything depends on this
      const dependents = MODULES.filter(
        m => m.dependsOn.includes(slug) && selected.includes(m.slug)
      )
      if (dependents.length > 0) {
        toast.error(`${dependents.map(d => d.name).join(', ')} bu modüle bağımlı`)
        return
      }
      setSelected(s => s.filter(m => m !== slug))
    } else {
      const withDeps = resolveDependencies([...selected, slug])
      setSelected(withDeps)
    }
  }

  function applyBundle(bundleId: string) {
    const bundle = BUNDLES.find(b => b.id === bundleId)
    if (!bundle) return
    setActiveBundle(bundleId)
    setSelected(bundle.modules)
  }

  async function handleActivate() {
    if (!companyId) {
      toast.error('Şirket ID bulunamadı')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/modules/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, modules: selected }),
      })
      if (!res.ok) throw new Error('Modüller aktifleştirilemedi')
      toast.success('Modüller aktifleştirildi! Hoş geldiniz 🎉')
      router.push(`/onboarding/checklist?companyId=${companyId}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const savings = activeBundle
    ? BUNDLES.find(b => b.id === activeBundle)?.discount ?? 0
    : 0
  const discountedTotal = monthlyTotal * (1 - savings)

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xs">İK</span>
            </div>
            <span className="font-bold text-ink">İKPro</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
            <span>Hesap oluşturuldu</span>
            <span className="text-gray-300">›</span>
            <span className="font-semibold text-ink">Modül seçimi</span>
            <span className="text-gray-300">›</span>
            <span>Başlangıç</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            14 gün ücretsiz deneme — kart gerekmez
          </div>
          <h1 className="text-3xl font-bold text-ink font-display mb-3">
            İhtiyacınız olan modülleri seçin
          </h1>
          <p className="text-ink-secondary max-w-xl mx-auto">
            Yalnızca seçtiğiniz modüller için ödeme yaparsınız. İstediğiniz zaman modül ekleyip çıkarabilirsiniz.
          </p>
        </div>

        {/* Bundle shortcuts */}
        <div className="mb-8 animate-fade-up animate-delay-100">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Hızlı Paketler</p>
          <div className="flex flex-wrap gap-2">
            {BUNDLES.map(bundle => (
              <button
                key={bundle.id}
                onClick={() => applyBundle(bundle.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  activeBundle === bundle.id
                    ? 'bg-brand-500 text-white border-brand-500 shadow-glow-sm'
                    : 'bg-white text-ink border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                {bundle.name}
                {bundle.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeBundle === bundle.id ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-600'
                  }`}>
                    {bundle.badge}
                  </span>
                )}
                <span className={`text-xs ${activeBundle === bundle.id ? 'text-white/70' : 'text-ink-muted'}`}>
                  %{Math.round(bundle.discount * 100)} indirim
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODULES.map((mod, i) => {
                const isSelected = selected.includes(mod.slug)
                const isRecommended = recommended.includes(mod.slug)
                const isCore = mod.isCore

                return (
                  <div
                    key={mod.slug}
                    onClick={() => toggleModule(mod.slug)}
                    onMouseEnter={() => setHoveredModule(mod.slug)}
                    onMouseLeave={() => setHoveredModule(null)}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={`relative rounded-2xl border-2 p-5 transition-all duration-200 animate-fade-up ${
                      isCore
                        ? 'border-brand-200 bg-brand-50 cursor-default'
                        : isSelected
                        ? 'border-brand-500 bg-white shadow-glow cursor-pointer'
                        : 'border-gray-200 bg-white hover:border-brand-300 hover:shadow-card-hover cursor-pointer'
                    }`}
                  >
                    {/* Selected check */}
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-brand-500' : 'border-2 border-gray-200'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {isCore && (
                        <span className="badge bg-brand-100 text-brand-600">Zorunlu</span>
                      )}
                      {mod.badge && !isCore && (
                        <span className="badge bg-orange-100 text-orange-600">{mod.badge}</span>
                      )}
                      {isRecommended && !isCore && (
                        <span className="badge bg-green-100 text-green-600">Önerilen</span>
                      )}
                    </div>

                    {/* Icon & name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: mod.bgColor }}
                      >
                        {mod.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-ink text-sm">{mod.name}</h3>
                        <p className="text-ink-muted text-xs mt-0.5 leading-relaxed">{mod.description}</p>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-1">
                      {mod.highlights.map(h => (
                        <div key={h} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <span className="text-xs text-ink-secondary">{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      {isCore ? (
                        <span className="text-sm font-bold text-brand-500">Dahil — Ücretsiz</span>
                      ) : mod.billingUnit === 'PER_EMPLOYEE' ? (
                        <span className="text-sm font-bold text-ink">
                          ₺{mod.pricePerEmployee}
                          <span className="text-ink-muted font-normal text-xs"> /çalışan/ay</span>
                        </span>
                      ) : mod.billingUnit === 'FLAT_MONTHLY' ? (
                        <span className="text-sm font-bold text-ink">
                          ₺{mod.priceFlat}
                          <span className="text-ink-muted font-normal text-xs"> /ay sabit</span>
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-ink">
                          ₺{mod.priceFlat}
                          <span className="text-ink-muted font-normal text-xs"> /ilan/ay</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sticky summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="card p-6 space-y-5">
              <div>
                <h2 className="font-bold text-ink text-base">Sepetiniz</h2>
                <p className="text-ink-muted text-xs mt-0.5">{empCount} çalışan bazında hesaplanmıştır</p>
              </div>

              {/* Selected modules */}
              <div className="space-y-2">
                {selected.map(slug => {
                  const mod = MODULES.find(m => m.slug === slug)!
                  const linePrice = mod.isCore
                    ? 0
                    : mod.billingUnit === 'PER_EMPLOYEE'
                    ? (mod.pricePerEmployee ?? 0) * empCount
                    : mod.priceFlat ?? 0
                  return (
                    <div key={slug} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mod.icon}</span>
                        <span className="text-sm text-ink">{mod.name}</span>
                      </div>
                      <span className="text-sm font-medium text-ink">
                        {mod.isCore ? <span className="text-green-600 text-xs font-semibold">Ücretsiz</span> : `₺${linePrice.toLocaleString('tr-TR')}`}
                      </span>
                    </div>
                  )
                })}
              </div>

              {selected.length === 1 && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
                  💡 En az bir modül daha ekleyin — tüm temel modüller ücretsiz denemeye dahildir.
                </div>
              )}

              {/* Discount */}
              {savings > 0 && (
                <div className="rounded-xl bg-green-50 border border-green-100 p-3 flex items-center justify-between">
                  <span className="text-xs text-green-700 font-medium">
                    Paket indirimi (%{Math.round(savings * 100)})
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    -₺{(monthlyTotal * savings).toLocaleString('tr-TR')}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-ink-muted">Aylık toplam</p>
                    {savings > 0 && (
                      <p className="text-xs text-ink-muted line-through">₺{monthlyTotal.toLocaleString('tr-TR')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-ink">
                      ₺{Math.round(discountedTotal).toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-ink-muted">/ay · 14 gün ücretsiz</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleActivate}
                disabled={loading || selected.length === 0}
                className="btn-primary w-full text-base py-3"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Aktifleştiriliyor...
                  </span>
                ) : (
                  <>Ücretsiz Denemeyi Başlat <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              <p className="text-center text-xs text-ink-muted">
                14 gün sonra ödeme. İstediğiniz zaman iptal.
              </p>
            </div>

            {/* Annual savings teaser */}
            <div className="mt-3 card p-4 bg-gradient-to-br from-brand-50 to-white border-brand-100">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-brand-700">Yıllık ödemeyle 2 ay bedava</p>
                  <p className="text-xs text-brand-500 mt-0.5">
                    Yıllık ödeme seçeneğiyle ₺{Math.round(discountedTotal * 2).toLocaleString('tr-TR')} tasarruf edin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
