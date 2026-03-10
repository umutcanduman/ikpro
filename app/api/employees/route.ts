// app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

async function getCompanyId(sessionUser: any): Promise<string | null> {
  if (sessionUser?.companyId) return sessionUser.companyId
  // Fallback: look up company from user's email
  if (sessionUser?.email) {
    const user = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { companyId: true },
    })
    return user?.companyId || null
  }
  return null
}

const createSchema = z.object({
  companyId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(['FULL_TIME','PART_TIME','CONTRACT','INTERN','FREELANCE']).optional(),
  startDate: z.string().optional(),
  managerId: z.string().optional(),
  salary: z.number().optional(),
  salaryCurrency: z.string().optional(),
  salaryPeriod: z.enum(['MONTHLY','ANNUAL','HOURLY','DAILY']).optional(),
  gender: z.enum(['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY']).optional(),
  nationalId: z.string().optional(),
  bankIban: z.string().optional(),
  bankName: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRel: z.string().optional(),
})

// GET /api/employees?search=xxx&department=xxx&status=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  if (!user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

  const companyId = await getCompanyId(user)
  if (!companyId) return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const department = searchParams.get('department')
  const status = searchParams.get('status')
  const managerId = searchParams.get('managerId')

  const where: any = {
    companyId,
    ...(status ? { status } : {}),
    ...(department ? { department } : {}),
    ...(managerId !== null ? { managerId: managerId === 'null' ? null : managerId } : {}),
    ...(search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ]
    } : {}),
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        reports: { select: { id: true, firstName: true, lastName: true, jobTitle: true, avatarUrl: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
    prisma.employee.count({ where }),
  ])

  // Get department stats
  const deptStats = await prisma.employee.groupBy({
    by: ['department'],
    where: { companyId, status: 'ACTIVE' },
    _count: true,
  })

  return NextResponse.json({ employees, total, deptStats })
}

// POST /api/employees
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any
    if (!user) return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })

    const companyId = await getCompanyId(user)
    if (!companyId) return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 400 })

    const body = await req.json()
    const data = createSchema.parse(body)

    // Use session companyId, ignore any companyId from body
    const resolvedCompanyId = companyId

    // Check duplicate email within company
    const existing = await prisma.employee.findUnique({
      where: { companyId_email: { companyId: resolvedCompanyId, email: data.email } }
    })
    if (existing) return NextResponse.json({ error: 'Bu e-posta zaten kayıtlı' }, { status: 409 })

    // Auto-assign employee number
    const count = await prisma.employee.count({ where: { companyId: resolvedCompanyId } })
    const employeeNumber = `EMP-${String(count + 1).padStart(4, '0')}`

    const { companyId: _ignore, ...employeeData } = data
    const employee = await prisma.employee.create({
      data: {
        ...employeeData,
        companyId: resolvedCompanyId,
        employeeNumber,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true } },
      }
    })

    return NextResponse.json(employee, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') return NextResponse.json({ error: 'Geçersiz veri', details: e.errors }, { status: 400 })
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
