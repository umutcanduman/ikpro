'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Play, CheckCircle, DollarSign, Download, Eye, Loader2, TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type PayrollRun = {
  id: string
  period: string
  status: string
  totalGross: number
  totalNet: number
  totalSgk: number
  totalTax: number
  employeeCount: number
  processedAt?: string
  paidAt?: string
  _count?: { payslips: number }
}

type Payslip = {
  id: string
  grossSalary: number
  sgkEmployee: number
  sgkEmployer: number
  incomeTax: number
  stampTax: number
  netSalary: number
  employee: { id: string; firstName: string; lastName: string; jobTitle?: string; department?: string; bankIban?: string; bankName?: string; avatarUrl?: string }
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-blue-100 text-blue-600',
  PROCESSED: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak', PROCESSING: 'İşleniyor', PROCESSED: 'Hazır', PAID: 'Ödendi', CANCELLED: 'İptal',
}

function fmt(n: number) { return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function Avatar({ name }: { name: string }) {
  const i = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  const colors = ['bg-brand-100 text-brand-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600']
  const color = colors[name.charCodeAt(0) % 3]
  return <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0`}>{i}</div>
}

export default function PayrollPage() {
  const params = useSearchParams()
  const companyId = params.get('companyId') || 'demo'

  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [selectedRun, setSelectedRun] = useState<PayrollRun & { payslips?: Payslip[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPeriod, setNewPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => { fetchRuns() }, [])

  async function fetchRuns() {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll?companyId=${companyId}`)
      const data = await res.json()
      setRuns(data)
    } catch { toast.error('Veriler yüklenemedi') }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, period: newPeriod })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${newPeriod} bordrosu oluşturuldu`)
      fetchRuns()
      openRun(data.id)
    } catch (e: any) { toast.error(e.message) }
    finally { setCreating(false) }
  }

  async function openRun(id: string) {
    const res = await fetch(`/api/payroll/${id}`)
    const data = await res.json()
    setSelectedRun(data)
  }

  async function handleMarkPaid(id: string) {
    const res = await fetch(`/api/payroll/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pay' })
    })
    if (res.ok) {
      toast.success('Bordro ödendi olarak işaretlendi')
      fetchRuns()
      if (selectedRun?.id === id) openRun(id)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">Bordro</h1>
            <p className="text-ink-muted text-sm mt-0.5">SGK, gelir vergisi ve damga vergisi otomatik hesaplandı</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              className="input w-auto"
              value={newPeriod}
              onChange={e => setNewPeriod(e.target.value)}
            />
            <button onClick={handleCreate} disabled={creating} className="btn-primary">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Bordro Çalıştır</>}
            </button>
          </div>
        </div>

        {/* Run history */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-ink">Bordro Geçmişi</h2>
          </div>
          {loading ? (
            <div className="py-16 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
          ) : runs.length === 0 ? (
            <div className="py-16 text-center">
              <DollarSign className="w-10 h-10 text-ink-muted mx-auto mb-3" />
              <p className="font-medium text-ink">Henüz bordro çalıştırılmadı</p>
              <p className="text-sm text-ink-muted mt-1">Yukarıdan dönem seçip "Bordro Çalıştır" butonuna tıklayın</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-muted/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Dönem</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-ink-muted uppercase hidden md:table-cell">Brüt</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-ink-muted uppercase">Net</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-ink-muted uppercase hidden lg:table-cell">SGK</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-ink-muted uppercase">Çalışan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Durum</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {runs.map(run => (
                  <tr key={run.id} className="hover:bg-surface-muted/50 transition-colors cursor-pointer" onClick={() => openRun(run.id)}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-ink">{run.period}</p>
                        {run.paidAt && <p className="text-xs text-ink-muted">{new Date(run.paidAt).toLocaleDateString('tr-TR')}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <span className="text-sm font-mono text-ink">₺{fmt(run.totalGross)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-mono font-bold text-ink">₺{fmt(run.totalNet)}</span>
                    </td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell">
                      <span className="text-sm font-mono text-ink-secondary">₺{fmt(run.totalSgk)}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-semibold text-ink">{run.employeeCount}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${STATUS_COLORS[run.status]}`}>{STATUS_LABELS[run.status]}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Eye className="w-4 h-4 text-ink-muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Run detail modal */}
        {selectedRun && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-up">
              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-bold text-xl text-ink font-display">{selectedRun.period} Bordrosu</h2>
                    <span className={`badge ${STATUS_COLORS[selectedRun.status]}`}>{STATUS_LABELS[selectedRun.status]}</span>
                  </div>
                  <p className="text-sm text-ink-muted mt-0.5">{selectedRun.employeeCount} çalışan</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRun.status === 'PROCESSED' && (
                    <button onClick={() => handleMarkPaid(selectedRun.id)} className="btn-primary text-sm">
                      <CheckCircle className="w-4 h-4" /> Ödendi İşaretle
                    </button>
                  )}
                  <button onClick={() => setSelectedRun(null)} className="btn-secondary text-sm">Kapat</button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-4 px-7 py-5 border-b border-gray-100">
                {[
                  { label: 'Toplam Brüt', value: selectedRun.totalGross, color: 'text-ink' },
                  { label: 'Toplam Net', value: selectedRun.totalNet, color: 'text-green-600' },
                  { label: 'SGK (İşçi+İşveren)', value: selectedRun.totalSgk, color: 'text-blue-600' },
                  { label: 'Gelir + Damga V.', value: selectedRun.totalTax, color: 'text-amber-600' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-xs text-ink-muted">{label}</p>
                    <p className={`text-lg font-black font-mono mt-0.5 ${color}`}>₺{fmt(value)}</p>
                  </div>
                ))}
              </div>

              {/* Payslips table */}
              <div className="flex-1 overflow-y-auto">
                {selectedRun.payslips && (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-ink-muted uppercase">Çalışan</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-ink-muted uppercase">Brüt</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-ink-muted uppercase">SGK</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-ink-muted uppercase">Vergi</th>
                        <th className="px-5 py-3 text-right text-xs font-semibold text-ink-muted uppercase font-bold">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedRun.payslips.map(slip => (
                        <tr key={slip.id} className="hover:bg-surface-muted/50">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <Avatar name={`${slip.employee.firstName} ${slip.employee.lastName}`} />
                              <div>
                                <p className="font-medium text-sm text-ink">{slip.employee.firstName} {slip.employee.lastName}</p>
                                <p className="text-xs text-ink-muted">{slip.employee.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-mono text-sm text-ink">₺{fmt(slip.grossSalary)}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-sm text-ink-secondary">₺{fmt(slip.sgkEmployee)}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-sm text-ink-secondary">₺{fmt(slip.incomeTax + slip.stampTax)}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-sm font-bold text-green-600">₺{fmt(slip.netSalary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
