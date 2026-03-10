import Link from 'next/link'
import { ArrowRight, Check, Zap, Shield, BarChart2 } from 'lucide-react'

const FEATURES = [
  { icon: '👥', title: 'Temel İK', desc: 'Çalışan profilleri, org şeması, belgeler' },
  { icon: '💰', title: 'Bordro', desc: 'SGK & vergi uyumlu Türkiye bordrosu' },
  { icon: '🎯', title: 'İşe Alım', desc: 'AI destekli ATS, Kariyer.net & LinkedIn' },
  { icon: '🚀', title: 'Performans', desc: 'OKR kaskadı, 360° değerlendirme' },
  { icon: '🎓', title: 'Eğitim', desc: 'LMS, kurs oluşturucu, sertifika takibi' },
  { icon: '🛡️', title: 'KVKK', desc: 'VERBİS, rıza yönetimi, uyum araçları' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 h-16 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xs">İK</span>
          </div>
          <span className="font-bold text-ink text-lg">İKPro</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">Giriş Yap</Link>
          <Link href="/signup" className="btn-primary">Ücretsiz Başla <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          Türkiye'nin en modüler İK platformu
        </div>
        <h1 className="text-5xl lg:text-6xl font-black text-ink font-display leading-tight mb-6">
          İK yönetimini <br />
          <span className="text-brand-500">tek çatı altında</span> toplayın
        </h1>
        <p className="text-xl text-ink-secondary max-w-2xl mx-auto mb-10">
          İşe alımdan bordroye, performanstan KVKK uyumuna — yalnızca ihtiyacınız olan modülleri seçin ve hemen başlayın.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary text-base px-8 py-3.5">
            14 Gün Ücretsiz Başla <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-sm text-ink-muted">Kart gerekmez · Kurulum yok</span>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="card p-6 hover:shadow-card-hover transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-ink mb-1">{f.title}</h3>
              <p className="text-sm text-ink-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
