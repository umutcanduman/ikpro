// app/api/payroll/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Turkish payroll constants (2024)
const SGK_EMPLOYEE_RATE = 0.14   // 14%
const SGK_EMPLOYER_RATE = 0.205  // 20.5%
const STAMP_TAX_RATE = 0.00759   // 0.759%
// Income tax brackets (monthly, TRY)
const TAX_BRACKETS = [
  { limit: 70000,  rate: 0.15 },
  { limit: 150000, rate: 0.20 },
  { limit: 550000, rate: 0.27 },
  { limit: 1900000,rate: 0.35 },
  { limit: Infinity,rate: 0.40 },
]

function calcIncomeTax(taxableIncome: number): number {
  let tax = 0
  let remaining = taxableIncome
  let prev = 0
  for (const bracket of TAX_BRACKETS) {
    const chunk = Math.min(remaining, bracket.limit - prev)
    if (chunk <= 0) break
    tax += chunk * bracket.rate
    remaining -= chunk
    prev = bracket.limit
    if (remaining <= 0) break
  }
  return Math.round(tax * 100) / 100
}

function calcPayslip(grossSalary: number) {
  const sgkEmployee = Math.round(grossSalary * SGK_EMPLOYEE_RATE * 100) / 100
  const sgkEmployer = Math.round(grossSalary * SGK_EMPLOYER_RATE * 100) / 100
  const taxableIncome = grossSalary - sgkEmployee
  const incomeTax = calcIncomeTax(taxableIncome)
  const stampTax = Math.round(grossSalary * STAMP_TAX_RATE * 100) / 100
  const netSalary = Math.round((grossSalary - sgkEmployee - incomeTax - stampTax) * 100) / 100
  return { sgkEmployee, sgkEmployer, incomeTax, stampTax, netSalary }
}

// GET /api/payroll?companyId=
export async function GET(req: NextRequest) {
  const companyId = new URL(req.url).searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 })
  const runs = await prisma.payrollRun.findMany({
    where: { companyId },
    orderBy: { period: 'desc' },
    include: { _count: { select: { payslips: true } } }
  })
  return NextResponse.json(runs)
}

// POST /api/payroll - create a new payroll run
export async function POST(req: NextRequest) {
  try {
    const { companyId, period } = await req.json()

    // Check if run already exists
    const existing = await prisma.payrollRun.findUnique({ where: { companyId_period: { companyId, period } } })
    if (existing) return NextResponse.json({ error: 'Bu dönem için bordro zaten oluşturulmuş' }, { status: 409 })

    // Get all active employees with salary
    const employees = await prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE', salary: { not: null } }
    })

    if (employees.length === 0) {
      return NextResponse.json({ error: 'Maaş girişi yapılmış aktif çalışan yok' }, { status: 400 })
    }

    let totalGross = 0, totalNet = 0, totalSgk = 0, totalTax = 0

    const payrollRun = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: { companyId, period, status: 'PROCESSING', employeeCount: employees.length }
      })

      for (const emp of employees) {
        const gross = emp.salary!
        const { sgkEmployee, sgkEmployer, incomeTax, stampTax, netSalary } = calcPayslip(gross)

        await tx.payslip.create({
          data: {
            payrollRunId: run.id,
            employeeId: emp.id,
            grossSalary: gross,
            sgkEmployee,
            sgkEmployer,
            incomeTax,
            stampTax,
            netSalary,
          }
        })
        totalGross += gross
        totalNet += netSalary
        totalSgk += sgkEmployee + sgkEmployer
        totalTax += incomeTax + stampTax
      }

      return tx.payrollRun.update({
        where: { id: run.id },
        data: {
          status: 'PROCESSED',
          totalGross: Math.round(totalGross * 100) / 100,
          totalNet: Math.round(totalNet * 100) / 100,
          totalSgk: Math.round(totalSgk * 100) / 100,
          totalTax: Math.round(totalTax * 100) / 100,
          processedAt: new Date(),
        }
      })
    })

    return NextResponse.json(payrollRun, { status: 201 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Bordro oluşturulamadı' }, { status: 500 })
  }
}
