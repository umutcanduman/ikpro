// app/api/leave/types/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const companyId = new URL(req.url).searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })
  const types = await prisma.leaveType.findMany({ where: { companyId }, orderBy: { name: 'asc' } })
  return NextResponse.json(types)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const type = await prisma.leaveType.create({ data: body })
  return NextResponse.json(type, { status: 201 })
}
