'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, CreditCard, Puzzle, Users, Bell, Lock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { CompanySettings } from '@/components/settings/CompanySettings'
import { BillingSettings } from '@/components/settings/BillingSettings'
import { ModuleSettings } from '@/components/settings/ModuleSettings'
import { TeamSettings } from '@/components/settings/TeamSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'

const TABS = [
  { id: 'company', label: 'Şirket', icon: Building2 },
  { id: 'billing', label: 'Faturalama', icon: CreditCard },
  { id: 'modules', label: 'Modüller', icon: Puzzle },
  { id: 'team', label: 'Ekip', icon: Users },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'security', label: 'Güvenlik', icon: Lock },
] as const

type TabId = (typeof TABS)[number]['id']

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('company')
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCompany()
    }
  }, [status])

  const fetchCompany = async () => {
    try {
      const res = await fetch('/api/settings/company')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCompany(data)
    } catch {
      toast.error('Şirket bilgileri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink font-display">Ayarlar</h1>
          <p className="text-ink-muted text-sm mt-0.5">Şirket ayarlarınızı ve aboneliğinizi yönetin</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 -mb-px overflow-x-auto" aria-label="Ayarlar sekmeleri">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-brand-600'
                      : 'text-ink-muted hover:text-ink-secondary'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : ''}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="settings-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'company' && <CompanySettings company={company} />}
            {activeTab === 'billing' && <BillingSettings company={company} />}
            {activeTab === 'modules' && <ModuleSettings company={company} />}
            {activeTab === 'team' && <TeamSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'security' && <SecuritySettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
