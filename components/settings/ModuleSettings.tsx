'use client'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import toast from 'react-hot-toast'
import { MODULES } from '@/lib/modules'
import type { ModuleSlug } from '@/lib/modules'

type CompanyModule = {
  moduleSlug: string
  status: string
  activatedAt: string | null
  trialEndsAt: string | null
}

type CompanyData = {
  id: string
  modules: CompanyModule[]
}

const BILLING_LABELS: Record<string, string> = {
  FREE: 'Ücretsiz',
  PER_EMPLOYEE: '/ çalışan / ay',
  PER_JOB_POST: '/ ilan',
  FLAT_MONTHLY: '/ ay',
}

export function ModuleSettings({ company }: { company: CompanyData | null }) {
  const [activeModules, setActiveModules] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    if (company?.modules) {
      const actives = new Set(
        company.modules
          .filter(m => m.status === 'ACTIVE' || m.status === 'TRIAL')
          .map(m => m.moduleSlug)
      )
      // CORE_HR always active
      actives.add('CORE_HR')
      setActiveModules(actives)
    }
  }, [company])

  const handleToggle = async (slug: ModuleSlug) => {
    if (slug === 'CORE_HR') return
    setToggling(slug)

    const isActive = activeModules.has(slug)

    try {
      if (isActive) {
        // Deactivate
        const res = await fetch('/api/modules/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company?.id,
            modules: [slug],
            action: 'deactivate',
          }),
        })
        if (!res.ok) throw new Error('Modül devre dışı bırakılamadı')
        setActiveModules(prev => {
          const next = new Set(prev)
          next.delete(slug)
          return next
        })
        toast.success('Modül devre dışı bırakıldı')
      } else {
        // Activate
        const res = await fetch('/api/modules/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: company?.id,
            modules: [slug],
          }),
        })
        if (!res.ok) throw new Error('Modül aktifleştirilemedi')
        setActiveModules(prev => new Set(prev).add(slug))
        toast.success('Modül aktifleştirildi')
      }
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
    } finally {
      setToggling(null)
    }
  }

  const getModuleStatus = (slug: string): CompanyModule | undefined => {
    return company?.modules?.find(m => m.moduleSlug === slug)
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-bold text-ink text-lg">Aktif Modüller</h3>
          <span className="badge bg-brand-100 text-brand-700">
            {activeModules.size} / {MODULES.length}
          </span>
        </div>
        <p className="text-sm text-ink-muted mb-6">
          Modülleri açıp kapatarak ihtiyacınıza göre platformu özelleştirin. Her modül 14 gün ücretsiz deneme ile başlar.
        </p>

        <div className="space-y-3">
          {MODULES.map(mod => {
            const isActive = activeModules.has(mod.slug)
            const isCore = mod.isCore
            const isToggling = toggling === mod.slug
            const status = getModuleStatus(mod.slug)
            const isTrial = status?.status === 'TRIAL'
            const trialEnd = status?.trialEndsAt
              ? new Date(status.trialEndsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
              : null

            return (
              <div
                key={mod.slug}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-brand-200 bg-brand-50/30'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: mod.bgColor }}
                >
                  {mod.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-ink text-sm">{mod.name}</p>
                    {isCore && (
                      <span className="badge bg-green-100 text-green-700">Dahil</span>
                    )}
                    {isTrial && (
                      <span className="badge bg-amber-100 text-amber-700">
                        Deneme{trialEnd ? ` - ${trialEnd}` : ''}
                      </span>
                    )}
                    {mod.badge && !isCore && (
                      <span className="badge bg-brand-100 text-brand-700">{mod.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5 truncate">{mod.description}</p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  {mod.isFree ? (
                    <span className="text-sm font-semibold text-green-600">Ücretsiz</span>
                  ) : (
                    <div>
                      <span className="text-sm font-bold text-ink">
                        ₺{mod.pricePerEmployee || mod.priceFlat}
                      </span>
                      <span className="text-xs text-ink-muted ml-1">
                        {BILLING_LABELS[mod.billingUnit]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Toggle */}
                <div className="flex-shrink-0">
                  {isToggling ? (
                    <div className="w-[42px] h-[25px] flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    </div>
                  ) : (
                    <Switch.Root
                      checked={isActive}
                      onCheckedChange={() => handleToggle(mod.slug)}
                      disabled={isCore}
                      className={`w-[42px] h-[25px] rounded-full relative outline-none cursor-pointer transition-colors ${
                        isActive ? 'bg-brand-500' : 'bg-gray-200'
                      } ${isCore ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <Switch.Thumb
                        className={`block w-[21px] h-[21px] bg-white rounded-full transition-transform shadow-sm ${
                          isActive ? 'translate-x-[19px]' : 'translate-x-[2px]'
                        }`}
                      />
                    </Switch.Root>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
