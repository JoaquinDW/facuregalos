"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Star, Trash2, Plus, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { actualizarPremiosSecundarios } from "@/lib/database"
import type { PremiosSecundarios } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface Props {
  premios: PremiosSecundarios
  onActualizado: (premios: PremiosSecundarios) => void
}

export function PremiosSecundariosManager({ premios, onActualizado }: Props) {
  const [numeros, setNumeros] = useState<string[]>(premios.numeros)
  const [tachados, setTachados] = useState<string[]>(premios.tachados ?? [])
  const [monto, setMonto] = useState(premios.monto)
  const [titulo, setTitulo] = useState(premios.titulo)
  const [visible, setVisible] = useState(premios.visible)
  const [nuevoNumero, setNuevoNumero] = useState("")
  const [guardando, setGuardando] = useState(false)
  const { toast } = useToast()

  const agregarNumero = () => {
    const num = nuevoNumero.trim()
    if (!num || numeros.includes(num)) {
      setNuevoNumero("")
      return
    }
    setNumeros([...numeros, num])
    setNuevoNumero("")
  }

  const eliminarNumero = (num: string) => {
    setNumeros(numeros.filter((n) => n !== num))
    setTachados(tachados.filter((n) => n !== num))
  }

  const toggleTachado = (num: string) => {
    setTachados((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num],
    )
  }

  const guardar = async () => {
    setGuardando(true)
    const nuevos: PremiosSecundarios = { numeros, tachados, monto, titulo, visible }
    const ok = await actualizarPremiosSecundarios(nuevos)
    setGuardando(false)
    if (ok) {
      onActualizado(nuevos)
      toast({ title: "Premios secundarios guardados" })
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudieron guardar los cambios" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Premios Secundarios (Números Bendecidos)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Estos números y el monto se muestran en la sección "Premios" de la página pública.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visibilidad */}
        <div className="flex items-center gap-3">
          <Switch
            id="visible"
            checked={visible}
            onCheckedChange={setVisible}
          />
          <Label htmlFor="visible">
            Visible en página pública
          </Label>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label>Título de la sección</Label>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="NÚMEROS BENDECIDOS"
          />
        </div>

        {/* Monto */}
        <div className="space-y-2">
          <Label>Premio (monto)</Label>
          <Input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="$50 mil"
          />
        </div>

        {/* Números */}
        <div className="space-y-3">
          <Label>Números Registrados</Label>
          <p className="text-xs text-muted-foreground">
            Activá el interruptor de un número cuando ya salió para tacharlo. Se
            refleja tachado en la landing.
          </p>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            {/* Encabezado */}
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs font-medium text-muted-foreground">
              <span>Número</span>
              <span className="w-32 text-center">Tachado (ya salió)</span>
              <span className="w-16 text-right">Acciones</span>
            </div>

            {numeros.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">
                Sin números cargados
              </div>
            )}

            {numeros.map((num) => {
              const tachado = tachados.includes(num)
              return (
                <div
                  key={num}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <span
                    className={cn(
                      "text-lg font-bold font-mono",
                      tachado ? "line-through text-gray-400" : "text-gray-900",
                    )}
                  >
                    {num}
                  </span>
                  <div className="w-32 flex justify-center">
                    <Switch
                      checked={tachado}
                      onCheckedChange={() => toggleTachado(num)}
                      aria-label={`Marcar ${num} como ya salió`}
                    />
                  </div>
                  <div className="w-16 flex justify-end">
                    <button
                      type="button"
                      onClick={() => eliminarNumero(num)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Eliminar número"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Input
              value={nuevoNumero}
              onChange={(e) => setNuevoNumero(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && agregarNumero()}
              placeholder="Ej: 1234"
              className="max-w-[160px]"
            />
            <Button variant="outline" onClick={agregarNumero} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>

        <Button onClick={guardar} disabled={guardando} className="bg-gray-900 hover:bg-gray-800">
          <Save className="w-4 h-4 mr-2" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </CardContent>
    </Card>
  )
}
