export const dynamic = 'force-dynamic'
// app/api/leave/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action, rejectedReason, approvedById } = await req.json()

    const current = await prisma.leaveRequest.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        status: action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'CANCELLED',
        approvedById: action === 'approve' ? approvedById : undefined,
        approvedAt: action === 'approve' ? new Date() : undefined,
        rejectedReason: action === 'reject' ? rejectedReason : undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        leaveType: true,
      }
    })

    // Update balances
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: current.employeeId, leaveTypeId: current.leaveTypeId, year: new Date().getFullYear() }
    })
    if (balance) {
      if (action === 'approve') {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pending: { decrement: current.days }, used: { increment: current.days }, remaining: { decrement: current.days } }
        })
      } else if (action === 'reject' || action === 'cancel') {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pending: { decrement: current.days } }
        })
      }
    }

    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 })
  }
}
