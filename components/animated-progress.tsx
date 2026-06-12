"use client"

import { cn } from "@/lib/utils"

interface AnimatedProgressProps {
  value: number
  className?: string
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
  return (
    <div
      className={cn(
        "relative w-full progress-lux-track rounded-full overflow-hidden",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full progress-lux-fill rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}
