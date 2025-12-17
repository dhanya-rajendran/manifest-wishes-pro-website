"use client"
import React from 'react'
import { Toast } from '@base-ui/react/toast'

type ReToastViewportProps = {
  manager: ReturnType<typeof Toast.createToastManager>
}

export function ReToastViewport({ manager }: ReToastViewportProps) {
  function ToastStack() {
    const { toasts } = Toast.useToastManager()
    return (
      <Toast.Viewport className="pointer-events-auto fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => {
          const tone = t.type === 'success' ? 'bg-green-600 text-white border-green-700' : t.type === 'error' ? 'bg-red-600 text-white border-red-700' : 'bg-gray-800 text-white border-gray-900'
          return (
            <Toast.Root key={t.id} toast={t} className={`rounded-md border shadow-lg ${tone}`}>
              <Toast.Content className="px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Toast.Title className="text-sm" />
                    <Toast.Description className="text-xs opacity-90" />
                  </div>
                  <Toast.Close aria-label="Close" className="rounded border border-white/30 px-2 py-1 text-xs hover:bg-white/20" />
                </div>
              </Toast.Content>
            </Toast.Root>
          )
        })}
      </Toast.Viewport>
    )
  }

  return (
    <Toast.Provider toastManager={manager}>
      <Toast.Portal>
        <ToastStack />
      </Toast.Portal>
    </Toast.Provider>
  )
}