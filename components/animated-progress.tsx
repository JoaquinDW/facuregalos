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
        "relative w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800",
        className
      )}
    >
      <div
        className="h-full bg-[#ff0040] rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}
