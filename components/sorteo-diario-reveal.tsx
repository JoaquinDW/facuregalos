"use client"

import { useEffect, useRef, useState } from "react"
import { Gift, Trophy, X } from "lucide-react"
import type { SorteoDiario } from "@/lib/supabase"

interface Props {
  open: boolean
  /** Nombres de los participantes reales, para el ciclado */
  reelNombres: string[]
  /** Resultado del sorteo. null mientras se está sorteando; se setea al terminar */
  resultado: SorteoDiario | null
  /** Mostrar "elegido entre N compradores" (default: no) */
  mostrarTotal?: boolean
  onClose: () => void
}

// Cantidad de "vueltas" rápidas antes de empezar a desacelerar
const PASOS_RAPIDOS = 24
// Cantidad de pasos de desaceleración (efecto ruleta que frena)
const PASOS_FRENADO = 16

function delayParaPaso(paso: number): number {
  if (paso < PASOS_RAPIDOS) return 55
  const i = paso - PASOS_RAPIDOS
  return Math.min(70 + i * 24, 420)
}

const COLORES_CONFETTI = ["#d4af37", "#f5d77a", "#c0c0c0", "#ffffff", "#e8c65b"]

export function SorteoDiarioReveal({ open, reelNombres, resultado, mostrarTotal = false, onClose }: Props) {
  const [display, setDisplay] = useState("")
  const [revelado, setRevelado] = useState(false)
  const resultadoRef = useRef(resultado)

  useEffect(() => {
    resultadoRef.current = resultado
  }, [resultado])

  useEffect(() => {
    if (!open) {
      setRevelado(false)
      setDisplay("")
      return
    }

    let cancelado = false
    setRevelado(false)
    const nombres = reelNombres.length > 0 ? reelNombres : ["—"]
    let paso = 0

    const tick = () => {
      if (cancelado) return
      const res = resultadoRef.current
      const frenadoCompleto = paso >= PASOS_RAPIDOS + PASOS_FRENADO

      // Solo revelamos cuando terminó la desaceleración Y el ganador ya está listo
      if (frenadoCompleto && res?.ganador_nombre) {
        setDisplay(res.ganador_nombre)
        setRevelado(true)
        return
      }

      setDisplay(nombres[Math.floor(Math.random() * nombres.length)])
      paso++
      window.setTimeout(tick, delayParaPaso(paso))
    }

    tick()
    return () => {
      cancelado = true
    }
  }, [open, reelNombres])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      {/* Confetti (solo al revelar) */}
      {revelado && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="sd-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                background: COLORES_CONFETTI[i % COLORES_CONFETTI.length],
                animationDelay: `${Math.random() * 0.6}s`,
                animationDuration: `${2 + Math.random() * 1.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative w-full max-w-lg text-center">
        {/* Encabezado */}
        <div className="mb-8 flex items-center justify-center gap-2 text-[#d4af37]">
          <Gift className={`h-5 w-5 ${revelado ? "" : "sd-spin"}`} />
          <p className="text-xs font-semibold uppercase tracking-[0.3em]">
            {revelado ? "¡Tenemos ganador!" : "Regalando en vivo..."}
          </p>
        </div>

        {/* Premio */}
        {resultado?.premio && (
          <p className="mb-6 text-2xl font-semibold text-white/90">
            {resultado.premio}
          </p>
        )}

        {/* Nombre (ruleta / ganador) */}
        <div
          className={`mx-auto flex min-h-[120px] items-center justify-center rounded-2xl border px-6 py-8 transition-all duration-500 ${
            revelado
              ? "sd-pop border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_60px_rgba(212,175,55,0.35)]"
              : "border-white/15 bg-white/5"
          }`}
        >
          <span
            className={`break-words font-bold leading-tight ${
              revelado
                ? "text-4xl text-[#f5d77a] md:text-5xl"
                : "text-3xl text-white/70 md:text-4xl"
            }`}
          >
            {display || "..."}
          </span>
        </div>

        {/* Número ganador */}
        {revelado && resultado?.ganador_numero != null && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d4af37]/40 bg-black/40 px-4 py-1.5">
            <Trophy className="h-4 w-4 text-[#d4af37]" />
            <span className="font-mono text-lg font-bold text-[#f5d77a]">
              {resultado.ganador_numero}
            </span>
          </div>
        )}

        {/* Entre cuántos se eligió (opcional, se activa en el backoffice) */}
        {mostrarTotal && resultado && (
          <p className="mt-6 text-sm text-white/50">
            Elegido al azar entre{" "}
            <span className="font-semibold text-white/80">
              {resultado.total_participantes}
            </span>{" "}
            comprador{resultado.total_participantes === 1 ? "" : "es"} del día
          </p>
        )}

        {/* Cerrar (solo tras revelar) */}
        {revelado && (
          <button
            type="button"
            onClick={onClose}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
          >
            <X className="h-4 w-4" />
            Cerrar
          </button>
        )}
      </div>

      {/* Animaciones (sin dependencias externas) */}
      <style>{`
        @keyframes sd-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.9; }
        }
        .sd-confetti {
          position: absolute;
          top: -10vh;
          width: 9px;
          height: 14px;
          border-radius: 2px;
          animation-name: sd-fall;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
        @keyframes sd-spin {
          to { transform: rotate(360deg); }
        }
        .sd-spin { animation: sd-spin 0.6s linear infinite; }
        @keyframes sd-pop {
          0% { transform: scale(0.85); }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .sd-pop { animation: sd-pop 0.5s ease-out; }
      `}</style>
    </div>
  )
}
