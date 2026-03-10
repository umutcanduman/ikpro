export const dynamic = 'force-dynamic'
// app/api/settings/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['COMPANY_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']),
})

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['COMPANY_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE']),
})

const deleteSchema = z.object({
  userId: z.string(),
})

// GET /api/settings/team - List users in company
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

    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(users)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// POST /api/settings/team - Invite new user
export async function POST(req: NextRequest) {
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
    const data = inviteSchema.parse(body)

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existing) {
      return NextResponse.json({ error: 'Bu e-posta adresi zaten kayıtlı' }, { status: 409 })
    }

    // Create user with temporary password
    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        companyId,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    // TODO: Send invitation email with temporary password

    return NextResponse.json(user, { status: 201 })
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Geçersiz veri', details: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// PATCH /api/settings/team - Update user role
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const currentRole = (session.user as any).role
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(currentRole)) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const companyId = (session.user as any).companyId
    const body = await req.json()
    const data = updateRoleSchema.parse(body)

    // Ensure the user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: { id: data.userId, companyId },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Cannot change own role
    if (data.userId === (session.user as any).id) {
      return NextResponse.json({ error: 'Kendi rolünüzü değiştiremezsiniz' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: data.userId },
      data: { role: data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json({ error: 'Geçersiz veri', details: e.errors }, { status: 400 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// DELETE /api/settings/team - Remove user from company
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const currentRole = (session.user as any).role
    if (!['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(currentRole)) {
      return NextResponse.json({ error: 'Yetkiniz yok' }, { status: 403 })
    }

    const companyId = (session.user as any).companyId
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId gerekli' }, { status: 400 })
    }

    // Cannot remove self
    if (userId === (session.user as any).id) {
      return NextResponse.json({ error: 'Kendinizi kaldıramazsınız' }, { status: 400 })
    }

    // Ensure the user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, companyId },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
