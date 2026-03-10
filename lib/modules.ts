// lib/modules.ts
export type ModuleSlug =
  | 'CORE_HR' | 'TIME_LEAVE' | 'PAYROLL' | 'ATS'
  | 'PERFORMANCE' | 'LMS' | 'ENGAGEMENT' | 'ANALYTICS' | 'KVKK'

export interface ModuleDef {
  slug: ModuleSlug
  name: string
  nameEn: string
  description: string
  icon: string
  color: string
  bgColor: string
  pricePerEmployee: number | null
  priceFlat: number | null
  billingUnit: 'PER_EMPLOYEE' | 'PER_JOB_POST' | 'FLAT_MONTHLY' | 'FREE'
  isFree: boolean
  freeLimit: number | null
  isCore: boolean
  dependsOn: ModuleSlug[]
  highlights: string[]
  badge?: string
  order: number
}

export const MODULES: ModuleDef[] = [
  {
    slug: 'CORE_HR',
    name: 'Temel İK',
    nameEn: 'Core HR',
    description: 'Çalışan profilleri, organizasyon şeması, işe alım & çıkış süreçleri, belge yönetimi',
    icon: '👥',
    color: '#3A2CFF',
    bgColor: '#EEEEFF',
    pricePerEmployee: null,
    priceFlat: null,
    billingUnit: 'FREE',
    isFree: true,
    freeLimit: null,
    isCore: true,
    dependsOn: [],
    highlights: ['Çalışan profilleri', 'Org şeması', 'Belge yönetimi'],
    badge: 'Dahil',
    order: 1,
  },
  {
    slug: 'TIME_LEAVE',
    name: 'İzin & Mesai',
    nameEn: 'Time & Leave',
    description: 'İzin talepleri, vardiya planlaması, fazla mesai takibi — İş Kanunu uyumlu',
    icon: '🗓️',
    color: '#059669',
    bgColor: '#ECFDF5',
    pricePerEmployee: 20,
    priceFlat: null,
    billingUnit: 'PER_EMPLOYEE',
    isFree: false,
    freeLimit: 15,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['Otomatik izin hesabı', 'Vardiya yönetimi', 'Mobil talep'],
    order: 2,
  },
  {
    slug: 'PAYROLL',
    name: 'Bordro',
    nameEn: 'Payroll Engine',
    description: 'Tam Türkiye bordrosu: SGK, gelir vergisi, çok bankali ödeme dosyası, e-bordro',
    icon: '💰',
    color: '#D97706',
    bgColor: '#FFFBEB',
    pricePerEmployee: 35,
    priceFlat: null,
    billingUnit: 'PER_EMPLOYEE',
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['SGK & vergi otomasyonu', 'Çok banka desteği', 'E-bordro'],
    badge: 'En Popüler',
    order: 3,
  },
  {
    slug: 'ATS',
    name: 'İşe Alım (ATS)',
    nameEn: 'Recruitment',
    description: 'Yapay zeka destekli ilan oluşturma, çoklu ilan patlaması, Kanban pipeline',
    icon: '🎯',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    pricePerEmployee: null,
    priceFlat: 150,
    billingUnit: 'PER_JOB_POST',
    isFree: true,
    freeLimit: 1,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['AI ilan yazarı', 'Kariyer.net, LinkedIn', 'Kanban pipeline'],
    order: 4,
  },
  {
    slug: 'PERFORMANCE',
    name: 'Performans & OKR',
    nameEn: 'Performance',
    description: 'OKR hedef kaskadı, 360° değerlendirme, sürekli geri bildirim, AI özeti',
    icon: '🚀',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    pricePerEmployee: 25,
    priceFlat: null,
    billingUnit: 'PER_EMPLOYEE',
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['OKR takibi', '360° değerlendirme', 'AI performans özeti'],
    order: 5,
  },
  {
    slug: 'LMS',
    name: 'Eğitim (LMS)',
    nameEn: 'Learning',
    description: 'İçerik oluşturucu, öğrenme yolları, zorunlu eğitim takibi, AI öneri motoru',
    icon: '🎓',
    color: '#0891B2',
    bgColor: '#ECFEFF',
    pricePerEmployee: 18,
    priceFlat: null,
    billingUnit: 'PER_EMPLOYEE',
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['Kurs oluşturucu', 'Sertifika takibi', 'AI içerik önerisi'],
    order: 6,
  },
  {
    slug: 'ENGAGEMENT',
    name: 'Bağlılık & Refah',
    nameEn: 'Engagement',
    description: 'Nabız anketleri, eNPS takibi, akran takdiri, anonim öneri kutusu',
    icon: '💙',
    color: '#BE185D',
    bgColor: '#FDF2F8',
    pricePerEmployee: 15,
    priceFlat: null,
    billingUnit: 'PER_EMPLOYEE',
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['Nabız anketleri', 'eNPS ölçümü', 'Takdir sistemi'],
    order: 7,
  },
  {
    slug: 'ANALYTICS',
    name: 'İK Analitik',
    nameEn: 'HR Analytics',
    description: 'Tahmine dayalı işten ayrılma, işgücü maliyet tahmini, özel rapor oluşturucu',
    icon: '📊',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    pricePerEmployee: null,
    priceFlat: 500,
    billingUnit: 'FLAT_MONTHLY',
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['İşten ayrılma tahmini', 'Maliyet tahmini', 'Özel raporlar'],
    order: 8,
  },
  {
    slug: 'KVKK',
    name: 'KVKK Uyumu',
    nameEn: 'KVKK Compliance',
    description: 'VERBİS belgeleme, rıza yönetimi, veri silme talepleri, saklama politikaları',
    icon: '🛡️',
    color: '#374151',
    bgColor: '#F9FAFB',
    pricePerEmployee: null,
    priceFlat: 300,
    billingUnit: 'FLAT_MONTHLY',
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: ['CORE_HR'],
    highlights: ['VERBİS hazırlığı', 'Rıza yönetimi', 'Veri talebi akışı'],
    order: 9,
  },
]

