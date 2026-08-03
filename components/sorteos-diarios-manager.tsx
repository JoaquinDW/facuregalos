"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CalendarDays,
  Gift,
  Save,
  Trophy,
  Trash2,
  Users,
  Eye,
  EyeOff,
  MessageCircle,
  AtSign,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  normalizarTelefonoAR,
  esNumeroTelefono,
} from "@/lib/whatsapp/normalizar"
import {
  obtenerPromoDiaria,
  actualizarPromoDiaria,
  contarElegibles,
  obtenerNombresElegibles,
  realizarSorteoDiario,
  obtenerSorteosDiarios,
  actualizarVisibilidadSorteoDiario,
  eliminarSorteoDiario,
} from "@/lib/database"
import type { PromoDiaria, TipoParticipantes } from "@/lib/database"
import type { SorteoDiario } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { SorteoDiarioReveal } from "@/components/sorteo-diario-reveal"

interface Props {
  sorteoId: string
}

// Hoy en Argentina (UTC-3) como 'YYYY-MM-DD'
function hoyArgentina(): string {
  const ar = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return ar.toISOString().slice(0, 10)
}

// Ayer en Argentina (UTC-3) como 'YYYY-MM-DD'
function ayerArgentina(): string {
  const ar = new Date(Date.now() - 3 * 60 * 60 * 1000)
  ar.setUTCDate(ar.getUTCDate() - 1)
  return ar.toISOString().slice(0, 10)
}

function formatearFecha(fecha: string): string {
  // fecha 'YYYY-MM-DD' -> DD/MM/YYYY sin desfase de timezone
  const [a, m, d] = fecha.split("-")
  return `${d}/${m}/${a}`
}

