'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Search, Plus, Filter, Upload, Download, MoreHorizontal,
  Mail, Phone, Building2, Calendar, ChevronDown, Users,
  GitBranch, X, Check, AlertCircle, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { EmployeeDrawer } from '@/components/employees/EmployeeDrawer'
import { AddEmployeeModal } from '@/components/employees/AddEmployeeModal'
import { ImportModal } from '@/components/employees/ImportModal'
import { OrgChart } from '@/components/employees/OrgChart'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type Employee = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  location?: string
  employmentType: string
  status: string
  startDate?: string
  employeeNumber?: string
  avatarUrl?: string
  salary?: number
  manager?: { id: string; firstName: string; lastName: string; avatarUrl?: string }
  reports?: { id: string; firstName: string; lastName: string; jobTitle?: string; avatarUrl?: string }[]
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  TERMINATED: 'bg-red-100 text-red-700',
  PENDING: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif',
  ON_LEAVE: 'İzinde',
  TERMINATED: 'Ayrıldı',
  PENDING: 'Beklemede',
}
const EMP_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Tam Zamanlı',
  PART_TIME: 'Yarı Zamanlı',
  CONTRACT: 'Sözleşmeli',
  INTERN: 'Stajyer',
  FREELANCE: 'Freelance',
}

function Avatar({ employee, size = 'md' }: { employee: Pick<Employee, 'firstName' | 'lastName' | 'avatarUrl'>, size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' }
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase()
  const colors = ['bg-brand-100 text-brand-600', 'bg-purple-100 text-purple-600', 'bg-green-100 text-green-600', 'bg-amber-100 text-amber-600', 'bg-pink-100 text-pink-600']
  const color = colors[(employee.firstName.charCodeAt(0) + employee.lastName.charCodeAt(0)) % colors.length]

  if (employee.avatarUrl) {
    return <img src={employee.avatarUrl} alt={initials} className={`${sizes[size]} rounded-full object-cover`} />
  }
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function EmployeesPage() {
  const { data: session } = useSession()
  const companyId = (session?.user as any)?.companyId || ''

  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [deptStats, setDeptStats] = useState<{ department: string | null; _count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('ACTIVE')
  const [view, setView] = useState<'list' | 'org'>('list')
  const [selected, setSelected] = useState<string[]>([])
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const fetchEmployees = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    try {
      const qs = new URLSearchParams({
        ...(search ? { search } : {}),
        ...(filterDept ? { department: filterDept } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      })
      const res = await fetch(`/api/employees?${qs}`)
      const data = await res.json()
      setEmployees(data.employees || [])
      setTotal(data.total || 0)
      setDeptStats(data.deptStats || [])
    } catch {
      toast.error('Çalışanlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [companyId, search, filterDept, filterStatus])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  async function handleTerminate(ids: string[]) {
    if (!confirm(`${ids.length} çalışan işten çıkarılsın mı?`)) return
    await Promise.all(ids.map(id => fetch(`/api/employees/${id}`, { method: 'DELETE' })))
    toast.success('Güncellendi')
    setSelected([])
    fetchEmployees()
  }

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)))

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const allSelected = employees.length > 0 && selected.length === employees.length
  const toggleAll = () => setSelected(allSelected ? [] : employees.map(e => e.id))

  return (
    <DashboardLayout>
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">Çalışanlar</h1>
          <p className="text-ink-muted text-sm mt-0.5">
            {total} çalışan · {deptStats.length} departman
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload className="w-4 h-4" /> İçe Aktar
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Çalışan Ekle
          </button>
        </div>
      </div>

      {/* Dept stat pills */}
      {deptStats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDept('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !filterDept ? 'bg-ink text-white border-ink' : 'bg-white text-ink-secondary border-gray-200 hover:border-gray-300'
            }`}
          >
            Tümü ({total})
          </button>
          {deptStats.map(d => (
            <button
              key={d.department || 'none'}
              onClick={() => setFilterDept(filterDept === d.department ? '' : (d.department || ''))}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterDept === d.department
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-ink-secondary border-gray-200 hover:border-brand-300'
              }`}
            >
              {d.department || 'Departmansız'} ({d._count})
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="İsim, e-posta, görev ara..."
            className="input pl-10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input w-auto"
        >
          <option value="">Tüm Durumlar</option>
          <option value="ACTIVE">Aktif</option>
          <option value="ON_LEAVE">İzinde</option>
          <option value="TERMINATED">Ayrıldı</option>
          <option value="PENDING">Beklemede</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center bg-surface-muted rounded-xl p-1 border border-gray-200">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'list' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Liste
          </button>
          <button
            onClick={() => setView('org')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'org' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Org
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="bg-ink text-white rounded-2xl px-5 py-3 flex items-center justify-between animate-slide-in">
          <span className="text-sm font-medium">{selected.length} çalışan seçildi</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTerminate(selected)}
              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
            >
              İşten Çıkar
            </button>
            <button onClick={() => setSelected([])} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {view === 'org' ? (
        <OrgChart employees={employees as any} onSelectEmployee={setDrawerEmployee as any} />
      ) : (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">👤</div>
              <p className="font-semibold text-ink mb-1">Henüz çalışan yok</p>
              <p className="text-sm text-ink-muted mb-5">İlk çalışanı ekleyin veya CSV ile içe aktarın</p>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setShowImport(true)} className="btn-secondary">
                  <Upload className="w-4 h-4" /> CSV İçe Aktar
                </button>
                <button onClick={() => setShowAdd(true)} className="btn-primary">
                  <Plus className="w-4 h-4" /> Çalışan Ekle
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-surface-muted/50">
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Çalışan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">Departman</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">Yönetici</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">İşe Başlama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink-muted uppercase tracking-wider">Durum</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map(emp => (
                  <tr
                    key={emp.id}
                    className="hover:bg-surface-muted/50 transition-colors group cursor-pointer"
                    onClick={() => setDrawerEmployee(emp)}
                  >
                    <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(emp.id) }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-300"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar employee={emp} />
                        <div>
                          <p className="font-semibold text-ink text-sm">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs text-ink-muted">{emp.jobTitle || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-ink-secondary">{emp.department || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {emp.manager ? (
                        <div className="flex items-center gap-2">
                          <Avatar employee={emp.manager} size="sm" />
                          <span className="text-sm text-ink-secondary">
                            {emp.manager.firstName} {emp.manager.lastName}
                          </span>
                        </div>
                      ) : <span className="text-sm text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-ink-secondary">
                        {emp.startDate
                          ? new Date(emp.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`badge ${STATUS_COLORS[emp.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[emp.status] || emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); setDrawerEmployee(emp) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddEmployeeModal
          companyId={companyId}
          employees={employees}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchEmployees() }}
        />
      )}
      {showImport && (
        <ImportModal
          companyId={companyId}
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); fetchEmployees() }}
        />
      )}
      {drawerEmployee && (
        <EmployeeDrawer
          employee={drawerEmployee}
          onClose={() => setDrawerEmployee(null)}
          onUpdated={(updated) => {
            setDrawerEmployee(updated)
            fetchEmployees()
          }}
          onDeleted={() => { setDrawerEmployee(null); fetchEmployees() }}
        />
      )}
    </div>
    </DashboardLayout>
  )
}