'use client'
import { useState, useEffect } from 'react'
import { Building2, Globe, FileText, MapPin, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const INDUSTRY_OPTIONS = [
  { value: 'TECHNOLOGY', label: 'Teknoloji' },
  { value: 'RETAIL', label: 'Perakende' },
  { value: 'MANUFACTURING', label: 'Üretim' },
  { value: 'LOGISTICS', label: 'Lojistik' },
  { value: 'FINANCE', label: 'Finans' },
  { value: 'HEALTHCARE', label: 'Sağlık' },
  { value: 'EDUCATION', label: 'Eğitim' },
  { value: 'HOSPITALITY', label: 'Turizm & Otelcilik' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Profesyonel Hizmetler' },
  { value: 'OTHER', label: 'Diğer' },
]

type CompanyData = {
  id: string
  name: string
  logoUrl: string | null
  website: string | null
  taxId: string | null
  city: string | null
  industry: string
  language: string
}

export function CompanySettings({ company }: { company: CompanyData | null }) {
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    website: '',
    taxId: '',
    city: '',
    industry: 'TECHNOLOGY',
    language: 'TR',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        logoUrl: company.logoUrl || '',
        website: company.website || '',
        taxId: company.taxId || '',
        city: company.city || '',
        industry: company.industry || 'TECHNOLOGY',
        language: company.language || 'TR',
      })
    }
  }, [company])

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kaydetme başarısız')
      }
      toast.success('Şirket bilgileri güncellendi')
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Company Info Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Şirket Bilgileri</h3>
            <p className="text-sm text-ink-muted">Temel şirket profilinizi düzenleyin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Şirket Adı</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              className="input"
              placeholder="Şirket adı"
            />
          </div>
          <div>
            <label className="label">Logo URL</label>
            <input
              type="text"
              value={form.logoUrl}
              onChange={e => handleChange('logoUrl', e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="label">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-ink-muted" /> Web Sitesi
              </div>
            </label>
            <input
              type="url"
              value={form.website}
              onChange={e => handleChange('website', e.target.value)}
              className="input"
              placeholder="https://sirket.com"
            />
          </div>
          <div>
            <label className="label">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-ink-muted" /> Vergi Kimlik No (VKN)
              </div>
            </label>
            <input
              type="text"
              value={form.taxId}
              onChange={e => handleChange('taxId', e.target.value)}
              className="input"
              placeholder="1234567890"
            />
          </div>
          <div>
            <label className="label">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-ink-muted" /> Şehir
              </div>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={e => handleChange('city', e.target.value)}
              className="input"
              placeholder="İstanbul"
            />
          </div>
          <div>
            <label className="label">Sektör</label>
            <select
              value={form.industry}
              onChange={e => handleChange('industry', e.target.value)}
              className="input"
            >
              {INDUSTRY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Language Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Dil Ayarları</h3>
            <p className="text-sm text-ink-muted">Platform arayüz dilini seçin</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleChange('language', 'TR')}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all flex-1 ${
              form.language === 'TR'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">🇹🇷</span>
            <div className="text-left">
              <p className={`font-semibold text-sm ${form.language === 'TR' ? 'text-brand-600' : 'text-ink'}`}>Türkçe</p>
              <p className="text-xs text-ink-muted">Varsayılan dil</p>
            </div>
          </button>
          <button
            onClick={() => handleChange('language', 'EN')}
            className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all flex-1 ${
              form.language === 'EN'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-2xl">🇬🇧</span>
            <div className="text-left">
              <p className={`font-semibold text-sm ${form.language === 'EN' ? 'text-brand-600' : 'text-ink'}`}>English</p>
              <p className="text-xs text-ink-muted">English interface</p>
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </div>
  )
}
