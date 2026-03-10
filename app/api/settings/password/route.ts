export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
  newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalı'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as any

    if (!user) {
      return NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 })
    }

    const body = await req.json()
    const data = passwordSchema.parse(body)

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser?.password) {
      return NextResponse.json(
        { error: 'Bu hesapta şifre ile giriş yapılamaz' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(data.currentPassword, dbUser.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Mevcut şifre yanlış' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { error: e.errors[0]?.message || 'Geçersiz veri' },
        { status: 400 }
      )
    }
    console.error('Şifre değiştirme hatası:', e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
