// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where: any = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const currentUser = session?.user as any

  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })
    }

    // Prevent modifying other super admins
    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (targetUser?.role === 'SUPER_ADMIN' && id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Diğer süper adminleri değiştiremezsiniz' },
        { status: 403 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updatedUser)
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
