// lib/stripe.ts
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import type { Plan } from '@prisma/client'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

// ─── PLAN DEFINITIONS ────────────────────────────────────────────────────────

export interface PlanDef {
  id: Plan
  name: string
  nameTr: string
  price: number // monthly price in TRY
  stripePriceId: string | null
  features: string[]
  limits: {
    maxEmployees: number
    maxModules: number
  }
}

export const PLANS: Record<Plan, PlanDef> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    nameTr: 'Baslangic',
    price: 0,
    stripePriceId: null,
    features: [
      'Temel IK modulu',
      '15 calisana kadar',
      'E-posta destegi',
      'Topluluk erisimi',
    ],
    limits: {
      maxEmployees: 15,
      maxModules: 2,
    },
  },
  GROWTH: {
    id: 'GROWTH',
    name: 'Growth',
    nameTr: 'Buyume',
    price: 499,
    stripePriceId: process.env.STRIPE_PRICE_GROWTH || '',
    features: [
      'Tum temel ozellikler',
      '50 calisana kadar',
      '5 module kadar',
      'Oncelikli e-posta destegi',
      'API erisimi',
    ],
    limits: {
      maxEmployees: 50,
      maxModules: 5,
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    nameTr: 'Profesyonel',
    price: 999,
    stripePriceId: process.env.STRIPE_PRICE_PRO || '',
    features: [
      'Tum Buyume ozellikleri',
      '200 calisana kadar',
      'Tum moduller',
      'Ozel destek yoneticisi',
      'Gelismis analitik',
      'SSO entegrasyonu',
    ],
    limits: {
      maxEmployees: 200,
      maxModules: 9,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    nameTr: 'Kurumsal',
    price: 2499,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
    features: [
      'Tum Pro ozellikleri',
      'Sinirsiz calisan',
      'Sinirsiz modul',
      '7/24 telefon destegi',
      'Ozel SLA',
      'Ozel entegrasyonlar',
      'Yerinde kurulum secenegi',
    ],
    limits: {
      maxEmployees: Infinity,
      maxModules: 9,
    },
  },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getStripePlan(planId: Plan): PlanDef {
  const plan = PLANS[planId]
  if (!plan) throw new Error(`Gecersiz plan: ${planId}`)
  return plan
}

/**
 * Stripe musteri ID'sini al veya olustur
 */
async function getOrCreateCustomer(companyId: string): Promise<string> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: { users: { where: { role: 'COMPANY_ADMIN' }, take: 1 } },
  })

  if (company.customerId) return company.customerId

  const adminEmail = company.users[0]?.email || `admin@${company.slug}.com`

  const customer = await stripe.customers.create({
    name: company.name,
    email: adminEmail,
    metadata: {
      companyId: company.id,
      companySlug: company.slug,
    },
  })

  await prisma.company.update({
    where: { id: companyId },
    data: { customerId: customer.id },
  })

  return customer.id
}

/**
 * Stripe Checkout oturumu olustur
 */
export async function createCheckoutSession(
  companyId: string,
  planId: Plan
): Promise<string> {
  const plan = getStripePlan(planId)

  if (!plan.stripePriceId) {
    throw new Error('Baslangic plani icin odeme gerekmez')
  }

  const customerId = await getOrCreateCustomer(companyId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      companyId,
      planId,
    },
    success_url: `${appUrl}/dashboard/settings/billing?success=true`,
    cancel_url: `${appUrl}/dashboard/settings/billing?cancelled=true`,
    locale: 'tr',
    currency: 'try',
  })

  return session.url!
}

/**
 * Stripe Faturalama Portali oturumu olustur
 */
export async function createBillingPortalSession(
  companyId: string
): Promise<string> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  })

  if (!company.customerId) {
    throw new Error('Bu sirket icin Stripe musterisi bulunamadi')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: company.customerId,
    return_url: `${appUrl}/dashboard/settings/billing`,
  })

  return session.url
}

/**
 * Abonelik degisikliklerini isle (webhook'lardan cagirilir)
 */
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
): Promise<void> {
  const companyId = subscription.metadata.companyId

  if (!companyId) {
    console.error('Abonelikte companyId metadata bulunamadi:', subscription.id)
    return
  }

  const priceId = subscription.items.data[0]?.price?.id
  let newPlan: Plan = 'STARTER'

  // Price ID'den plani belirle
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId && plan.stripePriceId === priceId) {
      newPlan = key as Plan
      break
    }
  }

  const isActive =
    subscription.status === 'active' || subscription.status === 'trialing'

  await prisma.company.update({
    where: { id: companyId },
    data: {
      plan: isActive ? newPlan : 'STARTER',
      subscriptionId: subscription.id,
    },
  })
}
