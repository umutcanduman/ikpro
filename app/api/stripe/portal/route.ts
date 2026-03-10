export const dynamic = 'force-dynamic'
// app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createBillingPortalSession } from '@/lib/stripe'
import { z } from 'zod'

const portalSchema = z.object({
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
    const data = portalSchema.parse(body)

    // Kullanicinin bu sirkete erisimi oldugundan emin ol
    const userCompanyId = (session.user as any).companyId
    if (userCompanyId !== data.companyId) {
      return NextResponse.json(
        { error: 'Bu islem icin yetkiniz yok' },
        { status: 403 }
      )
    }

    const portalUrl = await createBillingPortalSession(data.companyId)

    return NextResponse.json({ url: portalUrl })
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Gecersiz istek verisi', details: e.errors },
        { status: 400 }
      )
    }
    console.error('Portal oturumu olusturma hatasi:', e)
    return NextResponse.json(
      { error: e.message || 'Sunucu hatasi' },
      { status: 500 }
    )
  }
}
