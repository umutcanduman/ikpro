export const dynamic = 'force-dynamic'
// app/api/performance/okrs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const period = searchParams.get('period')
  const ownerId = searchParams.get('ownerId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const okrs = await prisma.oKR.findMany({
    where: { companyId, ...(period ? { period } : {}), ...(ownerId ? { ownerId } : {}), parentId: null },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, jobTitle: true } },
      children: {
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(okrs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const okr = await prisma.oKR.create({
    data: { ...body, dueDate: body.dueDate ? new Date(body.dueDate) : undefined },
    include: { owner: { select: { id: true, firstName: true, lastName: true } } }
  })
  return NextResponse.json(okr, { status: 201 })
}
