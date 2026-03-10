// app/api/admin/impersonate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  try {
    const { companyId } = await req.json()

    if (!companyId) {
      return NextResponse.json({ error: 'companyId gerekli' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          where: { role: 'COMPANY_ADMIN' },
          take: 1,
          select: { id: true, name: true, email: true, role: true },
        },
        _count: { select: { users: true, employees: true } },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 })
    }

    // Return company details and admin user for frontend context switching
    // In production, this would generate a temporary impersonation JWT
    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        plan: company.plan,
        _count: company._count,
      },
      adminUser: company.users[0] || null,
      impersonatedBy: user.id,
      // In production, include a signed token here
      // token: signImpersonationToken({ adminId: user.id, companyId })
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
