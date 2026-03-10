// app/api/settings/company/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  taxId: z.string().optional(),
  city: z.string().optional(),
  industry: z.enum([
    'TECHNOLOGY', 'RETAIL', 'MANUFACTURING', 'LOGISTICS',
    'FINANCE', 'HEALTHCARE', 'EDUCATION', 'HOSPITALITY',
    'PROFESSIONAL_SERVICES', 'OTHER',
  ]).optional(),
  language: z.enum(['TR', 'EN']).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const companyId = (session.user as any).companyId
    if (!companyId) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 })
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        modules: {
          include: { module: true },
        },
        _count: {
          select: { employees: true, users: true },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const role = (session.user as any).role
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_MANAGER'].includes(role)) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const companyId = (session.user as any).companyId
    if (!companyId) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // Clean empty strings to null
    const cleanData: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value === '') {
        cleanData[key] = null
      } else if (value !== undefined) {
        cleanData[key] = value
      }
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: cleanData,
    })

    return NextResponse.json(company)
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Geçersiz veri', details: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
