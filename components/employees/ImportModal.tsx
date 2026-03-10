'use client'
import { useState, useRef, useCallback } from 'react'
import { X, Upload, FileText, Check, AlertCircle, Loader2, Download } from 'lucide-react'
import toast from 'react-hot-toast'

type Props = {
  companyId: string
  onClose: () => void
  onImported: () => void
}

type ParsedRow = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  startDate?: string
  _valid: boolean
  _error?: string
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())

  const colMap: Record<string, number> = {}
  const aliases: Record<string, string[]> = {
    firstName: ['firstname', 'first_name', 'ad', 'name'],
    lastName: ['lastname', 'last_name', 'soyad', 'surname'],
    email: ['email', 'e-posta', 'eposta', 'mail'],
    phone: ['phone', 'telefon', 'tel'],
    jobTitle: ['jobtitle', 'job_title', 'gorev', 'pozisyon', 'title', 'position'],
    department: ['department', 'dept', 'departman'],
    startDate: ['startdate', 'start_date', 'ise_baslama', 'işe başlama', 'hiredate'],
  }

  for (const [field, aliasList] of Object.entries(aliases)) {
    for (let i = 0; i < header.length; i++) {
      if (aliasList.includes(header[i])) { colMap[field] = i; break }
    }
  }

  return lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const row: ParsedRow = {
      firstName: cells[colMap.firstName ?? -1] || '',
      lastName: cells[colMap.lastName ?? -1] || '',
      email: cells[colMap.email ?? -1] || '',
      phone: cells[colMap.phone ?? -1],
      jobTitle: cells[colMap.jobTitle ?? -1],
      department: cells[colMap.department ?? -1],
      startDate: cells[colMap.startDate ?? -1],
      _valid: true,
    }
    if (!row.firstName) { row._valid = false; row._error = 'Ad eksik' }
    else if (!row.lastName) { row._valid = false; row._error = 'Soyad eksik' }
    else if (!row.email || !row.email.includes('@')) { row._valid = false; row._error = 'Geçersiz e-posta' }
    return row
  }).filter(r => r.firstName || r.lastName || r.email) // skip empty rows
}

const SAMPLE_CSV = `Ad,Soyad,E-posta,Telefon,Görev,Departman,İşe Başlama
Ayşe,Yılmaz,ayse@sirket.com,+90 555 111 22 33,Ürün Müdürü,Ürün,2023-01-15
Mehmet,Kaya,mehmet@sirket.com,+90 555 444 55 66,Backend Developer,Mühendislik,2022-06-01
Elif,Demir,elif@sirket.com,,UX Designer,Tasarım,2023-03-20`

export function ImportModal({ companyId, onClose, onImported }: Props) {
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) { toast.error('Yalnızca .csv dosyası kabul edilir'); return }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setRows(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  async function handleImport() {
    if (!rows) return
    const validRows = rows.filter(r => r._valid)
    if (validRows.length === 0) { toast.error('Geçerli satır yok'); return }

    setImporting(true)
    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, rows: validRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setImporting(false)
    }
  }

  const validCount = rows?.filter(r => r._valid).length ?? 0
  const invalidCount = rows?.filter(r => !r._valid).length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-up">
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-ink text-lg font-display">CSV İçe Aktar</h2>
            <p className="text-xs text-ink-muted mt-0.5">Excel'den .csv olarak kaydedin, ardından buraya yükleyin</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-surface-muted flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-ink-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-7">
          {result ? (
            /* Import result */
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-ink mb-2">İçe Aktarma Tamamlandı</h3>
              <div className="flex items-center justify-center gap-6 mt-5">
                <div className="text-center">
                  <p className="text-3xl font-black text-green-500">{result.created}</p>
                  <p className="text-sm text-ink-muted">Oluşturuldu</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-amber-500">{result.skipped}</p>
                  <p className="text-sm text-ink-muted">Atlandı</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4 text-left rounded-xl bg-red-50 border border-red-100 p-4 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
                </div>
              )}
              <button onClick={onImported} className="btn-primary mt-6">Tamam</button>
            </div>
          ) : !rows ? (
            /* Upload zone */
            <div className="space-y-5">
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragging ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <Upload className={`w-10 h-10 mx-auto mb-4 transition-colors ${dragging ? 'text-brand-500' : 'text-ink-muted'}`} />
                <p className="font-semibold text-ink mb-1">CSV dosyasını sürükleyin veya tıklayın</p>
                <p className="text-sm text-ink-muted">Yalnızca .csv formatı · Maksimum 5MB</p>
                <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-muted border border-gray-100">
                <FileText className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">Şablon dosyasını indirin</p>
                  <p className="text-xs text-ink-muted">Desteklenen sütunlar: Ad, Soyad, E-posta, Telefon, Görev, Departman, İşe Başlama</p>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = 'ikpro-calisanlar-sablonu.csv'; a.click()
                  }}
                  className="btn-secondary text-xs flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </button>
              </div>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-400" />
                  <div>
                    <p className="font-semibold text-sm text-ink">{fileName}</p>
                    <p className="text-xs text-ink-muted">{rows.length} satır bulundu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge bg-green-100 text-green-700"><Check className="w-3 h-3" />{validCount} geçerli</span>
                  {invalidCount > 0 && <span className="badge bg-red-100 text-red-600"><AlertCircle className="w-3 h-3" />{invalidCount} hatalı</span>}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-muted">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted">Ad Soyad</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted">E-posta</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted hidden md:table-cell">Departman</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-ink-muted">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className={row._valid ? '' : 'bg-red-50'}>
                        <td className="px-3 py-2 text-xs text-ink-muted">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-ink">{row.firstName} {row.lastName}</td>
                        <td className="px-3 py-2 text-ink-secondary">{row.email}</td>
                        <td className="px-3 py-2 text-ink-secondary hidden md:table-cell">{row.department || '—'}</td>
                        <td className="px-3 py-2">
                          {row._valid
                            ? <Check className="w-4 h-4 text-green-500" />
                            : <span className="text-xs text-red-500">{row._error}</span>
                          }
                        </td>
                      </tr>
                    ))}
                    {rows.length > 20 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-xs text-center text-ink-muted">
                          +{rows.length - 20} satır daha
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button onClick={() => { setRows(null); setFileName('') }} className="btn-ghost text-xs">
                ← Başka dosya seç
              </button>
            </div>
          )}
        </div>

        {rows && !result && (
          <div className="px-7 py-5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {validCount} çalışan oluşturulacak
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary">İptal</button>
              <button onClick={handleImport} disabled={importing || validCount === 0} className="btn-primary">
                {importing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> İçe Aktarılıyor...</>
                  : <><Upload className="w-4 h-4" /> {validCount} Çalışanı Aktar</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
