"use client"
import React from 'react'

type ToastProps = {
  message: string
  type?: 'success' | 'error'
  onClose?: () => void
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600'
  const border = type === 'success' ? 'border-green-700' : 'border-red-700'
  return (
    <div className={`fixed right-4 bottom-4 z-[60] rounded-md ${bg} ${border} border px-4 py-2 text-sm text-white shadow-lg`}
      role="alert">
      <div className="flex items-center gap-3">
        <span>{message}</span>
        {onClose && (
          <button
            aria-label="Close"
            className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/20"
            onClick={onClose}
          >Close</button>
        )}
      </div>
    </div>
  )
}