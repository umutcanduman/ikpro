// app/api/payroll/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const run = await prisma.payrollRun.findUnique({
    where: { id: params.id },
    include: {
      payslips: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, bankIban: true, bankName: true, avatarUrl: true }
          }
        },
        orderBy: { employee: { lastName: 'asc' } }
      }
    }
  })
  if (!run) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(run)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { action } = await req.json()
  let data: any = {}
  if (action === 'pay') data = { status: 'PAID', paidAt: new Date() }
  if (action === 'cancel') data = { status: 'CANCELLED' }

  const run = await prisma.payrollRun.update({ where: { id: params.id }, data })
  return NextResponse.json(run)
}
