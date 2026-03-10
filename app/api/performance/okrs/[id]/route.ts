// app/api/performance/okrs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const okr = await prisma.oKR.update({
    where: { id: params.id },
    data: body,
    include: { owner: { select: { id: true, firstName: true, lastName: true } }, children: true }
  })
  return NextResponse.json(okr)
}
