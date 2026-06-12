"use client"

import { useState, useEffect } from "react"
import {
  Trophy,
  Calendar,
  Hash,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { GanadorPasado } from "@/lib/supabase"
import { obtenerGanadoresPasados } from "@/lib/database"
import { CONTENIDO_DEFAULTS, type ContenidoSitio } from "@/lib/contenido"
import { Reveal } from "@/components/reveal"

interface GanadorCardProps {
  ganador: GanadorPasado
  imagenes: string[]
  formatearFecha: (fecha: string) => string
}

function GanadorCard({ ganador, imagenes, formatearFecha }: GanadorCardProps) {
  const [imagenActual, setImagenActual] = useState(0)

  const siguienteImagen = () => {
    setImagenActual((prev) => (prev + 1) % imagenes.length)
  }

  const anteriorImagen = () => {
    setImagenActual((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  }

  return (
    <Card className="card-lux border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Columna de imagen */}
          <div className="relative bg-[#0a0908] aspect-square md:aspect-[4/3] min-h-[400px]">
            {imagenes.length > 0 ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <img
                    src={imagenes[imagenActual]}
                    alt={`${ganador.nombre_ganador} - Imagen ${imagenActual + 1}`}
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>

                {imagenes.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-[#e3c462] border border-[#d4af37]/25 rounded-full w-8 h-8"
                      onClick={anteriorImagen}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-[#e3c462] border border-[#d4af37]/25 rounded-full w-8 h-8"
                      onClick={siguienteImagen}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imagenes.map((_, index) => (
                        <button
                          key={index}
                          aria-label={`Ver imagen ${index + 1}`}
                          onClick={() => setImagenActual(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            index === imagenActual
                              ? "bg-[#d4af37] w-5"
                              : "bg-[#9aa1ac]/40 hover:bg-[#9aa1ac]/70 w-1.5"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="w-24 h-24 rounded-full bg-[#d4af37]/8 flex items-center justify-center border border-[#d4af37]/20">
                  <Trophy className="h-12 w-12 text-[#d4af37]/40" />
                </div>
              </div>
            )}
          </div>

          {/* Columna de información */}
          <div className="p-8 md:p-10 flex flex-col justify-center space-y-6">
            <Badge
              variant="outline"
              className="chip-gold border w-fit text-xs"
            >
              <Trophy className="h-3 w-3 mr-1" />
              Ganador
            </Badge>

            <div>
              <h3 className="text-3xl md:text-4xl font-lux text-silver mb-3">
                {ganador.nombre_ganador}
              </h3>
              <div className="h-px w-16 divider-gold"></div>
            </div>

            <div className="space-y-3">
              <p className="text-lg text-silver-muted font-medium leading-relaxed">
                {ganador.premio}
              </p>
              <Badge
                variant="outline"
                className="bg-[#c8cdd5]/5 text-silver border-[#c8cdd5]/20 text-sm px-3 py-0.5"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                {ganador.precio_premio}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[#c8cdd5]/10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-silver-muted uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  <span>Fecha</span>
                </div>
                <p className="text-silver font-medium text-sm">
                  {formatearFecha(ganador.fecha_sorteo)}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-silver-muted uppercase tracking-wider">
                  <Hash className="h-3 w-3" />
                  <span>Número Ganador</span>
                </div>
                <p className="font-mono font-bold text-2xl text-gold-solid">
                  {ganador.numero_ganador}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GanadoresPasados({
  contenido = CONTENIDO_DEFAULTS,
}: {
  contenido?: ContenidoSitio
}) {
  const [ganadores, setGanadores] = useState<GanadorPasado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarGanadores()
  }, [])

  const cargarGanadores = async () => {
    try {
      const data = await obtenerGanadoresPasados()
      setGanadores(data)
    } catch (error) {
      console.error("Error cargando ganadores:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    const [year, month, day] = fecha.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  }

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#d4af37]/8 rounded-full mb-4 border border-[#d4af37]/20">
              <Trophy className="h-6 w-6 text-[#d4af37]/60" />
            </div>
            <h2 className="text-4xl font-lux text-silver mb-4">
              {contenido.pasados_titulo}
            </h2>
            <p className="text-silver-muted text-sm">Cargando...</p>
          </div>
        </div>
      </section>
    )
  }

  if (ganadores.length === 0) {
    return null
  }

  return (
    <>
      {/* CTA de contacto */}
      <div className="py-12 text-center">
        <div className="divider-gold max-w-4xl mx-auto mb-12" />
        <Reveal>
          <p className="text-silver-muted text-sm mb-5 tracking-wide">
            {contenido.pasados_cta_texto}
          </p>
          <a
            href={contenido.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm tracking-wide"
          >
            {contenido.pasados_cta_boton}
          </a>
        </Reveal>
      </div>

      <section id="ganadores" className="py-16">
        <div className="divider-silver max-w-4xl mx-auto mb-16" />
        <div className="container mx-auto px-4">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid mb-3">
              {contenido.pasados_kicker}
            </p>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#d4af37]/8 rounded-full mb-4 border border-[#d4af37]/20">
              <Trophy className="h-6 w-6 text-[#d4af37]/70" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-lux text-silver mb-3">
              {contenido.pasados_titulo}
            </h2>
            <p className="text-silver-muted text-sm max-w-md mx-auto">
              {contenido.pasados_descripcion}
            </p>
          </Reveal>

          <div className="space-y-12 max-w-5xl mx-auto">
            {ganadores.map((ganador) => {
              const imagenes = [
                ganador.imagen_1_url,
                ganador.imagen_2_url,
                ganador.imagen_3_url,
              ].filter(Boolean) as string[]

              return (
                <Reveal key={ganador.id} variant="scale">
                  <GanadorCard
                    ganador={ganador}
                    imagenes={imagenes}
                    formatearFecha={formatearFecha}
                  />
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