// Muestra el contacto del ganador como link directo (WhatsApp / Instagram / email)
function ContactoGanador({ contacto }: { contacto: string | null }) {
  if (!contacto) return <span className="text-muted-foreground">—</span>

  if (esNumeroTelefono(contacto)) {
    const norm = normalizarTelefonoAR(contacto)
    if (norm) {
      return (
        <a
          href={`https://wa.me/${norm}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-green-600 hover:underline"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {contacto}
        </a>
      )
    }
  }

  if (contacto.startsWith("@")) {
    return (
      <a
        href={`https://instagram.com/${contacto.slice(1)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-pink-600 hover:underline"
      >
        <AtSign className="w-3.5 h-3.5" />
        {contacto}
      </a>
    )
  }

  if (contacto.includes("@")) {
    return (
      <a
        href={`mailto:${contacto}`}
        className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
      >
        <Mail className="w-3.5 h-3.5" />
        {contacto}
      </a>
    )
  }

  return <span>{contacto}</span>
}

export function SorteosDiariosManager({ sorteoId }: Props) {
  const { toast } = useToast()

  // Promo
  const [promo, setPromo] = useState<PromoDiaria>({
    titulo: "",
    premio: "",
    descripcion: "",
    visible: false,
    mostrarTotalParticipantes: false,
  })
  const [guardandoPromo, setGuardandoPromo] = useState(false)

  // Sorteo
  const [fecha, setFecha] = useState(ayerArgentina())
  const [tipo, setTipo] = useState<TipoParticipantes>("todos")
  const [cantidad, setCantidad] = useState("50")
  const [premio, setPremio] = useState("")
  const [elegibles, setElegibles] = useState<number | null>(null)
  const [cargandoElegibles, setCargandoElegibles] = useState(false)
  const [sorteando, setSorteando] = useState(false)

  // Animación "sorteo en vivo"
  const [revealAbierto, setRevealAbierto] = useState(false)
  const [reelNombres, setReelNombres] = useState<string[]>([])
  const [resultado, setResultado] = useState<SorteoDiario | null>(null)

  // Historial
  const [historial, setHistorial] = useState<SorteoDiario[]>([])

  useEffect(() => {
    cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorteoId])

  const cargarTodo = async () => {
    const [p, h] = await Promise.all([
      obtenerPromoDiaria(),
      obtenerSorteosDiarios(sorteoId),
    ])
    setPromo(p)
    setHistorial(h)
  }

  const guardarPromo = async () => {
    setGuardandoPromo(true)
    const ok = await actualizarPromoDiaria(promo)
    setGuardandoPromo(false)
    toast(
      ok
        ? { title: "Promo guardada" }
        : {
            variant: "destructive",
            title: "Error",
            description: "No se pudo guardar la promo",
          },
    )
  }

  const cantidadNum = () => {
    const n = parseInt(cantidad, 10)
    return isNaN(n) ? undefined : n
  }

  // Para 'acumulado' la fecha no filtra nada; se guarda la del día del sorteo.
  const fechaEfectiva = () => (tipo === "acumulado" ? hoyArgentina() : fecha)

  const verElegibles = async () => {
    setCargandoElegibles(true)
    setElegibles(null)
    const total = await contarElegibles(
      sorteoId,
      fechaEfectiva(),
      tipo,
      cantidadNum(),
    )
    setElegibles(total)
    setCargandoElegibles(false)
  }

  const sortear = async () => {
    if (!premio.trim()) {
      toast({
        variant: "destructive",
        title: "Falta el premio",
        description: "Indicá qué se regala",
      })
      return
    }
    if (tipo === "primeros_x" && !cantidadNum()) {
      toast({
        variant: "destructive",
        title: "Falta la cantidad",
        description: "Indicá cuántos compradores entran",
      })
      return
    }

    setSorteando(true)
    const fechaSorteo = fechaEfectiva()

    // 1) Traemos nombres reales para el ciclado de la animación
    const nombres = await obtenerNombresElegibles(
      sorteoId,
      fechaSorteo,
      tipo,
      cantidadNum(),
    )
    if (nombres.length === 0) {
      setSorteando(false)
      toast({
        variant: "destructive",
        title: "No se pudo entregar el regalo",
        description:
          tipo === "acumulado"
            ? "No hay compradores pagados en este sorteo"
            : "No hay compradores pagados para ese día",
      })
      return
    }

    // 2) Abrimos la animación (arranca a ciclar mientras se elige el ganador)
    setReelNombres(nombres)
    setResultado(null)
    setRevealAbierto(true)

    // 3) Realizamos y guardamos el sorteo; al setear el resultado, la animación aterriza
    const { sorteo, error } = await realizarSorteoDiario(
      sorteoId,
      fechaSorteo,
      tipo,
      premio.trim(),
      cantidadNum(),
    )
    setSorteando(false)

    if (error || !sorteo) {
      setRevealAbierto(false)
      toast({
        variant: "destructive",
        title: "No se pudo entregar el regalo",
        description: error,
      })
      return
    }

    setResultado(sorteo)
  }

  const cerrarReveal = () => {
    setRevealAbierto(false)
    setResultado(null)
    setReelNombres([])
    setPremio("")
    setElegibles(null)
    cargarTodo()
  }

  const toggleVisible = async (s: SorteoDiario) => {
    const ok = await actualizarVisibilidadSorteoDiario(s.id, !s.visible)
    if (ok) {
      setHistorial((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)),
      )
    }
  }

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este regalo del historial?")) return
    const ok = await eliminarSorteoDiario(id)
    if (ok) {
      setHistorial((prev) => prev.filter((x) => x.id !== id))
      toast({ title: "Regalo eliminado" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Promo de la landing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Promoción en la landing
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Esta card se muestra en la página pública para incentivar la compra
            del día. Reemplaza a "premios secundarios".
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="promo-visible"
              checked={promo.visible}
              onCheckedChange={(v) => setPromo({ ...promo, visible: v })}
            />
            <Label htmlFor="promo-visible">Visible en página pública</Label>
          </div>

          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={promo.titulo}
              onChange={(e) => setPromo({ ...promo, titulo: e.target.value })}
              placeholder="REGALO DEL DÍA"
            />
          </div>

          <div className="space-y-2">
            <Label>Premio (destacado)</Label>
            <Input
              value={promo.premio}
              onChange={(e) => setPromo({ ...promo, premio: e.target.value })}
              placeholder="$50.000"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción / mecánica</Label>
            <Input
              value={promo.descripcion}
              onChange={(e) =>
                setPromo({ ...promo, descripcion: e.target.value })
              }
              placeholder="Comprá hoy y participá..."
            />
          </div>

          {/* Ajuste avanzado de la animación */}
          {/* <div className="rounded-lg border border-dashed border-gray-200 p-3">
            <div className="flex items-center gap-3">
              <Switch
                id="promo-mostrar-total"
                checked={promo.mostrarTotalParticipantes}
                onCheckedChange={(v) =>
                  setPromo({ ...promo, mostrarTotalParticipantes: v })
                }
              />
              <Label htmlFor="promo-mostrar-total" className="leading-tight">
                Mostrar "elegido entre N personas" en la animación
              </Label>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Desactivado por defecto. Si lo activás, durante el sorteo se muestra
              entre cuántos compradores se está eligiendo.
            </p>
          </div> */}

          <Button
            onClick={guardarPromo}
            disabled={guardandoPromo}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {guardandoPromo ? "Guardando..." : "Guardar promo"}
          </Button>
        </CardContent>
      </Card>

      {/* Entregar regalo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-500" />
            Entregar el regalo del día
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Elegí quiénes participan y el premio. El sistema toma los
            compradores pagados (hora Argentina) y elige un ganador al azar.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                Día de las compras
              </Label>
              {tipo === "acumulado" ? (
                <div className="flex h-10 items-center rounded-md border border-dashed border-gray-200 px-3 text-sm text-muted-foreground">
                  No aplica — participan todos desde el inicio
                </div>
              ) : (
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value)
                    setElegibles(null)
                  }}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Premio a regalar</Label>
              <Input
                value={premio}
                onChange={(e) => setPremio(e.target.value)}
                placeholder="Ej: $50.000 / Una remera"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>¿Quiénes participan?</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={tipo === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTipo("todos")
                  setElegibles(null)
                }}
              >
                <Users className="w-4 h-4 mr-1.5" />
                Todos los del día
              </Button>
              <Button
                type="button"
                variant={tipo === "primeros_x" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTipo("primeros_x")
                  setElegibles(null)
                }}
              >
                Primeros X
              </Button>
              <Button
                type="button"
                variant={tipo === "acumulado" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTipo("acumulado")
                  setElegibles(null)
                }}
              >
                <Users className="w-4 h-4 mr-1.5" />
                Todos (desde el inicio)
              </Button>
              {tipo === "primeros_x" && (
                <Input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value)
                    setElegibles(null)
                  }}
                  className="w-24"
                  placeholder="50"
                />
              )}
            </div>
            {tipo === "acumulado" && (
              <p className="text-xs text-muted-foreground">
                Participan todos los compradores, desde el primer día hasta este
                momento.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={verElegibles}
              disabled={cargandoElegibles}
            >
              <Users className="w-4 h-4 mr-1.5" />
              {cargandoElegibles ? "Contando..." : "Ver elegibles"}
            </Button>
            {elegibles !== null && (
              <Badge variant={elegibles > 0 ? "default" : "destructive"}>
                {elegibles} comprador{elegibles === 1 ? "" : "es"} elegible
                {elegibles === 1 ? "" : "s"}
              </Badge>
            )}
            <Button
              onClick={sortear}
              disabled={sorteando}
              className="bg-indigo-600 hover:bg-indigo-700 ml-auto"
            >
              <Gift className="w-4 h-4 mr-1.5" />
              {sorteando ? "Entregando..." : "Entregar regalo 🎁"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regalos entregados</CardTitle>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Todavía no se entregó ningún regalo diario
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Premio</TableHead>
                  <TableHead>Ganador</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-center">Visible</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historial.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{formatearFecha(s.fecha)}</TableCell>
                    <TableCell>
                      {s.tipo_participantes === "primeros_x"
                        ? `Primeros ${s.cantidad_participantes ?? "?"}`
                        : s.tipo_participantes === "acumulado"
                          ? "Todos (histórico)"
                          : "Todos del día"}
                      <span className="text-muted-foreground">
                        {" "}
                        · {s.total_participantes}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {s.premio}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="font-medium">
                          {s.ganador_nombre ?? "—"}
                        </span>
                        {s.ganador_numero != null && (
                          <Badge variant="outline" className="font-mono">
                            {s.ganador_numero}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <ContactoGanador contacto={s.ganador_contacto} />
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleVisible(s)}
                        className={cn(
                          "p-1 transition-colors",
                          s.visible ? "text-green-600" : "text-gray-400",
                        )}
                        title={s.visible ? "Visible en landing" : "Oculto"}
                      >
                        {s.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => eliminar(s.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SorteoDiarioReveal
        open={revealAbierto}
        reelNombres={reelNombres}
        resultado={resultado}
        mostrarTotal={promo.mostrarTotalParticipantes}
        onClose={cerrarReveal}
      />
    </div>
  )
}
