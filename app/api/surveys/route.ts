export const dynamic = 'force-dynamic'
// app/api/surveys/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const companyId = new URL(req.url).searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })

  const surveys = await prisma.survey.findMany({
    where: { companyId },
    include: {
      _count: { select: { responses: true, questions: true } },
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(surveys)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { questions, ...surveyData } = body

  const survey = await prisma.survey.create({
    data: {
      ...surveyData,
      questions: questions ? {
        create: questions.map((q: any, i: number) => ({ ...q, order: i }))
      } : undefined
    },
    include: { questions: true, _count: { select: { responses: true } } }
  })
  return NextResponse.json(survey, { status: 201 })
}
