// app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      manager: { select: { id: true, firstName: true, lastName: true, jobTitle: true, avatarUrl: true } },
      reports: {
        select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, avatarUrl: true, status: true },
        where: { status: 'ACTIVE' },
      },
    },
  })
  if (!employee) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(employee)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { startDate, endDate, ...rest } = body

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        reports: { select: { id: true, firstName: true, lastName: true, jobTitle: true, avatarUrl: true } },
      },
    })
    return NextResponse.json(employee)
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    console.error(e)
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft-delete: set status to TERMINATED
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: { status: 'TERMINATED', endDate: new Date() },
    })
    return NextResponse.json({ success: true, id: employee.id })
  } catch (e: any) {
    if (e.code === 'P2025') return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
    return NextResponse.json({ error: 'Silme başarısız' }, { status: 500 })
  }
}
