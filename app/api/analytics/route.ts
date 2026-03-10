// app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const companyId = new URL(req.url).searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const thisYear = now.getFullYear()

  const [
    totalEmployees,
    activeEmployees,
    terminatedThisYear,
    hiredThisYear,
    onLeave,
    deptBreakdown,
    typeBreakdown,
    hiresByMonth,
    leaveByType,
    openJobs,
    pendingLeave,
    activeCourses,
    lastPayroll,
  ] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
    prisma.employee.count({
      where: { companyId, status: 'TERMINATED', endDate: { gte: new Date(thisYear, 0, 1) } }
    }),
    prisma.employee.count({
      where: { companyId, startDate: { gte: new Date(thisYear, 0, 1) } }
    }),
    prisma.employee.count({ where: { companyId, status: 'ON_LEAVE' } }),
    prisma.employee.groupBy({ by: ['department'], where: { companyId, status: 'ACTIVE' }, _count: true }),
    prisma.employee.groupBy({ by: ['employmentType'], where: { companyId, status: 'ACTIVE' }, _count: true }),
    prisma.employee.findMany({
      where: { companyId, startDate: { gte: sixMonthsAgo } },
      select: { startDate: true },
      orderBy: { startDate: 'asc' }
    }),
    prisma.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      where: { companyId, status: 'APPROVED', startDate: { gte: new Date(thisYear, 0, 1) } },
      _sum: { days: true }
    }),
    prisma.job.count({ where: { companyId, status: 'PUBLISHED' } }),
    prisma.leaveRequest.count({ where: { companyId, status: 'PENDING' } }),
    prisma.course.count({ where: { companyId, status: 'PUBLISHED' } }),
    prisma.payrollRun.findFirst({
      where: { companyId }, orderBy: { period: 'desc' }
    }),
  ])

  // Attrition rate
  const attritionRate = totalEmployees > 0
    ? Math.round((terminatedThisYear / totalEmployees) * 1000) / 10
    : 0

  // Monthly headcount trend (last 6 months)
  const monthlyHires: Record<string, number> = {}
  hiresByMonth.forEach(e => {
    if (e.startDate) {
      const key = `${e.startDate.getFullYear()}-${String(e.startDate.getMonth() + 1).padStart(2, '0')}`
      monthlyHires[key] = (monthlyHires[key] || 0) + 1
    }
  })

  return NextResponse.json({
    headcount: { total: totalEmployees, active: activeEmployees, onLeave, terminated: terminatedThisYear },
    growth: { hiredThisYear, terminatedThisYear, attritionRate },
    deptBreakdown: deptBreakdown.map(d => ({ name: d.department || 'Diğer', count: d._count })),
    typeBreakdown: typeBreakdown.map(d => ({ type: d.employmentType, count: d._count })),
    monthlyHires,
    openJobs,
    pendingLeave,
    activeCourses,
    lastPayroll: lastPayroll ? { period: lastPayroll.period, totalNet: lastPayroll.totalNet, status: lastPayroll.status } : null,
  })
}
