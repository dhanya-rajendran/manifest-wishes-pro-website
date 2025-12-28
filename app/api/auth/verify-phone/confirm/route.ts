import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const { phone, code } = await request.json().catch(() => ({}))
  if (!phone || !code) return NextResponse.json({ error: 'Phone and code required' }, { status: 400 })
  // Use findFirst to avoid relying on Prisma unique input for phone when types may be outdated
  const user = await prisma.user.findFirst({ where: { phone } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const record = await (prisma as any).phoneVerificationCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
  if (!record) return NextResponse.json({ error: 'No code found' }, { status: 400 })
  if (record.expiresAt < new Date()) return NextResponse.json({ error: 'Code expired' }, { status: 400 })
  if (record.code !== code) {
    await (prisma as any).phoneVerificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } })
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  await (prisma as any).user.update({ where: { id: user.id }, data: { phoneVerified: true } as any })
  await (prisma as any).phoneVerificationCode.delete({ where: { id: record.id } })
  return NextResponse.json({ ok: true })
}