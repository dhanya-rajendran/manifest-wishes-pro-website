import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const formData = await request.formData()
  const name = String(formData.get('name') || '')
  const email = String(formData.get('email') || '')
  const message = String(formData.get('message') || '')
  if (!name || !email || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await prisma.contactMessage.create({ data: { name, email, message } })
  return NextResponse.redirect(new URL('/contact', request.url))
}