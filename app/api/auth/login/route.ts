import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  // Demo login (no database required) for quick preview
  const demoEmail = 'demo@manifest.local'
  const demoPassword = 'demo12345'
  if (process.env.NODE_ENV !== 'production' && email === demoEmail && password === demoPassword) {
    const token = signToken({ uid: 'demo', email: demoEmail })
    const res = NextResponse.json({ ok: true, demo: true })
    res.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/' })
    return res
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const ok = await comparePassword(password, user.password)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const token = signToken({ uid: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('auth_token', token, { httpOnly: true, sameSite: 'lax', path: '/' })
  return res
}