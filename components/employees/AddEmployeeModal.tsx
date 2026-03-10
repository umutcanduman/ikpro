'use client'
import { useState } from 'react'
import { X, User, Briefcase, DollarSign, Shield, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

type Props = {
  companyId: string
  employees: { id: string; firstName: string; lastName: string; jobTitle?: string }[]
  onClose: () => void
  onSaved: () => void
}

const TABS = [
  { id: 'personal', label: 'Kişisel', icon: User },
  { id: 'job', label: 'İş Bilgileri', icon: Briefcase },
  { id: 'payroll', label: 'Maaş', icon: DollarSign },
  { id: 'emergency', label: 'Acil Durum', icon: Shield },
]

const DEPARTMENTS = ['Mühendislik', 'Ürün', 'Tasarım', 'Pazarlama', 'Satış', 'İnsan Kaynakları', 'Finans', 'Operasyon', 'Müşteri Başarı', 'Hukuk', 'Diğer']

export function AddEmployeeModal({ companyId, employees, onClose, onSaved }: Props) {
  const [tab, setTab] = useState('personal')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    gender: '', nationalId: '', birthDate: '',
    jobTitle: '', department: '', location: '', employmentType: 'FULL_TIME',
    startDate: '', managerId: '',
    salary: '', salaryCurrency: 'TRY', salaryPeriod: 'MONTHLY',
    bankName: '', bankIban: '', sgkNumber: '',
    emergencyName: '', emergencyPhone: '', emergencyRel: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error('Ad, soyad ve e-posta zorunlu')
      setTab('personal')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          ...form,
          salary: form.salary ? parseFloat(form.salary) : undefined,
          managerId: form.managerId || undefined,
          gender: form.gender || undefined,
          birthDate: form.birthDate || undefined,
          startDate: form.startDate || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${form.firstName} ${form.lastName} eklendi`)
      onSaved()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-ink text-lg font-display">Yeni Çalışan</h2>
            <p className="text-xs text-ink-muted mt-0.5">Çalışan profilini oluşturun</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-surface-muted flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-7">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-1 py-4 mr-6 border-b-2 text-sm font-semibold transition-all ${
                tab === id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {tab === 'personal' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ad *</label>
                <input className="input" placeholder="Ayşe" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className="label">Soyad *</label>
                <input className="input" placeholder="Yılmaz" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">E-posta *</label>
                <input type="email" className="input" placeholder="ayse@sirket.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input className="input" placeholder="+90 555 000 00 00" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="label">Cinsiyet</label>
                <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Seçiniz</option>
                  <option value="MALE">Erkek</option>
                  <option value="FEMALE">Kadın</option>
                  <option value="OTHER">Diğer</option>
                  <option value="PREFER_NOT_TO_SAY">Belirtmek İstemiyorum</option>
                </select>
              </div>
              <div>
                <label className="label">Doğum Tarihi</label>
                <input type="date" className="input" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
              </div>
              <div>
                <label className="label">TC Kimlik No</label>
                <input className="input" placeholder="12345678901" maxLength={11} value={form.nationalId} onChange={e => set('nationalId', e.target.value)} />
              </div>
            </div>
          )}

          {tab === 'job' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Görev / Pozisyon</label>
                <input className="input" placeholder="Senior Frontend Developer" value={form.jobTitle} onChange={e => set('jobTitle', e.target.value)} />
              </div>
              <div>
                <label className="label">Departman</label>
                <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
                  <option value="">Seçiniz</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Çalışma Tipi</label>
                <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                  <option value="FULL_TIME">Tam Zamanlı</option>
                  <option value="PART_TIME">Yarı Zamanlı</option>
                  <option value="CONTRACT">Sözleşmeli</option>
                  <option value="INTERN">Stajyer</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>
              <div>
                <label className="label">İşe Başlama Tarihi</label>
                <input type="date" className="input" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div>
                <label className="label">Lokasyon / Ofis</label>
                <input className="input" placeholder="İstanbul, Türkiye" value={form.location} onChange={e => set('location', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Yönetici</label>
                <select className="input" value={form.managerId} onChange={e => set('managerId', e.target.value)}>
                  <option value="">Seçiniz (opsiyonel)</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}{e.jobTitle ? ` — ${e.jobTitle}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {tab === 'payroll' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Maaş</label>
                <input type="number" className="input" placeholder="50000" value={form.salary} onChange={e => set('salary', e.target.value)} />
              </div>
              <div>
                <label className="label">Para Birimi</label>
                <select className="input" value={form.salaryCurrency} onChange={e => set('salaryCurrency', e.target.value)}>
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Ödeme Periyodu</label>
                <select className="input" value={form.salaryPeriod} onChange={e => set('salaryPeriod', e.target.value)}>
                  <option value="MONTHLY">Aylık</option>
                  <option value="ANNUAL">Yıllık</option>
                  <option value="HOURLY">Saatlik</option>
                  <option value="DAILY">Günlük</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Banka Adı</label>
                <input className="input" placeholder="Garanti BBVA" value={form.bankName} onChange={e => set('bankName', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">IBAN</label>
                <input className="input" placeholder="TR00 0000 0000 0000 0000 0000 00" value={form.bankIban} onChange={e => set('bankIban', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">SGK Numarası</label>
                <input className="input" placeholder="SGK sicil numarası" value={form.sgkNumber} onChange={e => set('sgkNumber', e.target.value)} />
              </div>
            </div>
          )}

          {tab === 'emergency' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700">
                Acil durum bilgileri yalnızca acil hallerde kullanılır
              </div>
              <div className="col-span-2">
                <label className="label">İletişim Kişisi Adı</label>
                <input className="input" placeholder="Ahmet Yılmaz" value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)} />
              </div>
              <div>
                <label className="label">Telefon</label>
                <input className="input" placeholder="+90 555 000 00 00" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} />
              </div>
              <div>
                <label className="label">Yakınlık</label>
                <input className="input" placeholder="Eş, Anne, Baba..." value={form.emergencyRel} onChange={e => set('emergencyRel', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-gray-100 flex items-center justify-between">
          <button onClick={onClose} className="btn-secondary">İptal</button>
          <div className="flex items-center gap-2">
            {tab !== 'personal' && (
              <button
                onClick={() => setTab(TABS[TABS.findIndex(t => t.id === tab) - 1].id)}
                className="btn-ghost"
              >
                ← Önceki
              </button>
            )}
            {tab !== 'emergency' ? (
              <button
                onClick={() => setTab(TABS[TABS.findIndex(t => t.id === tab) + 1].id)}
                className="btn-primary"
              >
                Sonraki →
              </button>
            ) : (
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Kaydet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
