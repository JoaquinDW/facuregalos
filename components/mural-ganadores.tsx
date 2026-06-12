"use client"

import { useState, useEffect, useRef } from "react"
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react"
import type { MuralGanador } from "@/lib/supabase"
import { obtenerMuralGanadores } from "@/lib/database"
import { Reveal } from "@/components/reveal"

export function MuralGanadores() {
  const [fotos, setFotos] = useState<MuralGanador[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cargarFotos()
  }, [])

  const cargarFotos = async () => {
    try {
      const data = await obtenerMuralGanadores()
      setFotos(data)
    } catch (error) {
      console.error("Error cargando mural de ganadores:", error)
    } finally {
      setLoading(false)
    }
  }

  const desplazar = (direccion: "izquierda" | "derecha") => {
    const contenedor = scrollRef.current
    if (!contenedor) return
    const cantidad = Math.round(contenedor.clientWidth * 0.8)
    contenedor.scrollBy({
      left: direccion === "izquierda" ? -cantidad : cantidad,
      behavior: "smooth",
    })
  }

  if (loading || fotos.length === 0) {
    return null
  }

  return (
    <section id="ganadores" className="py-16">
      <div className="divider-gold max-w-4xl mx-auto mb-16" />
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid mb-3">
            Nuestros Ganadores
          </p>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#d4af37]/8 rounded-full mb-4 border border-[#d4af37]/20">
            <Trophy className="h-6 w-6 text-[#d4af37]/70" />
          </div>
          <h2 className="text-4xl lg:text-5xl font-lux text-silver mb-3">
            Ganadores Anteriores
          </h2>
          <p className="text-silver-muted text-sm max-w-md mx-auto">
            Estas son algunas de las personas que ya se llevaron su premio.
          </p>
        </Reveal>
      </div>

      {/* Mural con scroll horizontal */}
      <div className="relative group/mural">
        {/* Botones de navegación (desktop) */}
        {fotos.length > 6 && (
          <>
            <button
              type="button"
              aria-label="Desplazar a la izquierda"
              onClick={() => desplazar("izquierda")}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-[#e3c462] border border-[#d4af37]/30 transition-opacity opacity-0 group-hover/mural:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Desplazar a la derecha"
              onClick={() => desplazar("derecha")}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-[#e3c462] border border-[#d4af37]/30 transition-opacity opacity-0 group-hover/mural:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Difuminados en los bordes */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-[5] bg-gradient-to-r from-[#0a0908] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-[5] bg-gradient-to-l from-[#0a0908] to-transparent" />

        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory px-4 md:px-12 pb-3"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="grid grid-flow-col auto-cols-max grid-rows-2 gap-3 w-max">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="snap-start group/foto relative w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden border border-[#d4af37]/15 bg-[#0a0908]"
              >
                <img
                  src={foto.imagen_url}
                  alt={foto.nombre || "Ganador anterior"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/foto:scale-110"
                />
                {foto.nombre && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 py-2 opacity-0 group-hover/foto:opacity-100 transition-opacity">
                    <p className="text-silver text-xs font-medium truncate flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-[#d4af37]/80 flex-shrink-0" />
                      {foto.nombre}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
