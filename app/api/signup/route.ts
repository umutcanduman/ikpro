// app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2),
  industry: z.string(),
  size: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Generate unique slug from company name
    const baseSlug = data.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40)

    let slug = baseSlug
    let suffix = 0
    while (await prisma.company.findUnique({ where: { slug } })) {
      suffix++
      slug = `${baseSlug}-${suffix}`
    }

    // Create company + admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug,
          size: data.size as any,
          industry: data.industry as any,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      })

      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: 'COMPANY_ADMIN',
          companyId: company.id,
        },
      })

      // Activate Core HR by default
      await tx.companyModule.create({
        data: {
          companyId: company.id,
          moduleSlug: 'CORE_HR',
          status: 'TRIAL',
          activatedAt: new Date(),
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      })

      // Create onboarding progress
      await tx.onboardingProgress.create({
        data: {
          companyId: company.id,
          currentStep: 'modules',
          completedSteps: ['signup'],
        },
      })

      return { company, user }
    })

    return NextResponse.json({
      companyId: result.company.id,
      userId: result.user.id,
      message: 'Kayıt başarılı',
    })
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Geçersiz form verisi' }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
