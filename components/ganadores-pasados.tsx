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
    <Card className="bg-[#111] border-gray-800 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Columna de imagen */}
          <div className="relative bg-[#0d0d0d] aspect-square md:aspect-[4/3] min-h-[400px]">
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8"
                      onClick={anteriorImagen}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8"
                      onClick={siguienteImagen}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {imagenes.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setImagenActual(index)}
                          className={`h-1.5 rounded-full transition-all ${
                            index === imagenActual
                              ? "bg-[#ff0040] w-5"
                              : "bg-gray-700 hover:bg-gray-500 w-1.5"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="w-24 h-24 rounded-full bg-yellow-500/8 flex items-center justify-center border border-yellow-500/15">
                  <Trophy className="h-12 w-12 text-yellow-500/40" />
                </div>
              </div>
            )}
          </div>

          {/* Columna de información */}
          <div className="p-8 md:p-10 flex flex-col justify-center space-y-6">
            <Badge
              variant="outline"
              className="bg-yellow-500/8 text-yellow-500/80 border-yellow-500/20 w-fit text-xs"
            >
              <Trophy className="h-3 w-3 mr-1" />
              Ganador
            </Badge>

            <div>
              <h3 className="text-3xl md:text-4xl font-display tracking-wide text-white mb-3">
                {ganador.nombre_ganador}
              </h3>
              <div className="h-0.5 w-12 bg-[#ff0040]/40 rounded-full"></div>
            </div>

            <div className="space-y-3">
              <p className="text-lg text-gray-300 font-medium leading-relaxed">
                {ganador.premio}
              </p>
              <Badge
                variant="outline"
                className="bg-green-500/8 text-green-400/80 border-green-500/15 text-sm px-3 py-0.5"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                {ganador.precio_premio}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-800">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 uppercase tracking-wider">
                  <Calendar className="h-3 w-3" />
                  <span>Fecha</span>
                </div>
                <p className="text-white font-medium text-sm">
                  {formatearFecha(ganador.fecha_sorteo)}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 uppercase tracking-wider">
                  <Hash className="h-3 w-3" />
                  <span>Número Ganador</span>
                </div>
                <p className="font-mono font-bold text-2xl text-yellow-500">
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

export function GanadoresPasados() {
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
      <section className="py-20 border-t border-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-500/8 rounded-full mb-4 border border-yellow-500/15">
              <Trophy className="h-6 w-6 text-yellow-500/60" />
            </div>
            <h2 className="text-4xl font-display tracking-wider text-white mb-4">
              Ganadores Anteriores
            </h2>
            <p className="text-gray-600 text-sm">Cargando...</p>
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
      <div className="py-10 border-t border-gray-900 text-center bg-black">
        <p className="text-gray-500 text-sm mb-4 tracking-wide">¿Tenés consultas?</p>
        <a
          href="https://wa.me/5493795152063"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg text-sm tracking-wide transition-colors duration-200"
        >
          WhatsApp
        </a>
      </div>

      <section
        id="ganadores"
        className="py-16 border-t border-gray-900"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#ff0040] mb-3">
              Historial
            </p>
            <div className="inline-flex items-center justify-center w-14 h-14 bg-yellow-500/8 rounded-full mb-4 border border-yellow-500/15">
              <Trophy className="h-6 w-6 text-yellow-500/60" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-display tracking-wider text-white mb-3">
              Ganadores Anteriores
            </h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Conocé a las personas que ya ganaron con nosotros
            </p>
          </div>

          <div className="space-y-12 max-w-5xl mx-auto">
            {ganadores.map((ganador) => {
              const imagenes = [
                ganador.imagen_1_url,
                ganador.imagen_2_url,
                ganador.imagen_3_url,
              ].filter(Boolean) as string[]

              return (
                <GanadorCard
                  key={ganador.id}
                  ganador={ganador}
                  imagenes={imagenes}
                  formatearFecha={formatearFecha}
                />
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
