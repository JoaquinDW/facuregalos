"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Image as ImageIcon, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
import type { MuralGanador } from "@/lib/supabase"
import {
  obtenerTodasMuralGanadores,
  crearMuralGanador,
  actualizarMuralGanador,
  eliminarMuralGanador,
} from "@/lib/database"

export function GestionMural() {
  const [fotos, setFotos] = useState<MuralGanador[]>([])
  const [loading, setLoading] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState<{ actual: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    cargarFotos()
  }, [])

  const cargarFotos = async () => {
    try {
      const data = await obtenerTodasMuralGanadores()
      setFotos(data)
    } catch (error) {
      console.error("Error cargando mural:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files || [])
    if (archivos.length === 0) return

    setSubiendo(true)
    setProgreso({ actual: 0, total: archivos.length })

    // orden inicial = mayor orden existente + 1
    let ordenBase =
      fotos.reduce((max, f) => Math.max(max, f.orden), 0) + 1

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i]
      setProgreso({ actual: i + 1, total: archivos.length })

      if (!file.type.startsWith("image/")) continue
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" supera los 5MB y fue omitida`)
        continue
      }

      try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Error al subir la imagen")

        const { url } = await response.json()
        await crearMuralGanador({ imagen_url: url, orden: ordenBase++ })
      } catch (error) {
        console.error("Error subiendo foto:", error)
        alert(`Error al subir "${file.name}"`)
      }
    }

    setSubiendo(false)
    setProgreso(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    cargarFotos()
  }

  const toggleVisibilidad = async (foto: MuralGanador) => {
    await actualizarMuralGanador(foto.id, { visible: !foto.visible })
    cargarFotos()
  }

  const guardarNombre = async (foto: MuralGanador, nombre: string) => {
    const valor = nombre.trim()
    if ((foto.nombre || "") === valor) return
    await actualizarMuralGanador(foto.id, { nombre: valor || null })
    cargarFotos()
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta foto del mural?")) return
    await eliminarMuralGanador(id)
    cargarFotos()
  }

  const visibles = fotos.filter((f) => f.visible).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Mural de Ganadores Anteriores
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Subí fotos de ganadores. Se muestran en la landing como un collage.{" "}
            {fotos.length > 0 && (
              <span className="font-medium">
                {fotos.length} foto{fotos.length !== 1 ? "s" : ""} · {visibles} visible
                {visibles !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={subiendo} size="sm">
          {subiendo ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {progreso ? `Subiendo ${progreso.actual}/${progreso.total}` : "Subiendo..."}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Subir fotos
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Cargando...</p>
        ) : fotos.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground mb-4">No hay fotos en el mural todavía</p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={subiendo}>
              <Upload className="h-4 w-4 mr-2" />
              Subir las primeras fotos
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Podés seleccionar varias fotos a la vez. Máximo 5MB cada una.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className={`relative rounded-lg overflow-hidden border bg-white ${
                  foto.visible ? "" : "opacity-60"
                }`}
              >
                <div className="relative w-full aspect-square bg-gray-100">
                  <img
                    src={foto.imagen_url}
                    alt={foto.nombre || "Ganador"}
                    className="w-full h-full object-cover"
                  />
                  {!foto.visible && (
                    <Badge variant="secondary" className="absolute top-2 left-2">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Oculta
                    </Badge>
                  )}
                </div>
                <div className="p-2 space-y-2">
                  <input
                    type="text"
                    defaultValue={foto.nombre || ""}
                    placeholder="Nombre (opcional)"
                    onBlur={(e) => guardarNombre(foto, e.target.value)}
                    className="w-full text-sm px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => toggleVisibilidad(foto)}
                      title={foto.visible ? "Ocultar" : "Hacer visible"}
                    >
                      {foto.visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEliminar(foto.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
