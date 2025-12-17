import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function getUserId(request: Request): number | null {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = verifyToken<{ uid: string | number }>(token)
  if (!payload || payload.uid === 'demo') return null
  return Number(payload.uid)
}
export async function POST(request: Request) {
  try {
    const userId = getUserId(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let json: unknown
    try { json = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
    const body = json as { sessionId: string; note?: string | null; plannedMinutes?: number | null }
    const { sessionId, note, plannedMinutes } = body

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, targetEnd: true },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const data: { note?: string | null; plannedMinutes?: number | null } = {}
    if (typeof note !== "undefined") data.note = note
    if (typeof plannedMinutes !== "undefined" && plannedMinutes !== null) data.plannedMinutes = plannedMinutes

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updated = await prisma.focusSession.update({
      where: { id: sessionId },
      data,
      select: { id: true, note: true, plannedMinutes: true },
    })

    return NextResponse.json({ ok: true, session: updated })
  } catch (err) {
    console.error("/api/timer/update error", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}