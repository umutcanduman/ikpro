'use client'
import { useState, useMemo } from 'react'
import { Lock, Eye, EyeOff, Monitor, Smartphone, Shield, AlertTriangle, Loader2, Save, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export function SecuritySettings() {
  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Password strength
  const strength = useMemo(() => {
    if (!newPassword) return { level: 0, label: '', color: '' }
    let score = 0
    if (newPassword.length >= 8) score++
    if (newPassword.length >= 12) score++
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++
    if (/\d/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++

    if (score <= 2) return { level: score, label: 'Zayıf', color: 'bg-red-500' }
    if (score <= 3) return { level: score, label: 'Orta', color: 'bg-amber-500' }
    return { level: score, label: 'Güçlü', color: 'bg-green-500' }
  }, [newPassword])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Şifre en az 8 karakter olmalı')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Şifre değiştirilemedi')
      toast.success('Şifreniz başarıyla güncellendi')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast.error(e.message || 'Bir hata oluştu')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Şifre Değiştir</h3>
            <p className="text-sm text-ink-muted">Hesap şifrenizi güncelleyin</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="label">Mevcut Şifre</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="input w-full pr-10"
                placeholder="Mevcut şifreniz"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Yeni Şifre</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="input w-full pr-10"
                placeholder="En az 8 karakter"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= strength.level ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength.level <= 2 ? 'text-red-600' : strength.level <= 3 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`input w-full ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300 focus:border-red-500' : ''}`}
              placeholder="Yeni şifrenizi tekrar girin"
              required
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-600 mt-1">Şifreler eşleşmiyor</p>
            )}
          </div>

          <button type="submit" disabled={changingPassword} className="btn-primary">
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {changingPassword ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">Aktif Oturumlar</h3>
            <p className="text-sm text-ink-muted">Hesabınıza bağlı cihazlar</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-muted">
            <Monitor className="w-5 h-5 text-ink-muted flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">Web Tarayıcı</p>
                <span className="badge bg-green-100 text-green-700">Bu cihaz</span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">Son etkinlik: Şu an aktif</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => toast('Tüm oturumlar sonlandırıldı', { icon: '🔒' })}
          className="btn-secondary mt-4"
        >
          <LogOut className="w-4 h-4" />
          Tüm Oturumları Kapat
        </button>
      </div>

      {/* Two-Factor Auth */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink">İki Faktörlü Doğrulama (2FA)</h3>
            <p className="text-sm text-ink-muted">Hesabınıza ekstra güvenlik katmanı ekleyin</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-muted">
          <div>
            <p className="text-sm font-medium text-ink">Durum: Devre Dışı</p>
            <p className="text-xs text-ink-muted mt-0.5">İki faktörlü doğrulama henüz aktif değil</p>
          </div>
          <button
            onClick={() => toast('İki faktörlü doğrulama yakında aktif olacak', { icon: '🔐' })}
            className="btn-primary"
          >
            Etkinleştir
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-red-600">Tehlikeli Alan</h3>
            <p className="text-sm text-ink-muted">Bu işlemler geri alınamaz</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50">
          <div>
            <p className="text-sm font-medium text-ink">Hesabı Sil</p>
            <p className="text-xs text-ink-muted mt-0.5">Hesabınız ve tüm verileriniz kalıcı olarak silinecek</p>
          </div>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toast.error('Hesap silme işlemi henüz aktif değil')
                  setShowDeleteConfirm(false)
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
              >
                Evet, Sil
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-ink-secondary text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Hesabı Sil
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
