// prisma/seed.ts
import { PrismaClient, ModuleSlug, BillingUnit } from '@prisma/client'

const prisma = new PrismaClient()

const modules = [
  {
    slug: ModuleSlug.CORE_HR,
    name: 'Core HR',
    description: 'Employee profiles, org chart, onboarding & offboarding workflows, document management',
    icon: '👥',
    pricePerEmployee: null,
    priceFlat: null,
    billingUnit: BillingUnit.FREE,
    isFree: true,
    freeLimit: null,
    isCore: true,
    dependsOn: [],
    order: 1,
  },
  {
    slug: ModuleSlug.TIME_LEAVE,
    name: 'Time & Leave',
    description: 'Leave requests, approvals, shift scheduling, overtime tracking with Turkish labor law compliance',
    icon: '🗓️',
    pricePerEmployee: 20,
    priceFlat: null,
    billingUnit: BillingUnit.PER_EMPLOYEE,
    isFree: false,
    freeLimit: 15,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 2,
  },
  {
    slug: ModuleSlug.PAYROLL,
    name: 'Payroll Engine',
    description: 'Full Turkish payroll: SGK, income tax, multi-bank file generation, payslips & year-end reports',
    icon: '💰',
    pricePerEmployee: 35,
    priceFlat: null,
    billingUnit: BillingUnit.PER_EMPLOYEE,
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 3,
  },
  {
    slug: ModuleSlug.ATS,
    name: 'Recruitment (ATS)',
    description: 'AI-powered job descriptions, multi-board posting, Kanban pipeline, structured interviews',
    icon: '🎯',
    pricePerEmployee: null,
    priceFlat: 150,
    billingUnit: BillingUnit.PER_JOB_POST,
    isFree: true,
    freeLimit: 1,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 4,
  },
  {
    slug: ModuleSlug.PERFORMANCE,
    name: 'Performance & OKRs',
    description: 'OKR goal cascading, 360° reviews, continuous feedback, AI-written performance summaries',
    icon: '🚀',
    pricePerEmployee: 25,
    priceFlat: null,
    billingUnit: BillingUnit.PER_EMPLOYEE,
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 5,
  },
  {
    slug: ModuleSlug.LMS,
    name: 'Learning (LMS)',
    description: 'Course builder, learning paths, compliance training tracker, AI-recommended content',
    icon: '🎓',
    pricePerEmployee: 18,
    priceFlat: null,
    billingUnit: BillingUnit.PER_EMPLOYEE,
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 6,
  },
  {
    slug: ModuleSlug.ENGAGEMENT,
    name: 'Engagement & Wellbeing',
    description: 'Pulse surveys, eNPS tracking, peer recognition, wellbeing check-ins, anonymous feedback',
    icon: '💙',
    pricePerEmployee: 15,
    priceFlat: null,
    billingUnit: BillingUnit.PER_EMPLOYEE,
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 7,
  },
  {
    slug: ModuleSlug.ANALYTICS,
    name: 'HR Analytics',
    description: 'Predictive attrition, workforce cost forecasting, custom report builder, org health metrics',
    icon: '📊',
    pricePerEmployee: null,
    priceFlat: 500,
    billingUnit: BillingUnit.FLAT_MONTHLY,
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 8,
  },
  {
    slug: ModuleSlug.KVKK,
    name: 'KVKK Compliance',
    description: 'VERBİS documentation, consent management, data subject requests, retention policies',
    icon: '🛡️',
    pricePerEmployee: null,
    priceFlat: 300,
    billingUnit: BillingUnit.FLAT_MONTHLY,
    isFree: false,
    freeLimit: null,
    isCore: false,
    dependsOn: [ModuleSlug.CORE_HR],
    order: 9,
  },
]

async function main() {
  console.log('Seeding modules...')
  for (const mod of modules) {
    await prisma.module.upsert({
      where: { slug: mod.slug },
      update: mod,
      create: mod,
    })
  }
  console.log(`✅ Seeded ${modules.length} modules`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
