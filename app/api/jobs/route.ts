// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const status = searchParams.get('status')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const jobs = await prisma.job.findMany({
    where: { companyId, ...(status ? { status: status as any } : {}) },
    include: { _count: { select: { candidates: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const job = await prisma.job.create({
      data: {
        ...body,
        publishedAt: body.status === 'PUBLISHED' ? new Date() : undefined,
      }
    })
    return NextResponse.json(job, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'İlan oluşturulamadı' }, { status: 500 })
  }
}
