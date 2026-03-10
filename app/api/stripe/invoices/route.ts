import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (!user) {
      return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { customerId: true },
    })

    if (!company?.customerId) {
      return NextResponse.json({ invoices: [] })
    }

    const stripeInvoices = await stripe.invoices.list({
      customer: company.customerId,
      limit: 12,
    })

    const invoices = stripeInvoices.data.map(inv => ({
      id: inv.id,
      date: new Date((inv.created || 0) * 1000).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      amount: `₺${((inv.amount_paid || 0) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      status: inv.status || 'unknown',
      pdfUrl: inv.invoice_pdf || null,
    }))

    return NextResponse.json({ invoices })
  } catch (e: any) {
    console.error('Fatura listesi hatası:', e)
    return NextResponse.json({ invoices: [] })
  }
}
