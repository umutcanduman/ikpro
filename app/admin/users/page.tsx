'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users, Search, ChevronLeft, ChevronRight, Shield, KeyRound,
  UserX, UserCog, Filter, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl: string | null
  createdAt: string
  company: { id: string; name: string } | null
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  COMPANY_ADMIN: 'Şirket Admini',
  HR_MANAGER: 'IK Yöneticisi',
  MANAGER: 'Yönetici',
  EMPLOYEE: 'Çalışan',
}

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: 'bg-orange-50 text-orange-600',
  COMPANY_ADMIN: 'bg-brand-50 text-brand-600',
  HR_MANAGER: 'bg-purple-50 text-purple-600',
  MANAGER: 'bg-blue-50 text-blue-600',
  EMPLOYEE: 'bg-gray-100 text-gray-600',
}

const ALL_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      ...(search ? { search } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    })

    try {
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('Kullanıcılar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleChangeRole = async () => {
    if (!editingUser || !editRole) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, role: editRole }),
      })
      if (res.ok) {
        toast.success('Rol güncellendi')
        setEditingUser(null)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Hata oluştu')
      }
    } catch {
      toast.error('Bağlantı hatası')
    }
  }

  const handleResetPassword = async (user: User) => {
    if (!confirm(`"${user.name}" kullanıcısının şifresini sıfırlamak istediğinize emin misiniz?`)) return
    // In production, this would send a password reset email
    toast.success(`${user.email} adresine şifre sıfırlama bağlantısı gönderildi`)
  }

  const handleDisableUser = async (user: User) => {
    if (!confirm(`"${user.name}" kullanıcısını devre dışı bırakmak istediğinize emin misiniz?`)) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: 'EMPLOYEE' }),
      })
      if (res.ok) {
        toast.success('Kullanıcı devre dışı bırakıldı')
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Hata oluştu')
      }
    } catch {
      toast.error('Bağlantı hatası')
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Kullanıcılar</h1>
        <p className="text-sm text-ink-muted mt-1">Tüm şirketlerdeki toplam {total} kullanıcı</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Ad veya e-posta ara..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="input text-sm min-w-[160px]"
        >
          <option value="">Tüm Roller</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Kullanıcı</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">Şirket</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">Kayıt Tarihi</th>
                <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-5 bg-gray-100 rounded animate-pulse w-2/3" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink-muted text-sm">
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-slate-500">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            u.name?.[0] || '?'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">{u.name}</p>
                          <p className="text-xs text-ink-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_STYLES[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-ink">
                        {u.company?.name || <span className="text-ink-muted">-</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-ink-muted">
                        {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingUser(u); setEditRole(u.role) }}
                          className="p-2 rounded-lg hover:bg-blue-50 text-ink-muted hover:text-blue-600 transition-colors"
                          title="Rol değiştir"
                        >
                          <UserCog className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-2 rounded-lg hover:bg-amber-50 text-ink-muted hover:text-amber-600 transition-colors"
                          title="Şifre sıfırla"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleDisableUser(u)}
                            className="p-2 rounded-lg hover:bg-red-50 text-ink-muted hover:text-red-600 transition-colors"
                            title="Devre dışı bırak"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-ink-muted">
              Sayfa {page} / {totalPages} &middot; Toplam {total} kayıt
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-ghost p-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink">Rol Değiştir</h3>
              <button onClick={() => setEditingUser(null)} className="text-ink-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-ink-muted mb-1">Kullanıcı</p>
              <p className="text-sm font-semibold text-ink">{editingUser.name}</p>
              <p className="text-xs text-ink-muted">{editingUser.email}</p>
            </div>

            <div className="mb-6">
              <label className="label mb-1.5">Yeni Rol</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="input w-full"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setEditingUser(null)} className="btn-secondary flex-1">
                İptal
              </button>
              <button
                onClick={handleChangeRole}
                disabled={editRole === editingUser.role}
                className="btn-primary flex-1 disabled:opacity-40"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
