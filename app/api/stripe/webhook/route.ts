// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe, handleSubscriptionChange, PLANS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type { Plan } from '@prisma/client'
import Stripe from 'stripe'

export const runtime = 'nodejs'

// Next.js 14 App Router: body parser'i devre disi birak
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let event: Stripe.Event

  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'stripe-signature basligi eksik' },
        { status: 400 }
      )
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (e: any) {
    console.error('Webhook imza dogrulama hatasi:', e.message)
    return NextResponse.json(
      { error: `Webhook hatasi: ${e.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      // ─── Checkout tamamlandi ──────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          const companyId = session.metadata?.companyId
          const planId = session.metadata?.planId as Plan | undefined

          if (companyId) {
            // Stripe musteri ID'sini ve abonelik bilgilerini kaydet
            await prisma.company.update({
              where: { id: companyId },
              data: {
                customerId: session.customer as string,
                subscriptionId: session.subscription as string,
                plan: planId || 'GROWTH',
              },
            })
          }
        }
        break
      }

      // ─── Abonelik guncellendi ─────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)
        break
      }

      // ─── Abonelik iptal edildi ────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const companyId = subscription.metadata?.companyId

        if (companyId) {
          await prisma.company.update({
            where: { id: companyId },
            data: {
              plan: 'STARTER',
              subscriptionId: null,
            },
          })
        } else {
          // metadata yoksa customerId uzerinden bul
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id

          await prisma.company.updateMany({
            where: { customerId },
            data: {
              plan: 'STARTER',
              subscriptionId: null,
            },
          })
        }
        break
      }

      // ─── Odeme basarisiz ──────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id

        if (customerId) {
          console.warn(
            `Odeme basarisiz - Musteri: ${customerId}, Fatura: ${invoice.id}`
          )
          // Opsiyonel: Sirketi uyar veya flag koy
          // Burada bildirim gonderilebilir veya bir flag set edilebilir
        }
        break
      }

      default:
        // Tanimsiz event tipleri icin loglama
        console.log(`Islenmemis webhook event tipi: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('Webhook isleme hatasi:', e)
    return NextResponse.json(
      { error: 'Webhook isleme hatasi' },
      { status: 500 }
    )
  }
}
