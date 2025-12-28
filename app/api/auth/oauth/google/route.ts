import { NextResponse } from 'next/server'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  if (!code) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    })
    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`
    return NextResponse.redirect(authUrl)
  }

  // If a code is present, delegate to the callback route for clarity
  return NextResponse.redirect(`${redirectUri}?code=${code}`)
}