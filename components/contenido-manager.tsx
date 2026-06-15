"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Type, Save, RotateCcw, Plus, Trash2 } from "lucide-react"
import {
  obtenerContenido,
  actualizarContenido,
  CONTENIDO_DEFAULTS,
  TIPOS_RED,
  type ContenidoSitio,
  type ClaveTextoContenido,
  type RedSocial,
  type TipoRed,
} from "@/lib/contenido"
import { useToast } from "@/hooks/use-toast"

interface Campo {
  key: ClaveTextoContenido
  label: string
  multiline?: boolean
  ayuda?: string
}

interface Seccion {
  titulo: string
  descripcion?: string
  campos: Campo[]
  // Si es true, muestra además el editor de links de redes sociales
  editorRedes?: boolean
}

const SECCIONES: Seccion[] = [
  {
    titulo: "General",
    campos: [
      { key: "marca", label: "Nombre de la marca (header y footer)" },
      {
        key: "whatsapp_url",
        label: "Link de WhatsApp / contacto",
        ayuda: "Se usa en el footer, el botón de consultas y la pantalla sin sorteo activo",
      },
    ],
  },
  {
    titulo: "Portada (Hero)",
    campos: [
      { key: "hero_badge", label: "Etiqueta flotante sobre las fotos" },
      {
        key: "hero_titulo",
        label: "Título principal",
        ayuda: "Usá {premio} donde quieras que aparezca el nombre del premio del sorteo",
      },
      { key: "hero_subtitulo", label: "Subtítulo" },
      { key: "hero_chances_label", label: "Etiqueta de la barra de progreso" },
      { key: "hero_completado_label", label: "Texto junto al porcentaje" },
      { key: "hero_completo_titulo", label: "Título cuando se vendió todo" },
      {
        key: "hero_completo_descripcion",
        label: "Descripción cuando se vendió todo",
        multiline: true,
      },
      { key: "hero_sorteado_titulo", label: "Título de resultados (sorteo realizado)" },
      { key: "hero_cerrado_titulo", label: "Título cuando el sorteo se cierra manualmente" },
      {
        key: "hero_cerrado_descripcion",
        label: "Descripción cuando el sorteo se cierra manualmente",
      },
    ],
  },
  {
    titulo: "Packs de chances",
    campos: [
      { key: "packs_popular_label", label: "Etiqueta del pack destacado" },
      { key: "packs_comprar_boton", label: "Texto del botón de compra" },
      { key: "packs_nota", label: "Nota debajo de los packs" },
    ],
  },
  {
    titulo: "Sección Premios",
    campos: [
      { key: "premios_kicker", label: "Texto chico arriba del título" },
      { key: "premios_titulo", label: "Título de la sección" },
      { key: "premios_primer_label", label: "Etiqueta del primer premio" },
      { key: "premios_sec_label", label: "Etiqueta de premios secundarios" },
      {
        key: "premios_sec_descripcion",
        label: "Descripción de premios secundarios",
        ayuda: "Usá {monto} donde quieras que aparezca el monto del premio",
      },
    ],
  },
  {
    titulo: "Preguntas frecuentes",
    campos: [
      { key: "faq_titulo", label: "Título de la sección" },
      { key: "faq_pregunta_fecha", label: "Pregunta sobre la fecha" },
      {
        key: "faq_respuesta_fecha_pendiente",
        label: "Respuesta sobre la fecha (cuando aún no está definida)",
      },
      { key: "faq_pregunta_ganador", label: "Pregunta sobre el ganador" },
      { key: "faq_respuesta_ganador", label: "Respuesta sobre el ganador" },
      { key: "faq_link_quiniela", label: "Link de la transmisión en vivo" },
    ],
  },
  {
    titulo: "Consulta de números",
    campos: [
      { key: "consulta_kicker", label: "Texto chico arriba del título" },
      { key: "consulta_titulo", label: "Título de la sección" },
      { key: "consulta_descripcion", label: "Descripción", multiline: true },
      { key: "consulta_placeholder", label: "Placeholder del campo de email" },
      { key: "consulta_boton", label: "Texto del botón" },
      { key: "consulta_vacio", label: "Mensaje cuando no hay resultados" },
      { key: "consulta_vacio_nota", label: "Nota cuando no hay resultados" },
    ],
  },
  {
    titulo: "Ganadores Express",
    campos: [
      { key: "express_kicker", label: "Texto chico arriba del título" },
      { key: "express_titulo", label: "Título de la sección" },
    ],
  },
  {
    titulo: "Ganadores Anteriores",
    campos: [
      { key: "pasados_cta_texto", label: "Texto del bloque de contacto" },
      { key: "pasados_cta_boton", label: "Botón del bloque de contacto" },
      { key: "pasados_kicker", label: "Texto chico arriba del título" },
      { key: "pasados_titulo", label: "Título de la sección" },
      { key: "pasados_descripcion", label: "Descripción de la sección" },
    ],
  },
  {
    titulo: "Links de interés / Redes sociales",
    descripcion:
      "Sección con botones a redes sociales, canal de WhatsApp, Telegram, etc. Si no hay links cargados, la sección no se muestra.",
    editorRedes: true,
    campos: [
      { key: "redes_kicker", label: "Texto chico arriba del título" },
      { key: "redes_titulo", label: "Título de la sección" },
      { key: "redes_descripcion", label: "Descripción", multiline: true },
    ],
  },
  {
    titulo: "Pantalla sin sorteo activo",
    descripcion: "Se muestra cuando no hay ningún sorteo en curso.",
    campos: [
      { key: "proximamente_titulo", label: "Título" },
      { key: "proximamente_descripcion", label: "Descripción", multiline: true },
      { key: "proximamente_boton", label: "Texto del botón" },
    ],
  },
  {
    titulo: "Footer",
    campos: [{ key: "footer_copyright", label: "Texto de copyright" }],
  },
]

