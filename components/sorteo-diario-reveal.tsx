"use client"

import { useEffect, useRef, useState } from "react"
import { Gift, Trophy, X, Shuffle } from "lucide-react"
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

// Duración de la mezcla (ms) antes de la cuenta regresiva
const DURACION_MEZCLA = 5000
// Desde qué número arranca la cuenta regresiva
const CUENTA_INICIAL = 5

type Fase = "listo" | "mezclando" | "conteo" | "revelado"

const COLORES_CONFETTI = ["#d4af37", "#f5d77a", "#c0c0c0", "#ffffff", "#e8c65b"]

export function SorteoDiarioReveal({
  open,
  reelNombres,
  resultado,
  mostrarTotal = false,
  onClose,
}: Props) {
  const [fase, setFase] = useState<Fase>("listo")
  const [display, setDisplay] = useState("")
  const [cuenta, setCuenta] = useState<number | null>(null)

  const cicloRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])
  const resultadoRef = useRef(resultado)

  useEffect(() => {
    resultadoRef.current = resultado
  }, [resultado])

  const nombres = reelNombres.length > 0 ? reelNombres : ["—"]
  const nombresRef = useRef(nombres)
  useEffect(() => {
    nombresRef.current = reelNombres.length > 0 ? reelNombres : ["—"]
  }, [reelNombres])

  const limpiarTimers = () => {
    if (cicloRef.current) {
      clearInterval(cicloRef.current)
      cicloRef.current = null
    }
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setFase("listo")
      setDisplay("")
      setCuenta(null)
    } else {
      limpiarTimers()
    }
    return () => limpiarTimers()
  }, [open])

  const arrancarCiclo = (intervalo: number) => {
    if (cicloRef.current) clearInterval(cicloRef.current)
    cicloRef.current = window.setInterval(() => {
      const lista = nombresRef.current
      setDisplay(lista[Math.floor(Math.random() * lista.length)])
    }, intervalo)
  }

  const revelar = () => {
    const res = resultadoRef.current
    // Si el ganador todavía no llegó (raro), esperamos un toque
    if (!res?.ganador_nombre) {
      const t = window.setTimeout(revelar, 200)
      timersRef.current.push(t)
      return
    }
    limpiarTimers()
    setCuenta(null)
    setDisplay(res.ganador_nombre)
    setFase("revelado")
  }

  const iniciarConteo = () => {
    setFase("conteo")
    arrancarCiclo(90) // sigue ciclando detrás del número
    let n = CUENTA_INICIAL
    setCuenta(n)
    const paso = () => {
      n -= 1
      if (n >= 1) {
        setCuenta(n)
        timersRef.current.push(window.setTimeout(paso, 1000))
      } else {
        revelar()
      }
    }
    timersRef.current.push(window.setTimeout(paso, 1000))
  }

  const revolver = () => {
    setFase("mezclando")
    arrancarCiclo(65)
    timersRef.current.push(window.setTimeout(iniciarConteo, DURACION_MEZCLA))
  }

  if (!open) return null

  const enProceso = fase === "mezclando" || fase === "conteo"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      {/* Confetti (solo al revelar) */}
      {fase === "revelado" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 70 }).map((_, i) => (
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

      {/* Cerrar: solo antes de arrancar */}
      {fase === "listo" && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 transition-colors hover:text-white/80"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
      )}

      <div className="relative w-full max-w-xl text-center">
        {/* Encabezado */}
        <div className="mb-8 flex items-center justify-center gap-2 text-[#d4af37]">
          <Gift className={`h-5 w-5 ${enProceso ? "sd-spin" : ""}`} />
          <p className="text-xs font-semibold uppercase tracking-[0.3em]">
            {fase === "listo" && "Regalo del día"}
            {fase === "mezclando" && "Mezclando participantes..."}
            {fase === "conteo" && "¡Preparate!"}
            {fase === "revelado" && "¡Tenemos ganador!"}
          </p>
        </div>

        {/* Premio */}
        {resultado?.premio && (
          <p className="mb-8 text-2xl font-semibold text-white/90 md:text-3xl">
            {resultado.premio}
          </p>
        )}

        {/* LISTO: botón Revolver */}
        {fase === "listo" && (
          <button
            type="button"
            onClick={revolver}
            className="sd-pulse mx-auto inline-flex items-center gap-3 rounded-full bg-[#d4af37] px-10 py-5 text-lg font-bold text-black transition-transform hover:scale-105"
          >
            <Shuffle className="h-6 w-6" />
            Revolver
          </button>
        )}

        {/* MEZCLANDO: ruleta de nombres */}
        {fase === "mezclando" && (
          <div className="mx-auto flex min-h-[120px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-8">
            <span className="break-words text-3xl font-bold leading-tight text-white/70 md:text-4xl">
              {display || "..."}
            </span>
          </div>
        )}

        {/* CONTEO: número gigante + nombres ciclando de fondo */}
        {fase === "conteo" && (
          <div className="flex flex-col items-center">
            <span
              key={cuenta}
              className="sd-count font-lux text-8xl font-bold text-[#f5d77a] md:text-9xl"
            >
              {cuenta}
            </span>
            <span className="mt-4 break-words text-lg text-white/30 md:text-xl">
              {display}
            </span>
          </div>
        )}

        {/* REVELADO: ganador */}
        {fase === "revelado" && (
          <>
            <div className="sd-pop mx-auto flex min-h-[120px] items-center justify-center rounded-2xl border border-[#d4af37] bg-[#d4af37]/10 px-6 py-8 shadow-[0_0_60px_rgba(212,175,55,0.35)]">
              <span className="break-words text-4xl font-bold leading-tight text-[#f5d77a] md:text-5xl">
                {display || "..."}
              </span>
            </div>

            {resultado?.ganador_numero != null && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#d4af37]/40 bg-black/40 px-4 py-1.5">
                <Trophy className="h-4 w-4 text-[#d4af37]" />
                <span className="font-mono text-lg font-bold text-[#f5d77a]">
                  {resultado.ganador_numero}
                </span>
              </div>
            )}

            {mostrarTotal && resultado && (
              <p className="mt-6 text-sm text-white/50">
                Elegido al azar entre{" "}
                <span className="font-semibold text-white/80">
                  {resultado.total_participantes}
                </span>{" "}
                comprador{resultado.total_participantes === 1 ? "" : "es"} del día
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-8 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </>
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
        @keyframes sd-spin { to { transform: rotate(360deg); } }
        .sd-spin { animation: sd-spin 0.6s linear infinite; }
        @keyframes sd-pop {
          0% { transform: scale(0.85); }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .sd-pop { animation: sd-pop 0.5s ease-out; }
        @keyframes sd-count {
          0% { transform: scale(1.6); opacity: 0; }
          40% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0.6; }
        }
        .sd-count { display: inline-block; animation: sd-count 1s ease-out; }
        @keyframes sd-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5); }
          50% { box-shadow: 0 0 0 18px rgba(212,175,55,0); }
        }
        .sd-pulse { animation: sd-pulse 1.8s ease-out infinite; }
      `}</style>
    </div>
  )
}
