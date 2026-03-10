export const dynamic = 'force-dynamic'
// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalCompanies,
    totalUsers,
    totalEmployees,
    newSignupsThisMonth,
    trialCount,
    planDistribution,
    recentSignups,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.employee.count(),
    prisma.company.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.company.count({
      where: {
        trialEndsAt: { not: null, gte: now },
      },
    }),
    prisma.company.groupBy({
      by: ['plan'],
      _count: true,
    }),
    prisma.company.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, employees: true } },
      },
    }),
  ])

  // Calculate MRR based on plan pricing
  const PLAN_PRICES: Record<string, number> = {
    STARTER: 0,
    GROWTH: 2990,
    PRO: 5990,
    ENTERPRISE: 14990,
  }

  const planCounts = planDistribution.reduce(
    (acc, p) => {
      acc[p.plan] = p._count
      return acc
    },
    {} as Record<string, number>
  )

  const mrr = Object.entries(planCounts).reduce((total, [plan, count]) => {
    return total + (PLAN_PRICES[plan] || 0) * count
  }, 0)

  return NextResponse.json({
    totalCompanies,
    totalUsers,
    totalEmployees,
    mrr,
    newSignupsThisMonth,
    trialCount,
    planDistribution: planDistribution.map((p) => ({
      plan: p.plan,
      count: p._count,
    })),
    recentSignups,
  })
}
