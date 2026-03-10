// app/api/modules/activate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const schema = z.object({
  companyId: z.string(),
  modules: z.array(z.string()),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyId, modules } = schema.parse(body)

    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 })
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    // Upsert each module
    await prisma.$transaction(
      modules.map(slug =>
        prisma.companyModule.upsert({
          where: { companyId_moduleSlug: { companyId, moduleSlug: slug as any } },
          update: { status: 'TRIAL', activatedAt: new Date(), trialEndsAt },
          create: {
            companyId,
            moduleSlug: slug as any,
            status: 'TRIAL',
            activatedAt: new Date(),
            trialEndsAt,
          },
        })
      )
    )

    // Update onboarding progress
    await prisma.onboardingProgress.update({
      where: { companyId },
      data: {
        completedSteps: { push: 'modules' },
        currentStep: 'checklist',
      },
    })

    return NextResponse.json({ success: true, activatedModules: modules.length })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Modüller aktifleştirilemedi' }, { status: 500 })
  }
}
