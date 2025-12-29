import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getUserIdFromCookie(req: Request): number | null {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = verifyToken<{ uid: number | string }>(token)
  if (!payload) return null
  const uid = payload.uid
  return typeof uid === 'string' ? (uid === 'demo' ? null : parseInt(uid, 10)) : uid
}

export async function GET(req: Request) {
  const userId = getUserIdFromCookie(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Use Prisma Client if the UserProfile model exists; otherwise fall back to raw SQL.
  type UserProfileRow = {
    id: number
    userId: number
    dob: Date | null
    profileImageUrl: string | null
    bio: string | null
    timezone: string | null
    createdAt: Date
    updatedAt: Date
  }
  let profile: UserProfileRow | null = null
  const maybeProfile = prisma as unknown as { userProfile?: { findUnique?: (args: { where: { userId: number } }) => Promise<UserProfileRow | null> } }
  if (maybeProfile.userProfile?.findUnique) {
    profile = await maybeProfile.userProfile.findUnique({ where: { userId } })
  } else {
    const rows = (await prisma.$queryRaw`SELECT id, userId, dob, profileImageUrl, bio, timezone, createdAt, updatedAt FROM UserProfile WHERE userId = ${userId} LIMIT 1`) as unknown as UserProfileRow[]
    profile = Array.isArray(rows) && rows.length ? rows[0] : null
  }

  return NextResponse.json({
    user: {
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      plan: user.plan,
    },
    profile: profile || null,
  })
}

export async function PUT(req: Request) {
  const userId = getUserIdFromCookie(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  // Allow updating gender on User and optional profile fields
  const { gender, dob, profileImageUrl, bio, timezone, phone, goals, goalsTargetDate, interests, hobbies } = body || {}

  if (gender !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { gender } })
  }
  if (phone !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { phone } })
  }

  // Merge structured extras into bio JSON to avoid schema migration for now
  const bioJson = JSON.stringify({
    bioText: bio ?? null,
    goals: Array.isArray(goals) ? goals : [],
    goalsTargetDate: goalsTargetDate ?? null,
    interests: Array.isArray(interests) ? interests : [],
    hobbies: Array.isArray(hobbies) ? hobbies : [],
  })

  // Upsert profile via Prisma if available; otherwise use a safe SQL upsert.
  let updatedProfile: UserProfileRow | null = null
  const maybeUpsert = prisma as unknown as { userProfile?: { upsert?: (args: unknown) => Promise<UserProfileRow> } }
  if (maybeUpsert.userProfile?.upsert) {
    updatedProfile = await maybeUpsert.userProfile.upsert({
      where: { userId },
      update: {
        dob: dob ? new Date(dob) : undefined,
        profileImageUrl: profileImageUrl ?? undefined,
        bio: bioJson,
        timezone: timezone ?? undefined,
      },
      create: {
        userId,
        dob: dob ? new Date(dob) : undefined,
        profileImageUrl: profileImageUrl ?? undefined,
        bio: bioJson,
        timezone: timezone ?? undefined,
      },
    })
  } else {
    const dobDate = dob ? new Date(dob) : null
    const pic = profileImageUrl ?? null
    const bioText = bioJson
    const tz = timezone ?? null
    // MySQL upsert using ON DUPLICATE KEY UPDATE on unique(userId)
    await prisma.$executeRaw`INSERT INTO UserProfile (userId, dob, profileImageUrl, bio, timezone)
      VALUES (${userId}, ${dobDate}, ${pic}, ${bioText}, ${tz})
      ON DUPLICATE KEY UPDATE dob = VALUES(dob), profileImageUrl = VALUES(profileImageUrl), bio = VALUES(bio), timezone = VALUES(timezone)`
    const rows = (await prisma.$queryRaw`SELECT id, userId, dob, profileImageUrl, bio, timezone, createdAt, updatedAt FROM UserProfile WHERE userId = ${userId} LIMIT 1`) as unknown as UserProfileRow[]
    updatedProfile = Array.isArray(rows) && rows.length ? rows[0] : null
  }

  return NextResponse.json({ ok: true, profile: updatedProfile })
}