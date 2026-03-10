// app/api/jobs/candidates/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const jobId = searchParams.get('jobId')
  const stage = searchParams.get('stage')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const candidates = await prisma.candidate.findMany({
    where: {
      companyId,
      ...(jobId ? { jobId } : {}),
      ...(stage ? { stage: stage as any } : {}),
    },
    include: { job: { select: { id: true, title: true, department: true } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(candidates)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const candidate = await prisma.candidate.create({ data: body })
  return NextResponse.json(candidate, { status: 201 })
}
