"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface RevealProps {
  children: ReactNode
  className?: string
  variant?: "up" | "left" | "right" | "scale"
  delay?: number
}

const VARIANT_CLASS: Record<NonNullable<RevealProps["variant"]>, string> = {
  up: "reveal",
  left: "reveal reveal-left",
  right: "reveal reveal-right",
  scale: "reveal reveal-scale",
}

// Revela el contenido con una transición suave cuando entra al viewport.
// El CSS (.reveal en globals.css) respeta prefers-reduced-motion.
export function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(VARIANT_CLASS[variant], visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
