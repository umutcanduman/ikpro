'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, ChevronRight, Users, Upload, Bell, ArrowRight, Gift } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  {
    id: 'modules',
    icon: '✅',
    title: 'Modüller seçildi',
    desc: 'Platform yapılandırıldı',
    done: true,
    cta: null,
  },
  {
    id: 'invite',
    icon: '👥',
    title: 'Ekibinizi davet edin',
    desc: 'İK ekibinizi ve yöneticileri ekleyin',
    done: false,
    cta: 'Davet Gönder',
    ctaHref: '/dashboard/team/invite',
    reward: '1 hafta ek deneme',
  },
  {
    id: 'import',
    icon: '📋',
    title: 'Çalışan listesini yükleyin',
    desc: 'Excel veya CSV ile toplu import',
    done: false,
    cta: 'İçe Aktar',
    ctaHref: '/dashboard/employees/import',
    reward: null,
  },
  {
    id: 'profile',
    icon: '🏢',
    title: 'Şirket profilini tamamlayın',
    desc: 'Logo, adres, VKN ve banka bilgileri',
    done: false,
    cta: 'Tamamla',
    ctaHref: '/dashboard/settings/company',
    reward: null,
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: 'Bildirim tercihlerini ayarlayın',
    desc: 'E-posta ve Slack entegrasyonu',
    done: false,
    cta: 'Ayarla',
    ctaHref: '/dashboard/settings/notifications',
    reward: null,
  },
]

export default function OnboardingChecklistPage() {
  const router = useRouter()
  const params = useSearchParams()
  const companyId = params.get('companyId')

  const [completed, setCompleted] = useState<string[]>(['modules'])
  const progress = Math.round((completed.length / STEPS.length) * 100)
  const allDone = completed.length === STEPS.length

  function markDone(id: string) {
    if (!completed.includes(id)) setCompleted(c => [...c, id])
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xs">İK</span>
          </div>
          <span className="font-bold text-ink">İKPro</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Confetti header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-ink font-display mb-2">
            Denemeniz başladı!
          </h1>
          <p className="text-ink-secondary">
            14 gün boyunca tüm özellikleri ücretsiz kullanın. Aşağıdaki adımları tamamlayarak <strong>1 ay ek ücretsiz</strong> kazanın.
          </p>
        </div>

        {/* Progress bar */}
        <div className="card p-5 mb-6 animate-fade-up animate-delay-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-ink">Kurulum tamamlanma</span>
            <span className="text-sm font-bold text-brand-500">{progress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <p className="text-xs text-green-600 font-semibold mt-2 text-center animate-fade-in">
              🏆 Tebrikler! 1 ay ücretsiz ek süre hesabınıza eklendi.
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3 animate-fade-up animate-delay-200">
          {STEPS.map((step, i) => {
            const isDone = completed.includes(step.id)
            return (
              <div
                key={step.id}
                className={`card p-5 transition-all duration-200 ${isDone ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    isDone ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    {isDone ? '✅' : step.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${isDone ? 'line-through text-ink-muted' : 'text-ink'}`}>
                        {step.title}
                      </p>
                      {step.reward && !isDone && (
                        <span className="badge bg-amber-100 text-amber-600">
                          🎁 {step.reward}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">{step.desc}</p>
                  </div>

                  {step.cta && !isDone && (
                    <Link
                      href={`${step.ctaHref}?companyId=${companyId}`}
                      onClick={() => markDone(step.id)}
                      className="btn-secondary text-xs flex-shrink-0"
                    >
                      {step.cta} <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Go to dashboard */}
        <div className="mt-8 text-center animate-fade-up animate-delay-300">
          <Link href="/dashboard" className="btn-primary px-8 py-3 text-base">
            Panele Git <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-ink-muted mt-3">
            Bu adımları daha sonra da tamamlayabilirsiniz
          </p>
        </div>
      </div>
    </div>
  )
}
