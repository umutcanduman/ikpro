// app/api/leave/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/leave?companyId=&employeeId=&status=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const employeeId = searchParams.get('employeeId')
  const status = searchParams.get('status')

  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const [requests, leaveTypes] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        companyId,
        ...(employeeId ? { employeeId } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, department: true, avatarUrl: true } },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.leaveType.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
  ])

  return NextResponse.json({ requests, leaveTypes })
}

// POST /api/leave
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, employeeId, leaveTypeId, startDate, endDate, reason } = body

    if (!companyId || !employeeId || !leaveTypeId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Check balance
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId, year: new Date().getFullYear() }
    })
    if (balance && balance.remaining < days) {
      return NextResponse.json({ error: `Yetersiz izin bakiyesi. Kalan: ${balance.remaining} gün` }, { status: 400 })
    }

    const request = await prisma.leaveRequest.create({
      data: { companyId, employeeId, leaveTypeId, startDate: start, endDate: end, days, reason, status: 'PENDING' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        leaveType: true,
      }
    })

    // Update pending balance
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { increment: days } }
      })
    }

    return NextResponse.json(request, { status: 201 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'İzin talebi oluşturulamadı' }, { status: 500 })
  }
}
