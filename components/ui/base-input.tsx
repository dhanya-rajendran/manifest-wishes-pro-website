"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'border border-input shadow-xs shadow-black/5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 rounded-md h-8 px-2.5',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'