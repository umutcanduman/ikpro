'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { toast.error('E-posta ve şifre gerekli'); return }
    setLoading(true)
    const result = await signIn('credentials', {
      email, password, redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      toast.error('E-posta veya şifre hatalı')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">İK</span>
          </div>
          <span className="font-bold text-ink text-xl">İKPro</span>
        </div>

        <div className="card p-8 space-y-5">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink font-display">Tekrar hoş geldiniz</h1>
            <p className="text-ink-muted text-sm mt-1">Hesabınıza giriş yapın</p>
          </div>

          <div>
            <label className="label">E-posta</label>
            <input
              type="email" className="input" placeholder="siz@sirket.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div>
            <label className="label">Şifre</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} className="input pr-10"
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="btn-primary w-full">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <> Giriş Yap <ArrowRight className="w-4 h-4" /> </>
            }
          </button>

          <p className="text-center text-sm text-ink-muted">
            Hesabınız yok mu?{' '}
            <Link href="/signup" className="text-brand-500 font-semibold hover:underline">Kayıt olun</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
