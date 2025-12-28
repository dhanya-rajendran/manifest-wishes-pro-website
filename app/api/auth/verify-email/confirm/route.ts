import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const record = await (prisma as any).emailVerificationToken.findUnique({ where: { token } })
  if (!record) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  if (record.expiresAt < new Date()) {
    await (prisma as any).emailVerificationToken.delete({ where: { token } })
    return NextResponse.json({ error: 'Token expired' }, { status: 400 })
  }

  await (prisma as any).user.update({ where: { id: record.userId }, data: ({ emailVerified: true } as any) })
  await (prisma as any).emailVerificationToken.delete({ where: { token } })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard`)
}