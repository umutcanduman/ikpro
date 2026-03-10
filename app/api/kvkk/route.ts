// app/api/kvkk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const [requests, consents, stats] = await Promise.all([
    prisma.kvkkRequest.findMany({
      where: { companyId },
      include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.kvkkConsent.findMany({
      where: { companyId },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
    prisma.kvkkRequest.groupBy({
      by: ['status'],
      where: { companyId },
      _count: true
    })
  ])

  return NextResponse.json({ requests, consents, stats })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { resourceType, ...data } = body

  if (resourceType === 'consent') {
    const consent = await prisma.kvkkConsent.create({ data })
    return NextResponse.json(consent, { status: 201 })
  }

  // Default: create request
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days legal deadline
  const request = await prisma.kvkkRequest.create({
    data: { ...data, dueDate },
    include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } }
  })
  return NextResponse.json(request, { status: 201 })
}
