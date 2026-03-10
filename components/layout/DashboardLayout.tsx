'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, Calendar, DollarSign, Target,
  BookOpen, Heart, BarChart2, Shield, Settings, LogOut,
  Bell, ChevronDown, Menu, X, Zap, Search
} from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Panel', href: '/dashboard' },
  { icon: Users, label: 'Çalışanlar', href: '/dashboard/employees' },
  { icon: Calendar, label: 'İzin & Mesai', href: '/dashboard/leave' },
  { icon: DollarSign, label: 'Bordro', href: '/dashboard/payroll' },
  { icon: Target, label: 'İşe Alım', href: '/dashboard/ats' },
  { icon: Target, label: 'Performans & OKR', href: '/dashboard/performance' },
  { icon: BookOpen, label: 'Eğitim (LMS)', href: '/dashboard/lms' },
  { icon: Heart, label: 'Bağlılık', href: '/dashboard/engagement' },
  { icon: BarChart2, label: 'Analitik', href: '/dashboard/analytics' },
  { icon: Shield, label: 'KVKK', href: '/dashboard/kvkk' },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const user = session?.user as any

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className={`
        fixed h-full w-60 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center shadow-glow-sm">
              <span className="text-white font-black text-xs">İK</span>
            </div>
            <span className="font-bold text-ink text-base">İKPro</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-ink-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ icon: Icon, label, href }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-ink-secondary hover:bg-surface-muted hover:text-ink'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand-500' : 'text-ink-muted group-hover:text-ink-secondary'}`} />
                <span className="truncate">{label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-surface-muted hover:text-ink transition-all">
            <Settings className="w-4 h-4 text-ink-muted" />
            Ayarlar
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-surface-muted hover:text-ink transition-all text-left"
          >
            <LogOut className="w-4 h-4 text-ink-muted" />
            Çıkış Yap
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-3 mt-1 rounded-xl bg-surface-muted">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink truncate">{user?.name || 'Kullanıcı'}</p>
              <p className="text-xs text-ink-muted truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center px-6 gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-ink-muted hover:text-ink transition-colors">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <button className="relative w-9 h-9 rounded-xl bg-surface-muted hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Bell className="w-4 h-4 text-ink-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
