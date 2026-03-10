// app/api/kvkk/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const request = await prisma.kvkkRequest.update({
    where: { id: params.id },
    data: {
      ...body,
      resolvedAt: ['RESOLVED', 'REJECTED'].includes(body.status) ? new Date() : undefined,
    },
    include: { employee: { select: { id: true, firstName: true, lastName: true, email: true } } }
  })
  return NextResponse.json(request)
}
