// app/api/jobs/candidates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const candidate = await prisma.candidate.update({
    where: { id: params.id },
    data: {
      ...body,
      hiredAt: body.stage === 'HIRED' ? new Date() : undefined,
    },
    include: { job: { select: { id: true, title: true } } }
  })
  return NextResponse.json(candidate)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.candidate.update({
    where: { id: params.id },
    data: { stage: 'REJECTED' }
  })
  return NextResponse.json({ success: true })
}
