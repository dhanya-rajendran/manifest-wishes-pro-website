import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  const { phone } = await request.json().catch(() => ({}))
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.phoneVerificationCode.deleteMany({ where: { userId: user.id } })

  const code = String(Math.floor(100000 + Math.random() * 900000)) // 6-digit
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10) // 10 min
  await prisma.phoneVerificationCode.create({
    data: { id: crypto.randomUUID(), userId: user.id, code, expiresAt },
  })

  // Placeholder SMS sending
  console.log('[phone:verify] Send code to', phone, 'code:', code)

  return NextResponse.json({ ok: true })
}