export const BUNDLES = [
  {
    id: 'ops',
    name: 'Ops Paketi',
    description: 'Temel operasyon ve bordro',
    modules: ['CORE_HR', 'TIME_LEAVE', 'PAYROLL'] as ModuleSlug[],
    discount: 0.10,
    badge: null,
  },
  {
    id: 'talent',
    name: 'Yetenek Paketi',
    description: 'İşe alım, performans ve eğitim',
    modules: ['CORE_HR', 'ATS', 'PERFORMANCE', 'LMS'] as ModuleSlug[],
    discount: 0.15,
    badge: null,
  },
  {
    id: 'growth',
    name: 'Büyüme Paketi',
    description: 'Analitik ve KVKK hariç tüm modüller',
    modules: ['CORE_HR', 'TIME_LEAVE', 'PAYROLL', 'ATS', 'PERFORMANCE', 'LMS', 'ENGAGEMENT'] as ModuleSlug[],
    discount: 0.20,
    badge: 'Önerilen',
  },
  {
    id: 'full',
    name: 'Tam Paket',
    description: 'Tüm 9 modül dahil',
    modules: ['CORE_HR', 'TIME_LEAVE', 'PAYROLL', 'ATS', 'PERFORMANCE', 'LMS', 'ENGAGEMENT', 'ANALYTICS', 'KVKK'] as ModuleSlug[],
    discount: 0.25,
    badge: 'En İyi Değer',
  },
]

export function calcMonthlyPrice(
  selectedModules: ModuleSlug[],
  employeeCount: number
): number {
  let total = 0
  for (const slug of selectedModules) {
    const mod = MODULES.find(m => m.slug === slug)
    if (!mod || mod.isFree) continue
    if (mod.billingUnit === 'PER_EMPLOYEE' && mod.pricePerEmployee) {
      total += mod.pricePerEmployee * employeeCount
    } else if (mod.billingUnit === 'FLAT_MONTHLY' && mod.priceFlat) {
      total += mod.priceFlat
    } else if (mod.billingUnit === 'PER_JOB_POST' && mod.priceFlat) {
      total += mod.priceFlat // base: 1 job post included
    }
  }
  return total
}

export function getModuleDependencies(slug: ModuleSlug): ModuleSlug[] {
  const mod = MODULES.find(m => m.slug === slug)
  return mod?.dependsOn ?? []
}

export function resolveDependencies(selected: ModuleSlug[]): ModuleSlug[] {
  const resolved = new Set(selected)
  for (const slug of selected) {
    const deps = getModuleDependencies(slug)
    deps.forEach(d => resolved.add(d))
  }
  return Array.from(resolved)
}
