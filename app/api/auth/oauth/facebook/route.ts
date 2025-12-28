import { NextResponse } from 'next/server'

const FB_AUTH_URL = 'https://www.facebook.com/v17.0/dialog/oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')

  const clientId = process.env.FACEBOOK_APP_ID
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Facebook OAuth not configured' }, { status: 500 })
  }

  if (!code) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
    })
    const authUrl = `${FB_AUTH_URL}?${params.toString()}`
    return NextResponse.redirect(authUrl)
  }

  return NextResponse.redirect(`${redirectUri}?code=${code}`)
}