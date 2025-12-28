"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'sm' | 'md' | 'lg'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: Variant
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'md', ...props }, ref) => {
    const sizeClasses =
      variant === 'sm'
        ? 'h-8 px-2.5 text-sm'
        : variant === 'lg'
        ? 'h-11 px-3.5 text-base'
        : 'h-10 px-3 text-sm'

    return (
      <input
        ref={ref}
        className={cn(
          'border border-input shadow-xs shadow-black/5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 rounded-md',
          sizeClasses,
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'