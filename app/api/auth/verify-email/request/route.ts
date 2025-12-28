import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Clean up existing tokens
  await (prisma as any).emailVerificationToken.deleteMany({ where: { userId: user.id } })

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
  await (prisma as any).emailVerificationToken.create({
    data: { id: crypto.randomUUID(), userId: user.id, token, expiresAt },
  })

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/verify-email/confirm?token=${token}`
  // Placeholder email sending
  console.log('[email:verify] Send link to', email, 'url:', verifyUrl)

  return NextResponse.json({ ok: true })
}