// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { z } from 'zod'
import type { Plan } from '@prisma/client'

const checkoutSchema = z.object({
  planId: z.enum(['GROWTH', 'PRO', 'ENTERPRISE']),
  companyId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Oturum acmaniz gerekiyor' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = checkoutSchema.parse(body)

    // Kullanicinin bu sirkete erisimi oldugundan emin ol
    const userCompanyId = (session.user as any).companyId
    if (userCompanyId !== data.companyId) {
      return NextResponse.json(
        { error: 'Bu islem icin yetkiniz yok' },
        { status: 403 }
      )
    }

    const checkoutUrl = await createCheckoutSession(
      data.companyId,
      data.planId as Plan
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Gecersiz istek verisi', details: e.errors },
        { status: 400 }
      )
    }
    console.error('Checkout oturumu olusturma hatasi:', e)
    return NextResponse.json(
      { error: e.message || 'Sunucu hatasi' },
      { status: 500 }
    )
  }
}