export function ContenidoManager() {
  const [contenido, setContenido] = useState<ContenidoSitio | null>(null)
  const [guardando, setGuardando] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    obtenerContenido().then(setContenido)
  }, [])

  const setCampo = (key: ClaveTextoContenido, valor: string) => {
    setContenido((prev) => (prev ? { ...prev, [key]: valor } : prev))
  }

  const setRedes = (redes: RedSocial[]) => {
    setContenido((prev) => (prev ? { ...prev, redes } : prev))
  }

  const agregarRed = () => {
    if (!contenido) return
    setRedes([...contenido.redes, { tipo: "instagram", etiqueta: "Instagram", url: "" }])
  }

  const eliminarRed = (index: number) => {
    if (!contenido) return
    setRedes(contenido.redes.filter((_, i) => i !== index))
  }

  const setRed = (index: number, cambios: Partial<RedSocial>) => {
    if (!contenido) return
    setRedes(
      contenido.redes.map((red, i) => {
        if (i !== index) return red
        const actualizada = { ...red, ...cambios }
        // Al cambiar el tipo, actualizar la etiqueta si todavía es la genérica
        if (cambios.tipo) {
          const etiquetasGenericas = TIPOS_RED.map((t) => t.etiqueta)
          if (!red.etiqueta || etiquetasGenericas.includes(red.etiqueta)) {
            actualizada.etiqueta =
              TIPOS_RED.find((t) => t.valor === cambios.tipo)?.etiqueta ?? red.etiqueta
          }
        }
        return actualizada
      }),
    )
  }

  const guardar = async () => {
    if (!contenido) return
    setGuardando(true)
    const ok = await actualizarContenido(contenido)
    setGuardando(false)
    if (ok) {
      toast({
        title: "Contenido guardado",
        description: "Los textos de la página pública fueron actualizados.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios",
      })
    }
  }

  const restaurar = () => {
    setContenido(CONTENIDO_DEFAULTS)
    toast({
      title: "Textos originales restaurados",
      description: "Recordá guardar para aplicar los cambios.",
    })
  }

  if (!contenido) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Cargando contenido...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-gray-700" />
            Contenido de la página
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Editá los textos de la página pública. Los cambios se aplican al
            guardar. Si dejás un campo vacío, se muestra vacío (usá "Restaurar
            textos originales" para volver a los valores iniciales).
          </p>
        </CardHeader>
      </Card>

      {SECCIONES.map((seccion) => (
        <Card key={seccion.titulo}>
          <CardHeader>
            <CardTitle className="text-base">{seccion.titulo}</CardTitle>
            {seccion.descripcion && (
              <p className="text-sm text-muted-foreground">{seccion.descripcion}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {seccion.campos.map((campo) => (
              <div key={campo.key} className="space-y-1.5">
                <Label htmlFor={campo.key}>{campo.label}</Label>
                {campo.multiline ? (
                  <Textarea
                    id={campo.key}
                    value={contenido[campo.key]}
                    onChange={(e) => setCampo(campo.key, e.target.value)}
                    placeholder={CONTENIDO_DEFAULTS[campo.key]}
                    rows={2}
                  />
                ) : (
                  <Input
                    id={campo.key}
                    value={contenido[campo.key]}
                    onChange={(e) => setCampo(campo.key, e.target.value)}
                    placeholder={CONTENIDO_DEFAULTS[campo.key]}
                  />
                )}
                {campo.ayuda && (
                  <p className="text-xs text-muted-foreground">{campo.ayuda}</p>
                )}
              </div>
            ))}

            {seccion.editorRedes && (
              <div className="space-y-3 pt-2">
                <Label>Links</Label>
                {contenido.redes.length === 0 && (
                  <p className="text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    Sin links cargados. La sección no se muestra en la página pública.
                  </p>
                )}
                {contenido.redes.map((red, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <Select
                      value={red.tipo}
                      onValueChange={(valor) => setRed(index, { tipo: valor as TipoRed })}
                    >
                      <SelectTrigger className="sm:w-[180px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_RED.map((tipo) => (
                          <SelectItem key={tipo.valor} value={tipo.valor}>
                            {tipo.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={red.etiqueta}
                      onChange={(e) => setRed(index, { etiqueta: e.target.value })}
                      placeholder="Texto del botón"
                      className="sm:w-[200px] bg-white"
                    />
                    <Input
                      value={red.url}
                      onChange={(e) => setRed(index, { url: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 bg-white"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarRed(index)}
                      className="text-gray-400 hover:text-red-600 flex-shrink-0"
                      title="Eliminar link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={agregarRed}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Barra de acciones fija al pie */}
      <div className="sticky bottom-4 z-10">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={restaurar}
            disabled={guardando}
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar textos originales
          </Button>
          <Button
            onClick={guardar}
            disabled={guardando}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
