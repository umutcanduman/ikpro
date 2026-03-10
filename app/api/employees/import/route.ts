// app/api/employees/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/employees/import
// Body: { companyId: string, rows: Array<raw csv row objects> }
export async function POST(req: NextRequest) {
  try {
    const { companyId, rows } = await req.json()
    if (!companyId || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'companyId ve rows gerekli' }, { status: 400 })
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] }

    const existingCount = await prisma.employee.count({ where: { companyId } })
    let counter = existingCount

    for (const row of rows) {
      const email = row.email?.trim()
      const firstName = row.firstName?.trim() || row['Ad']?.trim()
      const lastName = row.lastName?.trim() || row['Soyad']?.trim()

      if (!email || !firstName || !lastName) {
        results.errors.push(`Eksik zorunlu alan: ${JSON.stringify(row)}`)
        results.skipped++
        continue
      }

      // Check duplicate
      const exists = await prisma.employee.findUnique({
        where: { companyId_email: { companyId, email } }
      })
      if (exists) {
        results.skipped++
        continue
      }

      counter++
      const employeeNumber = `EMP-${String(counter).padStart(4, '0')}`

      await prisma.employee.create({
        data: {
          companyId,
          employeeNumber,
          firstName,
          lastName,
          email,
          phone: row.phone?.trim() || row['Telefon']?.trim() || null,
          jobTitle: row.jobTitle?.trim() || row['Görev']?.trim() || null,
          department: row.department?.trim() || row['Departman']?.trim() || null,
          startDate: row.startDate || row['İşe Başlama']
            ? new Date(row.startDate || row['İşe Başlama'])
            : null,
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
        }
      })
      results.created++
    }

    return NextResponse.json(results)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'İçe aktarma başarısız' }, { status: 500 })
  }
}
