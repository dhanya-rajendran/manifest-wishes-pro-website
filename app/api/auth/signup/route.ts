import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request: Request) {
  const { email, password, name, phone, gender } = await request.json()
  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email in use' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  // Construct create data while avoiding TS literal type errors if Prisma types are outdated.
  const data: any = {
    email,
    password: passwordHash,
    name,
    plan: 'free',
    emailVerified: false,
    phoneVerified: false,
    ...(typeof phone === 'string' && phone.trim() ? { phone: phone.trim() } : {}),
    ...(typeof gender === 'string' && gender.trim() ? { gender: gender.trim() } : {}),
  }

  const user = await prisma.user.create({ data })

  // Ensure Free plan exists
  const freePlan = await (prisma as any).subscriptionPlan.upsert({
    where: { key: 'free' },
    update: {},
    create: {
      key: 'free',
      name: 'Free',
      priceMonthlyCents: 0,
      priceYearlyCents: 0,
      limits: {
        gratitudeEntriesMax: 50,
        tasksMax: 100,
        visionItemsMax: 10,
        method369DailyMax: 9,
      },
      permissions: {
        dashboardAccess: true,
        premiumThemes: false,
        prioritySupport: false,
      },
    },
  })

  // Attach subscription to Free plan
  await (prisma as any).userSubscription.create({
    data: {
      userId: user.id,
      planId: freePlan.id,
      status: 'active',
    },
  })

  // Create email verification token and (placeholder) send link
  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
  await (prisma as any).emailVerificationToken.create({
    data: { id: crypto.randomUUID(), userId: user.id, token, expiresAt },
  })
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/auth/verify-email/confirm?token=${token}`
  console.log('[signup] email verify link:', verifyUrl)

  // Do not auto-login; require email verification first
  return NextResponse.json({ ok: true, message: 'Verification email sent. Please check your inbox.' })
}