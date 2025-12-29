// Centralized timer-related interfaces used by API routes
export type TimerPauseRow = {
  id: string
  sessionId: string
  startedAt: Date
  endedAt: Date | null
}

export type TimerStopRow = {
  id: string
  sessionId: string
  stoppedAt: Date
}

export type TimerPauseDTO = {
  id: string
  startAt: string
  endAt: string | null
}

export type TimerStopDTO = {
  id: string
  stopAt: string
}