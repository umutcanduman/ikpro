'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { UserPlus, Trash2, Loader2, Mail, Shield, X } from 'lucide-react'
import toast from 'react-hot-toast'

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  avatarUrl: string | null
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Süper Admin',
  COMPANY_ADMIN: 'Şirket Yöneticisi',
  HR_MANAGER: 'İK Yöneticisi',
  MANAGER: 'Yönetici',
  EMPLOYEE: 'Çalışan',
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  COMPANY_ADMIN: 'bg-brand-100 text-brand-700',
  HR_MANAGER: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-amber-100 text-amber-700',
  EMPLOYEE: 'bg-gray-100 text-gray-600',
}

const ASSIGNABLE_ROLES = [
  { value: 'COMPANY_ADMIN', label: 'Şirket Yöneticisi' },
  { value: 'HR_MANAGER', label: 'İK Yöneticisi' },
  { value: 'MANAGER', label: 'Yönetici' },
  { value: 'EMPLOYEE', label: 'Çalışan' },
]

export function TeamSettings() {
  const { data: session } = useSession()
  const currentUserId = (session?.user as any)?.id
  const currentRole = (session?.user as any)?.role

  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'EMPLOYEE' })
  const [inviting, setInviting] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)

  const isAdmin = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes(currentRole)

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/settings/team')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMembers(data)
    } catch {
      toast.error('Ekip listesi yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return
    setInviting(true)

    try {
      const res = await fetch('/api/settings/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Davet gönderilemedi')
      }
      toast.success('Kullanıcı eklendi')
      setShowInvite(false)
      setInviteForm({ name: '', email: '', role: 'EMPLOYEE' })
      fetchMembers()
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
    } finally {
      setInviting(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId)
    try {
      const res = await fetch('/api/settings/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Rol güncellenemedi')
      }
      toast.success('Rol güncellendi')
      fetchMembers()
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleRemove = async (userId: string) => {
    setRemoving(userId)
    try {
      const res = await fetch(`/api/settings/team?userId=${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kullanıcı kaldırılamadı')
      }
      toast.success('Kullanıcı kaldırıldı')
      setConfirmRemove(null)
      fetchMembers()
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
    } finally {
      setRemoving(null)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-brand-100 text-brand-600',
      'bg-purple-100 text-purple-600',
      'bg-green-100 text-green-600',
      'bg-amber-100 text-amber-600',
      'bg-pink-100 text-pink-600',
      'bg-cyan-100 text-cyan-600',
    ]
    const charSum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    return colors[charSum % colors.length]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-ink">Ekip Yönetimi</h3>
              <p className="text-sm text-ink-muted">
                {members.length} kullanıcı
              </p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowInvite(true)} className="btn-primary">
              <UserPlus className="w-4 h-4" /> Kullanıcı Ekle
            </button>
          )}
        </div>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="card p-6 ring-2 ring-brand-200 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-ink">Yeni Kullanıcı Ekle</h4>
            <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:bg-surface-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Ad Soyad</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="Ahmet Yılmaz"
                  required
                />
              </div>
              <div>
                <label className="label">E-posta</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                  placeholder="ahmet@sirket.com"
                  required
                />
              </div>
              <div>
                <label className="label">Rol</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  className="input"
                >
                  {ASSIGNABLE_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary">
                İptal
              </button>
              <button type="submit" disabled={inviting} className="btn-primary">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {inviting ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">👥</div>
            <p className="font-semibold text-ink mb-1">Henüz ekip üyesi yok</p>
            <p className="text-sm text-ink-muted">İlk kullanıcıyı ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map(member => {
              const isSelf = member.id === currentUserId
              const canManage = isAdmin && !isSelf && member.role !== 'SUPER_ADMIN'

              return (
                <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-muted/50 transition-colors">
                  {/* Avatar */}
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getAvatarColor(member.name)}`}>
                      {getInitials(member.name)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink text-sm truncate">{member.name}</p>
                      {isSelf && (
                        <span className="badge bg-brand-100 text-brand-700">Sen</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-ink-muted flex-shrink-0" />
                      <p className="text-xs text-ink-muted truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex-shrink-0">
                    {canManage ? (
                      <div className="relative">
                        {updatingRole === member.id ? (
                          <div className="flex items-center gap-2 px-3 py-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                          </div>
                        ) : (
                          <select
                            value={member.role}
                            onChange={e => handleRoleChange(member.id, e.target.value)}
                            className="text-xs font-semibold rounded-full pl-2.5 pr-7 py-1 border border-gray-200 bg-white appearance-none cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:border-brand-400"
                          >
                            {ASSIGNABLE_ROLES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <span className={`badge ${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    )}
                  </div>

                  {/* Remove */}
                  <div className="flex-shrink-0">
                    {canManage && (
                      confirmRemove === member.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemove(member.id)}
                            disabled={removing === member.id}
                            className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                          >
                            {removing === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Evet'}
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 text-ink-secondary text-xs font-semibold hover:bg-gray-200 transition-colors"
                          >
                            Hayır
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(member.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
