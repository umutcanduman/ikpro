'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight, Building2, Users, Zap } from 'lucide-react'

const INDUSTRIES = [
  { value: 'TECHNOLOGY', label: 'Teknoloji' },
  { value: 'RETAIL', label: 'Perakende' },
  { value: 'MANUFACTURING', label: 'Üretim' },
  { value: 'LOGISTICS', label: 'Lojistik' },
  { value: 'FINANCE', label: 'Finans' },
  { value: 'HEALTHCARE', label: 'Sağlık' },
  { value: 'EDUCATION', label: 'Eğitim' },
  { value: 'HOSPITALITY', label: 'Konaklama' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Profesyonel Hizmetler' },
  { value: 'OTHER', label: 'Diğer' },
]

const SIZES = [
  { value: 'MICRO', label: '1–15 çalışan', sublabel: 'Ücretsiz başla' },
  { value: 'SMALL', label: '16–50 çalışan', sublabel: '' },
  { value: 'MEDIUM', label: '51–200 çalışan', sublabel: 'En popüler' },
  { value: 'LARGE', label: '201–500 çalışan', sublabel: '' },
  { value: 'ENTERPRISE', label: '500+ çalışan', sublabel: 'Kurumsal' },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    industry: '',
    size: '',
  })

  const update = (key: string, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit() {
    if (!form.name || !form.email || !form.password || !form.companyName || !form.industry || !form.size) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Kayıt başarısız')
      toast.success('Hesabınız oluşturuldu!')
      router.push(`/onboarding/modules?companyId=${data.companyId}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-brand-500 flex-col justify-between p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-400 rounded-full opacity-30" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-brand-600 rounded-full opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-300 rounded-full opacity-10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
              <span className="text-brand-500 font-black text-sm">İK</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">İKPro</span>
          </div>

          <div className="space-y-8">
            {[
              { icon: Zap, title: '10 dakikada canlıya geçin', desc: 'Kurulum yok. Banka kartı gerekmez. Hemen başlayın.' },
              { icon: Building2, title: 'Modüler yapı', desc: 'Yalnızca ihtiyacınız olan modülleri seçin, yalnızca onlar için ödeme yapın.' },
              { icon: Users, title: '2.000+ şirketin güveni', desc: 'Türkiye\'nin lider İK platformu olma yolunda.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
            <p className="text-white text-sm leading-relaxed italic">
              "Kolay İK'dan geçişimiz 2 günde tamamlandı. Artık bordro, izin ve performansı aynı yerden yönetiyoruz."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xs">AY</div>
              <div>
                <p className="text-white text-xs font-semibold">Ayşe Yılmaz</p>
                <p className="text-white/50 text-xs">İK Müdürü, TechCo Istanbul</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xs">İK</span>
            </div>
            <span className="text-ink font-bold text-lg">İKPro</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s <= step ? 'bg-brand-500 text-white' : 'bg-gray-100 text-ink-muted'
                }`}>{s}</div>
                {s < 2 && <div className={`h-0.5 w-12 rounded transition-all ${s < step ? 'bg-brand-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
            <span className="ml-2 text-sm text-ink-muted">
              {step === 1 ? 'Hesap bilgileri' : 'Şirket bilgileri'}
            </span>
          </div>

          {step === 1 && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <h1 className="text-2xl font-bold text-ink font-display">Hesabınızı oluşturun</h1>
                <p className="text-ink-secondary text-sm mt-1">14 gün ücretsiz, kart gerekmez</p>
              </div>

              <div>
                <label className="label">Adınız Soyadınız</label>
                <input
                  className="input"
                  placeholder="Ayşe Yılmaz"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">İş E-postası</label>
                <input
                  type="email"
                  className="input"
                  placeholder="ayse@sirket.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Şifre</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-12"
                    placeholder="En az 8 karakter"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!form.name || !form.email || !form.password) {
                    toast.error('Lütfen tüm alanları doldurun')
                    return
                  }
                  if (form.password.length < 8) {
                    toast.error('Şifre en az 8 karakter olmalı')
                    return
                  }
                  setStep(2)
                }}
                className="btn-primary w-full"
              >
                Devam Et <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-sm text-ink-muted">
                Zaten hesabınız var mı?{' '}
                <Link href="/login" className="text-brand-500 font-semibold hover:underline">
                  Giriş yapın
                </Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-up">
              <div>
                <h1 className="text-2xl font-bold text-ink font-display">Şirketiniz hakkında</h1>
                <p className="text-ink-secondary text-sm mt-1">Modül önerilerimiz buna göre şekillenecek</p>
              </div>

              <div>
                <label className="label">Şirket Adı</label>
                <input
                  className="input"
                  placeholder="TechCo Istanbul A.Ş."
                  value={form.companyName}
                  onChange={e => update('companyName', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Sektör</label>
                <select
                  className="input"
                  value={form.industry}
                  onChange={e => update('industry', e.target.value)}
                >
                  <option value="">Seçiniz...</option>
                  {INDUSTRIES.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Çalışan Sayısı</label>
                <div className="grid grid-cols-1 gap-2">
                  {SIZES.map(s => (
                    <button
                      key={s.value}
                      onClick={() => update('size', s.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        form.size === s.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className={`text-sm font-medium ${form.size === s.value ? 'text-brand-600' : 'text-ink'}`}>
                        {s.label}
                      </span>
                      {s.sublabel && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          form.size === s.value ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-ink-muted'
                        }`}>
                          {s.sublabel}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-shrink-0">
                  Geri
                </button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Oluşturuluyor...
                    </span>
                  ) : (
                    <>Modülleri Seç <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-ink-muted">
                Devam ederek{' '}
                <Link href="/terms" className="underline">Kullanım Koşullarını</Link>
                {' '}ve{' '}
                <Link href="/privacy" className="underline">Gizlilik Politikasını</Link>
                {' '}kabul etmiş olursunuz
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
