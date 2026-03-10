export const dynamic = 'force-dynamic'
// app/api/lms/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const employeeId = searchParams.get('employeeId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const courses = await prisma.course.findMany({
    where: { companyId, status: { not: 'ARCHIVED' } },
    include: {
      _count: { select: { enrollments: true, lessons: true } },
      enrollments: employeeId
        ? { where: { employeeId }, select: { status: true, progress: true } }
        : false,
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(courses)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const course = await prisma.course.create({
    data: body,
    include: { _count: { select: { lessons: true } } }
  })
  return NextResponse.json(course, { status: 201 })
}
