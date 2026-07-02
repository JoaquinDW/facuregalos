"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageCircle, Save, Lock, Unlock } from "lucide-react"
import {
  obtenerConfiguracionWhatsApp,
  actualizarConfiguracionWhatsApp,
  obtenerReporteWhatsApp,
  type ConfiguracionWhatsApp,
  type ReporteWhatsApp,
} from "@/lib/database"
import type { Sorteo } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Props {
  sorteos: Sorteo[]
}

export function ReporteWhatsapp({ sorteos }: Props) {
  const { toast } = useToast()

  // Modo dueño: oculta el costo base y el margen al cliente (Facu).
  const [ownerMode, setOwnerMode] = useState(false)
  const [mostrarUnlock, setMostrarUnlock] = useState(false)
  const [ownerPass, setOwnerPass] = useState("")
  const [verificando, setVerificando] = useState(false)

  const [costoUnitario, setCostoUnitario] = useState("0.05")
  const [moneda, setMoneda] = useState("USD")
  const [margenPct, setMargenPct] = useState("20")
  const [guardando, setGuardando] = useState(false)

  const [sorteoId, setSorteoId] = useState<string>("")
  const [reporte, setReporte] = useState<ReporteWhatsApp | null>(null)
  const [cargando, setCargando] = useState(true)

  const fmt = (n: number) => `${moneda} ${n.toFixed(2)}`

  const cargarReporte = async (filtroSorteo?: string) => {
    setCargando(true)
    const rep = await obtenerReporteWhatsApp(
      filtroSorteo ? { sorteoId: filtroSorteo } : undefined,
    )
    setReporte(rep)
    setCargando(false)
  }

  useEffect(() => {
    setOwnerMode(localStorage.getItem("whatsapp_owner_mode") === "true")
    ;(async () => {
      const config = await obtenerConfiguracionWhatsApp()
      setCostoUnitario(String(config.costoUnitario))
      setMoneda(config.moneda)
      setMargenPct(String(config.margen * 100))
      await cargarReporte()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verificarOwner = async () => {
    setVerificando(true)
    try {
      const res = await fetch("/api/owner-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ownerPass }),
      })
      if (res.ok) {
        localStorage.setItem("whatsapp_owner_mode", "true")
        setOwnerMode(true)
        setMostrarUnlock(false)
        setOwnerPass("")
      } else {
        toast({ variant: "destructive", title: "Contraseña incorrecta" })
      }
    } catch {
      toast({ variant: "destructive", title: "No se pudo verificar" })
    } finally {
      setVerificando(false)
    }
  }

  const salirOwner = () => {
    localStorage.removeItem("whatsapp_owner_mode")
    setOwnerMode(false)
  }

  const guardar = async () => {
    setGuardando(true)
    const config: ConfiguracionWhatsApp = {
      costoUnitario: Number(costoUnitario) || 0,
      moneda: moneda.trim() || "USD",
      margen: (Number(margenPct) || 0) / 100,
    }
    const ok = await actualizarConfiguracionWhatsApp(config)
    setGuardando(false)
    if (ok) {
      toast({ title: "Configuración de WhatsApp guardada" })
      await cargarReporte(sorteoId || undefined)
    } else {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar" })
    }
  }

  const onCambiarSorteo = async (value: string) => {
    setSorteoId(value)
    await cargarReporte(value || undefined)
  }

  return (
    <div className="space-y-6">
      {/* Configuración de costo/margen — SOLO modo dueño */}
      {ownerMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Facturación WhatsApp (privado)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Costo que te cobra Twilio por mensaje y el margen que le sumás. El cliente no ve esto.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Costo por mensaje (Twilio)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  placeholder="0.05"
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Input value={moneda} onChange={(e) => setMoneda(e.target.value)} placeholder="USD" />
              </div>
              <div className="space-y-2">
                <Label>Margen (%)</Label>
                <Input
                  type="number"
                  step="1"
                  value={margenPct}
                  onChange={(e) => setMargenPct(e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>
            <Button onClick={guardar} disabled={guardando} className="bg-gray-900 hover:bg-gray-800">
              <Save className="w-4 h-4 mr-2" />
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reporte */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Costo del servicio de WhatsApp</CardTitle>
              <p className="text-sm text-muted-foreground pt-1">
                Mensajes de confirmación enviados a los compradores.
              </p>
            </div>
            {/* Control de modo dueño */}
            {ownerMode ? (
              <Button variant="ghost" size="sm" onClick={salirOwner} className="text-muted-foreground">
                <Unlock className="w-4 h-4 mr-1" />
                Modo dueño
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMostrarUnlock((v) => !v)}
                className="text-muted-foreground"
              >
                <Lock className="w-4 h-4" />
              </Button>
            )}
          </div>

          {!ownerMode && mostrarUnlock && (
            <div className="flex gap-2 pt-3">
              <Input
                type="password"
                value={ownerPass}
                onChange={(e) => setOwnerPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verificarOwner()}
                placeholder="Contraseña de dueño"
                className="max-w-[220px]"
              />
              <Button onClick={verificarOwner} disabled={verificando} size="sm">
                {verificando ? "..." : "Entrar"}
              </Button>
            </div>
          )}

          <div className="pt-3">
            <Label className="text-sm">Filtrar por sorteo</Label>
            <select
              value={sorteoId}
              onChange={(e) => onCambiarSorteo(e.target.value)}
              className="mt-1 block w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos los sorteos</option>
              {sorteos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {cargando && <p className="text-sm text-muted-foreground">Cargando…</p>}

          {!cargando && reporte && (
            <>
              <div className={`grid grid-cols-1 gap-4 ${ownerMode ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Mensajes</p>
                  <p className="text-2xl font-bold">{reporte.cantidad}</p>
                </div>
                {ownerMode && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Costo Twilio</p>
                    <p className="text-2xl font-bold">{fmt(reporte.costoBase)}</p>
                  </div>
                )}
                <div className="rounded-lg border p-4 bg-green-50 border-green-200">
                  <p className="text-sm text-muted-foreground">
                    {ownerMode ? `A facturar (+${(reporte.margen * 100).toFixed(0)}%)` : "Costo total"}
                  </p>
                  <p className="text-2xl font-bold text-green-700">{fmt(reporte.costoConMargen)}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Por mes</h4>
                {reporte.porMes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin envíos registrados.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4">Mes</th>
                          <th className="py-2 pr-4">Mensajes</th>
                          {ownerMode && <th className="py-2 pr-4">Costo Twilio</th>}
                          <th className="py-2">{ownerMode ? "A facturar" : "Costo"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.porMes.map((m) => (
                          <tr key={m.mes} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{m.mes}</td>
                            <td className="py-2 pr-4">{m.cantidad}</td>
                            {ownerMode && <td className="py-2 pr-4">{fmt(m.costoBase)}</td>}
                            <td className="py-2 font-semibold text-green-700">
                              {fmt(m.costoConMargen)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
