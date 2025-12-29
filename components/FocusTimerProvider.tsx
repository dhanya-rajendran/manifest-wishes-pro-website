"use client"
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type Mode = 'focus' | 'break'

type FocusTimerCtx = {
  running: boolean
  paused: boolean
  mode: Mode
  durationMin: number
  focusDurationMin: number
  breakDurationMin: number
  remaining: number
  note: string
  restoring: boolean
  setNote: (s: string) => void
  setMode: (m: Mode) => void
  setDurationMin: (n: number) => void
  setFocusDurationMin: (n: number) => void
  setBreakDurationMin: (n: number) => void
  start: () => Promise<void>
  pause: () => void
  resume: () => void
  stopAndSave: () => Promise<void>
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

function beep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.value = 880
    o.connect(g)
    g.connect(ctx.destination)
    g.gain.setValueAtTime(0.001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    o.start()
    o.stop(ctx.currentTime + 0.4)
  } catch { void 0 }
}

const FocusTimerContext = createContext<FocusTimerCtx | null>(null)

export function FocusTimerProvider({ children }: { children: React.ReactNode }) {
  const [running, setRunning] = useState<boolean>(false)
  const [paused, setPaused] = useState<boolean>(false)
  // Removed unused startTime state
  const [targetEnd, setTargetEnd] = useState<number | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [focusDurationMin, setFocusDurationMin] = useState<number>(25)
  const [breakDurationMin, setBreakDurationMin] = useState<number>(5)
  const [mode, setMode] = useState<Mode>('focus')
  const durationMin = mode === 'focus' ? focusDurationMin : breakDurationMin
  const [remaining, setRemaining] = useState<number>(durationMin * 60000)
  const [note, setNote] = useState<string>('')
  const [restoring, setRestoring] = useState<boolean>(true)
  const tickRef = useRef<number | null>(null)

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const onComplete = useCallback(async () => {
    clearTick()
    setRunning(false)
    setPaused(false)
    setRemaining(0)
    beep()
    try {
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          new Notification('Focus Time complete!', { body: `${durationMin} minutes done.` })
        } else if (Notification.permission === 'default') {
          await Notification.requestPermission()
        }
      }
    } catch { void 0 }
    try {
      if (sessionId) {
        await fetch('/api/timer/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId, stoppedAt: new Date().toISOString() }),
        })
      }
    } catch { void 0 }
  }, [clearTick, durationMin, sessionId])

  // Restore active session from server on mount
  useEffect(() => {
    let cancelled = false
    async function restore() {
      try {
        const res = await fetch('/api/timer/active', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        const sess = data.session as { id: string; startAt: string; endAt?: string | null; targetEnd?: string | null; note?: string | null; mode?: Mode; plannedMinutes?: number | null } | null
        if (!sess || cancelled) return
        setSessionId(sess.id)
        setMode(sess.mode ?? 'focus')
        setNote(sess.note ?? '')
        // Hydrate the duration slider from the session's planned minutes for the current mode
        if (typeof sess.plannedMinutes === 'number' && sess.plannedMinutes > 0) {
          if ((sess.mode ?? 'focus') === 'focus') {
            setFocusDurationMin(sess.plannedMinutes)
          } else {
            setBreakDurationMin(sess.plannedMinutes)
          }
        }
        const endTs = sess.targetEnd ? new Date(sess.targetEnd).getTime() : null
        // Treat a paused session as an active session (running=true, paused=true)
        const hasActive = !sess.endAt
        const runningNow = hasActive && !!endTs
        const pausedNow = hasActive && !endTs
        setRunning(hasActive)
        setPaused(pausedNow)
        setTargetEnd(endTs)
        const serverRem: number | undefined = typeof data.remainingMs === 'number' ? data.remainingMs : undefined
        const rem = endTs ? Math.max(0, endTs - Date.now()) : (serverRem ?? durationMin * 60000)
        setRemaining(rem)
        if (runningNow && endTs) {
          clearTick()
          tickRef.current = window.setInterval(() => {
            const r = Math.max(0, endTs - Date.now())
            setRemaining(r)
            if (r <= 0) {
              clearTick()
              onComplete()
            }
          }, 500)
        }
      } catch { void 0 }
      finally {
        if (!cancelled) setRestoring(false)
      }
    }
    void restore()
    return () => { cancelled = true; clearTick() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(async () => {
    if (running) return
    const now = Date.now()
    const end = now + durationMin * 60000
    try {
      const res = await fetch('/api/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ startAt: new Date(now).toISOString(), plannedMinutes: durationMin, targetEnd: new Date(end).toISOString(), mode, note })
      })
      if (!res.ok) return
      const data = await res.json()
      const sess = data.session as { id: string }
      setSessionId(sess.id)
    } catch { void 0 }
    setRunning(true)
    setPaused(false)
    // setStartTime(now) // removed – state no longer exists
    setTargetEnd(end)
    setRemaining(end - now)
    clearTick()
    tickRef.current = window.setInterval(() => {
      const r = Math.max(0, end - Date.now())
      setRemaining(r)
      if (r <= 0) {
        clearTick()
        onComplete()
      }
    }, 500)
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    } catch { void 0 }
  }, [clearTick, durationMin, mode, note, onComplete, running])

  const pause = useCallback(async () => {
    if (!running || paused) return
    clearTick()
    setPaused(true)
    const rem = targetEnd ? Math.max(0, targetEnd - Date.now()) : remaining
    setRemaining(rem)
    setTargetEnd(null)
    try {
      if (sessionId) {
        await fetch('/api/timer/pause', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ sessionId, startedAt: new Date().toISOString() })
        })
      }
    } catch { void 0 }
  }, [clearTick, paused, remaining, running, targetEnd, sessionId])

  const resume = useCallback(async () => {
    if (!running || !paused) return
    const now = Date.now()
    const end = now + remaining
    setPaused(false)
    setTargetEnd(end)
    clearTick()
    tickRef.current = window.setInterval(() => {
      const r = Math.max(0, end - Date.now())
      setRemaining(r)
      if (r <= 0) {
        clearTick()
        onComplete()
      }
    }, 500)
    try {
      if (sessionId) {
        await fetch('/api/timer/resume', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ sessionId, endedAt: new Date().toISOString(), targetEnd: new Date(end).toISOString() })
        })
      }
    } catch { void 0 }
  }, [clearTick, onComplete, paused, remaining, running, sessionId])

  const stopAndSave = useCallback(async () => {
    if (!running) return
    const now = Date.now()
    clearTick()
    setRunning(false)
    setPaused(false)
    setTargetEnd(null)
    setRemaining(0)
    try {
      if (sessionId) {
        await fetch('/api/timer/stop', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify({ sessionId, stoppedAt: new Date(now).toISOString() })
        })
      }
    } catch { void 0 }
  }, [clearTick, running, sessionId])

  // Persist updates to the active session
  const updateSession = useCallback(async (fields: { note?: string | null; plannedMinutes?: number | null }, opts?: { refreshAfter?: boolean }) => {
    try {
      if (!sessionId) return
      await fetch('/api/timer/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ sessionId, ...fields })
      })
      if (opts?.refreshAfter) {
        const res = await fetch('/api/timer/active', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const sess = data.session as { startAt: string; endAt?: string | null; targetEnd?: string | null; mode?: Mode; plannedMinutes?: number | null } | null
          if (sess) {
            const endTs = sess.targetEnd ? new Date(sess.targetEnd).getTime() : null
            const serverRem: number | undefined = typeof data.remainingMs === 'number' ? data.remainingMs : undefined
            setTargetEnd(endTs)
            setRemaining(endTs ? Math.max(0, endTs - Date.now()) : (serverRem ?? remaining))
            if (typeof sess.plannedMinutes === 'number' && sess.plannedMinutes > 0) {
              if ((sess.mode ?? 'focus') === 'focus') setFocusDurationMin(sess.plannedMinutes)
              else setBreakDurationMin(sess.plannedMinutes)
            }
          }
        }
      }
    } catch { void 0 }
  }, [remaining, sessionId])

  const value: FocusTimerCtx = {
    running,
    paused,
    mode,
    durationMin,
    focusDurationMin,
    breakDurationMin,
    remaining,
    note,
    restoring,
    setNote: (s: string) => {
      setNote(s)
      // Persist note edits during an active session (paused or running)
      if (sessionId && running) {
        void updateSession({ note: s })
      }
    },
    setMode: (m: Mode) => {
      if (running) return
      setMode(m)
      // Avoid resetting remaining during hydration/restore when a countdown exists or paused
      if (paused || targetEnd !== null) return
      const nextDur = m === 'focus' ? focusDurationMin : breakDurationMin
      setRemaining(nextDur * 60000)
    },
    setDurationMin: (n: number) => {
      // Allow editing while paused and persist
      if (!running || paused) {
        if (mode === 'focus') setFocusDurationMin(n)
        else setBreakDurationMin(n)
        if (!running && targetEnd === null) setRemaining(n * 60000)
        // If actively paused, persist plannedMinutes and refresh remaining from server
        if (sessionId && running && paused) {
          void updateSession({ plannedMinutes: n }, { refreshAfter: true })
        }
      }
    },
    setFocusDurationMin: (n: number) => {
      if (!running) {
        setFocusDurationMin(n)
        if (mode === 'focus' && !paused && targetEnd === null) setRemaining(n * 60000)
      }
    },
    setBreakDurationMin: (n: number) => {
      if (!running) {
        setBreakDurationMin(n)
        if (mode === 'break' && !paused && targetEnd === null) setRemaining(n * 60000)
      }
    },
    start,
    pause,
    resume,
    stopAndSave,
  }

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>
}

export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext)
  if (!ctx) throw new Error('useFocusTimer must be used within FocusTimerProvider')
  return ctx
}