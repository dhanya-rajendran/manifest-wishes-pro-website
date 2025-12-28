import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  const clientId = process.env.FACEBOOK_APP_ID
  const clientSecret = process.env.FACEBOOK_APP_SECRET
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Facebook OAuth not configured' }, { status: 500 })
  }

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  // Exchange code for access token
  const tokenResp = await fetch('https://graph.facebook.com/v17.0/oauth/access_token?' + new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  }), {
    method: 'GET',
  })

  if (!tokenResp.ok) {
    const err = await tokenResp.text()
    return NextResponse.json({ error: 'Token exchange failed', details: err }, { status: 400 })
  }

  const tokenData = await tokenResp.json()
  const accessToken = tokenData.access_token as string

  // Fetch user info
  const userResp = await fetch('https://graph.facebook.com/me?fields=id,name,email', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!userResp.ok) {
    const err = await userResp.text()
    return NextResponse.json({ error: 'Failed to fetch user info', details: err }, { status: 400 })
  }

  const profile = (await userResp.json()) as { email?: string; name?: string; id?: string }
  const email = profile.email || (profile.id ? `facebook_${profile.id}@facebook.local` : '')

  if (!email) {
    return NextResponse.json({ error: 'No email from Facebook' }, { status: 400 })
  }

  // Upsert user
  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const passwordHash = await hashPassword('oauth_facebook')
    user = await prisma.user.create({
      data: { email, name: profile.name || 'Facebook User', password: passwordHash, plan: 'free' },
    })
  }

  const token = signToken({ uid: user.id, email: user.email })
  const res = NextResponse.redirect(new URL('/dashboard', url.origin))
  res.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}