"use client"

import { useState, useEffect } from "react"
import {
  Sparkles,
  Clock,
  Trophy,
  ShoppingCart,
  ChevronDown,
  BookOpen,
  Car,
} from "lucide-react"
import Link from "next/link"
import { CompraModalNuevo } from "@/components/compra-modal-nuevo"
import { Header } from "@/components/header"
import { GanadoresPasados } from "@/components/ganadores-pasados"
import { GanadoresExpress } from "@/components/ganadores-express"
import { MuralGanadores } from "@/components/mural-ganadores"
import { RedesSociales } from "@/components/redes-sociales"
import { Reveal } from "@/components/reveal"
import dynamic from "next/dynamic"

const IphoneCarousel = dynamic(() => import("@/components/iphone-carousel"), {
  ssr: false,
})
import {
  obtenerSorteoActivo,
  obtenerEstadisticasSorteo,
  generarNumerosUnicos,
  obtenerPremiosSecundarios,
} from "@/lib/database"
import type { Sorteo } from "@/lib/supabase"
import type { PremiosSecundarios } from "@/lib/database"
import {
  obtenerContenido,
  conPlaceholders,
  CONTENIDO_DEFAULTS,
  type ContenidoSitio,
} from "@/lib/contenido"
import { AnimatedProgress } from "@/components/animated-progress"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function LandingPage() {
  const [sorteo, setSorteo] = useState<Sorteo | null>(null)
  const [chancesVendidas, setChancesVendidas] = useState(0)
  const [totalCompradores, setTotalCompradores] = useState(0)
  const [totalRecaudado, setTotalRecaudado] = useState(0)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [packSeleccionado, setPackSeleccionado] = useState<{
    chances: number
    precio: number
    sorteoId?: string
  } | null>(null)
  const [animacionVisible, setAnimacionVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [consultaEmail, setConsultaEmail] = useState("")
  const [consultaLoading, setConsultaLoading] = useState(false)
  const [consultaResultados, setConsultaResultados] = useState<Array<{
    id: string
    nombre: string
    numeros_asignados: number[]
    cantidad_chances: number
    sorteo_nombre: string
    created_at: string
  }> | null>(null)
  const [consultaError, setConsultaError] = useState<string | null>(null)
  const [premiosSecundarios, setPremiosSecundarios] =
    useState<PremiosSecundarios | null>(null)
  const [contenido, setContenido] = useState<ContenidoSitio>(CONTENIDO_DEFAULTS)
  const { toast } = useToast()

  const getPacks = () => {
    if (!sorteo) return []

    const allPacks = [
      {
        libros: 1,
        chances: sorteo.cantidad_pack_1 || 10,
        precio: sorteo.precio_6_chances || 21000,
        descripcion: sorteo.descripcion_pack_1 || "Honda Wave 2025",
        visible: sorteo.pack_1_visible ?? true,
      },
      {
        libros: 2,
        chances: sorteo.cantidad_pack_2 || 25,
        precio: sorteo.precio_12_chances || 42000,
        popular: true,
        descripcion:
          sorteo.descripcion_pack_2 ||
          "Honda Wave 2025 + 5 chances en pre-venta New Titan 2018",
        visible: sorteo.pack_2_visible ?? true,
      },
      {
        libros: 3,
        chances: sorteo.cantidad_pack_3 || 50,
        precio: sorteo.precio_24_chances || 84000,
        descripcion:
          sorteo.descripcion_pack_3 ||
          "Honda Wave 2025 + 5 chances pre-venta New Titan 2018",
        visible: sorteo.pack_3_visible ?? true,
      },
      {
        libros: 4,
        chances: sorteo.cantidad_pack_4 || 0,
        precio: sorteo.precio_pack_4 || 0,
        descripcion: sorteo.descripcion_pack_4 || "",
        visible: sorteo.pack_4_visible ?? false,
      },
      {
        libros: 5,
        chances: sorteo.cantidad_pack_5 || 0,
        precio: sorteo.precio_pack_5 || 0,
        descripcion: sorteo.descripcion_pack_5 || "",
        visible: sorteo.pack_5_visible ?? false,
      },
    ]

    return allPacks.filter((pack) => pack.visible)
  }

  useEffect(() => {
    cargarDatos()
    const timer = setTimeout(() => setAnimacionVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const cargarDatos = async () => {
    try {
      const [sorteoActivo, premios, contenidoSitio] = await Promise.all([
        obtenerSorteoActivo(),
        obtenerPremiosSecundarios(),
        obtenerContenido(),
      ])
      setPremiosSecundarios(premios)
      setContenido(contenidoSitio)
      if (sorteoActivo) {
        setSorteo(sorteoActivo)
        const estadisticas = await obtenerEstadisticasSorteo(sorteoActivo.id)
        setChancesVendidas(estadisticas.chancesVendidas)
        setTotalCompradores(estadisticas.totalCompradores)
        setTotalRecaudado(estadisticas.totalRecaudado)
      } else {
        console.error("No se pudo cargar el sorteo")
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const procesarCompra = async (
    nombre: string,
    email: string,
    telefono: string,
  ) => {
    if (!packSeleccionado || !sorteo) return

    try {
      const numerosDisponibles = await generarNumerosUnicos(
        sorteo.id,
        packSeleccionado.chances,
      )

      if (numerosDisponibles.length < packSeleccionado.chances) {
        toast({
          variant: "destructive",
          title: "Error en la compra",
          description: "No hay suficientes números disponibles",
        })
        return
      }

      const datosCompra = {
        sorteoId: sorteo.id,
        nombre,
        email,
        telefono,
        chances: packSeleccionado.chances,
        precio: packSeleccionado.precio,
        timestamp: Date.now(),
      }

      localStorage.setItem(
        "sorteo_compra_pendiente",
        JSON.stringify(datosCompra),
      )

      toast({
        title: "Preparando pago...",
        description: "Te redirigiremos a MercadoPago en un momento",
      })

      const response = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosCompra),
      })

      if (!response.ok) throw new Error("Error creando preferencia de pago")

      const { preferenceId, paymentUrl } = await response.json()

      const datosActualizados = { ...datosCompra, preferenceId }
      localStorage.setItem(
        "sorteo_compra_pendiente",
        JSON.stringify(datosActualizados),
      )

      window.location.href = paymentUrl
    } catch (error) {
      console.error("Error procesando compra:", error)
      toast({
        variant: "destructive",
        title: "Error en la compra",
        description: "Ocurrió un error inesperado. Intenta nuevamente.",
      })
    }

    setModalAbierto(false)
    setPackSeleccionado(null)
  }

  const procesarTransferencia = async (data: {
    nombre: string
    email: string
    contacto: string
    comprobanteFile: File
  }) => {
    if (!packSeleccionado || !sorteo) return

    try {
      const esWhatsApp = /^[\d\s+()-]+$/.test(data.contacto.trim())

      const formData = new FormData()
      formData.append("sorteoId", sorteo.id)
      formData.append("nombre", data.nombre)
      if (data.email) formData.append("email", data.email)
      if (esWhatsApp) {
        formData.append("telefono", data.contacto)
      } else {
        formData.append("instagram_username", data.contacto.replace("@", ""))
      }
      formData.append("cantidadChances", packSeleccionado.chances.toString())
      formData.append("comprobante", data.comprobanteFile)

      toast({
        title: "Procesando...",
        description: "Estamos registrando tu transferencia",
      })

      const response = await fetch("/api/transferencia", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Error procesando transferencia")

      toast({
        title: "¡Transferencia registrada!",
        description:
          "Tu pago está pendiente de confirmación. Te notificaremos por email cuando sea aprobado.",
        duration: 5000,
      })

      await cargarDatos()
    } catch (error) {
      console.error("Error procesando transferencia:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Ocurrió un error procesando tu transferencia. Intenta nuevamente.",
      })
    }

    setModalAbierto(false)
    setPackSeleccionado(null)
  }

  const TOTAL_CHANCES = sorteo?.total_chances || 9999
  const porcentajeVendido = (chancesVendidas / TOTAL_CHANCES) * 100
  const sorteoCompleto =
    sorteo?.estado === "completo" ||
    sorteo?.estado === "sorteado" ||
    chancesVendidas >= TOTAL_CHANCES

  const PACKS = getPacks()

  const handleCompra = (pack: (typeof PACKS)[0]) => {
    if (sorteoCompleto) return
    setPackSeleccionado({ ...pack, sorteoId: sorteo?.id })
    setModalAbierto(true)
  }

  const consultarMisNumeros = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailTrimmed = consultaEmail.trim()
    if (!emailTrimmed) return
    setConsultaLoading(true)
    setConsultaResultados(null)
    setConsultaError(null)
    try {
      const response = await fetch(
        `/api/mis-numeros?email=${encodeURIComponent(emailTrimmed)}`,
      )
      const data = await response.json()
      if (!response.ok) {
        setConsultaError(data.error || "Ocurrió un error. Intenta nuevamente.")
        return
      }
      setConsultaResultados(data.participaciones)
    } catch {
      setConsultaError(
        "No se pudo conectar. Revisá tu conexión e intentá de nuevo.",
      )
    } finally {
      setConsultaLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lux flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto opacity-80"></div>
          <p className="text-silver-muted text-sm tracking-[0.3em] uppercase">
            Cargando
          </p>
        </div>
      </div>
    )
  }

  if (!sorteo) {
    return (
      <div className="min-h-screen bg-lux flex flex-col">
        <Header marca={contenido.marca} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#d4af37]/40 mx-auto">
              <img
                src="/facuregalos.jpeg"
                alt={contenido.marca}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-lux text-gold">
                {contenido.proximamente_titulo}
              </h2>
              <p className="text-silver-muted text-sm">
                {contenido.proximamente_descripcion}
              </p>
            </div>
            <Link
              href={contenido.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-block px-7 py-3 rounded-full text-sm tracking-wide"
            >
              {contenido.proximamente_boton}
            </Link>
          </div>
        </div>
        <RedesSociales contenido={contenido} />
        <footer className="border-t border-[#d4af37]/10 py-6">
          <div className="container mx-auto px-4 text-center text-silver-muted text-xs tracking-wide">
            <p>{contenido.footer_copyright}</p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lux">
      <Header marca={contenido.marca} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative container mx-auto px-4 pt-14 pb-16 lg:pt-24 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Texto a la izquierda */}
            <div
              className={`space-y-7 text-center lg:text-left transition-all duration-700 ${
                animacionVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <div className="chip-gold inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em]">
                <Sparkles className="w-3.5 h-3.5" />
                {contenido.hero_badge}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-lux font-semibold leading-[1.1] text-gold text-balance">
                {conPlaceholders(contenido.hero_titulo, {
                  premio: sorteo.titulo_remera || "Remera Exclusiva",
                })}
              </h1>

              {sorteo?.estado !== "sorteado" && (
                <p className="text-lg lg:text-xl text-silver font-light leading-relaxed max-w-md mx-auto lg:mx-0">
                  {contenido.hero_subtitulo}
                </p>
              )}

              {/* Progress / Evento finalizado */}
              {sorteo?.estado === "sorteado" ? (
                <div className="card-lux-silver p-6 text-center lg:text-left">
                  <p className="text-lg font-semibold text-silver">
                    Evento finalizado
                  </p>
                </div>
              ) : (
                <div className="card-lux p-5 sm:p-6 space-y-4 text-left">
                  <span className="text-xs font-semibold text-silver-muted uppercase tracking-[0.2em]">
                    {contenido.hero_chances_label}
                  </span>
                  <AnimatedProgress
                    value={porcentajeVendido}
                    className="h-2.5"
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-lux font-semibold text-gold">
                      {porcentajeVendido.toFixed(1)}%
                    </span>
                    <span className="text-sm text-silver-muted">
                      {contenido.hero_completado_label}
                    </span>
                  </div>
                </div>
              )}

              {/* Estados: completo / sorteado / cerrado */}
              {sorteoCompleto && (
                <div className="space-y-4 text-left">
                  {sorteo?.estado === "completo" && (
                    <div className="card-lux px-5 py-4">
                      <h3 className="text-base font-semibold text-gold-solid mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {contenido.hero_completo_titulo}
                      </h3>
                      <p className="text-sm text-silver-muted">
                        {contenido.hero_completo_descripcion}
                      </p>
                      {sorteo.fecha_sorteo_realizado && (
                        <p className="text-xs text-silver-muted opacity-70 mt-1">
                          Prendas completadas el{" "}
                          {new Date(
                            sorteo.fecha_sorteo_realizado,
                          ).toLocaleDateString("es-AR")}
                        </p>
                      )}
                    </div>
                  )}

                  {sorteo?.estado === "sorteado" && (
                    <div className="border-gold-gradient px-5 py-4">
                      <h3 className="text-base font-semibold text-gold-solid mb-2 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        {contenido.hero_sorteado_titulo}
                      </h3>
                      {sorteo.numero_ganador && (
                        <div className="space-y-1.5">
                          {sorteo.ganador_nombre && (
                            <p className="text-sm text-silver">
                              Ganador:{" "}
                              <span className="font-semibold text-gold-solid">
                                {sorteo.ganador_nombre}
                              </span>
                            </p>
                          )}
                          <p className="text-sm text-silver">
                            Número Ganador:{" "}
                            <span className="font-mono font-bold text-gold-solid text-lg">
                              {sorteo.numero_ganador}
                            </span>
                          </p>
                          <p className="text-xs text-silver-muted">
                            Según la Quiniela de Buenos Aires del{" "}
                            {sorteo.updated_at &&
                              new Date(sorteo.updated_at).toLocaleDateString(
                                "es-AR",
                              )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {(sorteo?.estado === "cerrado" ||
                    (sorteo?.estado &&
                      !sorteo.estado.match(/completo|sorteado/))) && (
                    <div className="card-lux-silver px-5 py-4">
                      <h3 className="text-base font-semibold text-silver mb-1">
                        {contenido.hero_cerrado_titulo}
                      </h3>
                      <p className="text-sm text-silver-muted">
                        {contenido.hero_cerrado_descripcion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CTAs */}
              {!sorteoCompleto && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <a
                    href="#packs"
                    className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {contenido.packs_comprar_boton}
                  </a>
                  <a
                    href="#premios"
                    className="btn-silver inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm tracking-wide"
                  >
                    Ver premios
                    <ChevronDown className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Showcase del premio a la derecha */}
            <div
              className={`relative transition-all duration-700 delay-200 ${
                animacionVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <div className="relative">
                <IphoneCarousel />

                {/* Floating badge */}
                <div className="absolute -top-4 inset-x-0 mx-auto w-fit lg:inset-x-auto lg:-right-2 lg:mx-0 btn-gold px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.2em] uppercase z-30 flex items-center gap-1.5 shadow-lg">
                  <Trophy className="w-3 h-3" />
                  {contenido.hero_badge}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Packs */}
      {!sorteoCompleto && (
        <section id="packs" className="py-20 scroll-mt-16">
          <div className="divider-gold max-w-4xl mx-auto mb-20" />
          <div className="container mx-auto px-4">
            <Reveal className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid mb-3">
                Elegí tus números
              </p>
              <h2 className="text-4xl lg:text-5xl font-lux text-silver">
                Compra tus números
              </h2>
            </Reveal>

            <div className="flex flex-wrap justify-center gap-5 max-w-5xl mx-auto items-stretch">
              {PACKS.map((pack, index) => (
                <Reveal
                  key={pack.chances}
                  delay={index * 100}
                  className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] flex"
                >
                  <div
                    className={`relative flex flex-col w-full p-7 text-center ${
                      pack.popular ? "border-gold-gradient" : "card-lux-silver"
                    }`}
                  >
                    {pack.popular && (
                      <span className="btn-gold absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                        {contenido.packs_popular_label}
                      </span>
                    )}

                    <p className="flex items-center justify-center gap-3 text-5xl font-lux font-semibold text-gold mt-2">
                      <BookOpen
                        className="w-9 h-9 text-gold-solid"
                        strokeWidth={1.5}
                      />
                      {pack.libros}
                    </p>
                    <p className="text-xs uppercase tracking-[0.25em] text-silver-muted mt-1 mb-4">
                      {pack.libros === 1 ? "Libro" : "Libros"}
                    </p>

                    <div className="divider-silver mb-4" />

                    <p className="flex items-center justify-center gap-2 text-sm leading-relaxed flex-1 text-silver">
                      Te regalo {pack.chances}{" "}
                      {pack.chances === 1 ? "número" : "números"}
                      <Car
                        className="w-5 h-5 text-gold-solid"
                        strokeWidth={1.5}
                      />
                    </p>

                    <p className="text-3xl font-semibold text-gold-solid mt-5">
                      ${pack.precio.toLocaleString()}
                    </p>

                    <button
                      onClick={() => handleCompra(pack)}
                      className={`mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold tracking-wide w-full ${
                        pack.popular ? "btn-gold" : "btn-silver"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {contenido.packs_comprar_boton}
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>

            {PACKS.length > 1 && (
              <Reveal delay={200}>
                <p className="text-xs text-silver-muted text-center tracking-wide mt-8">
                  {contenido.packs_nota}
                </p>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* Sección de Premios */}
      <section id="premios" className="py-20 scroll-mt-16">
        <div className="divider-silver max-w-4xl mx-auto mb-20" />
        <div className="container mx-auto px-4">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid mb-3">
              {contenido.premios_kicker}
            </p>
            <h2 className="text-5xl lg:text-6xl font-lux text-gold">
              {contenido.premios_titulo}
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* 1er Premio */}
            <Reveal variant="left">
              <div className="border-gold-gradient p-8 text-center h-full flex flex-col justify-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid mb-3">
                  {contenido.premios_primer_label}
                </p>
                <p className="text-2xl lg:text-3xl font-lux text-silver">
                  {sorteo.titulo_remera || "Remera Exclusiva"}
                </p>
              </div>
            </Reveal>

            {/* Premios Secundarios */}
            {premiosSecundarios?.visible &&
              premiosSecundarios.numeros.length > 0 && (
                <Reveal variant="right" delay={100}>
                  <div className="card-lux p-6 md:p-8 h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-4 h-4 text-[#d4af37]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid">
                        {contenido.premios_sec_label}
                      </p>
                    </div>

                    <p className="text-base font-semibold text-silver mb-4">
                      {premiosSecundarios.titulo}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {premiosSecundarios.numeros.map((num) => (
                        <span
                          key={num}
                          className="chip-gold font-mono font-bold text-xl rounded-lg px-4 py-1.5"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-silver-muted leading-relaxed">
                      {contenido.premios_sec_descripcion
                        .split("{monto}")
                        .map((parte, i, partes) => (
                          <span key={i}>
                            {parte}
                            {i < partes.length - 1 && (
                              <span className="font-semibold text-silver">
                                {premiosSecundarios.monto}
                              </span>
                            )}
                          </span>
                        ))}
                    </p>
                  </div>
                </Reveal>
              )}
          </div>
        </div>
      </section>

      {/* Sección FAQ */}
      <section className="py-20">
        <div className="divider-silver max-w-4xl mx-auto mb-20" />
        <div className="container mx-auto px-4 max-w-2xl">
          <Reveal>
            <h2 className="text-4xl lg:text-5xl font-lux text-silver mb-12 text-center">
              {contenido.faq_titulo}
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-5">
            <Reveal variant="left">
              <div className="card-lux-silver p-6 h-full">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-solid mb-3">
                  {contenido.faq_pregunta_fecha}
                </p>
                <span className="text-silver text-lg font-medium">
                  {sorteo?.fecha_sorteo
                    ? `${new Date(
                        sorteo.fecha_sorteo + "T12:00:00",
                      ).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })} o ${
                        contenido.faq_respuesta_fecha_pendiente
                          .charAt(0)
                          .toLowerCase() +
                        contenido.faq_respuesta_fecha_pendiente.slice(1)
                      }`
                    : contenido.faq_respuesta_fecha_pendiente}
                </span>
              </div>
            </Reveal>

            <Reveal variant="right" delay={100}>
              <Link
                href={contenido.faq_link_quiniela}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <div className="card-lux p-6 h-full cursor-pointer">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-solid mb-3">
                    {contenido.faq_pregunta_ganador}
                  </p>
                  <span className="text-gold-solid text-base font-medium underline-offset-4 hover:underline">
                    {contenido.faq_respuesta_ganador}
                  </span>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Sección Consultá tus números */}
      <section id="consulta" className="py-20 scroll-mt-16">
        <div className="divider-gold max-w-4xl mx-auto mb-20" />
        <div className="container mx-auto px-4 max-w-xl">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid mb-3">
              {contenido.consulta_kicker}
            </p>
            <h2 className="text-4xl lg:text-5xl font-lux text-silver mb-3">
              {contenido.consulta_titulo}
            </h2>
            <p className="text-silver-muted text-sm">
              {contenido.consulta_descripcion}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <form
              onSubmit={consultarMisNumeros}
              className="flex flex-col sm:flex-row gap-2 mb-6"
            >
              <input
                type="email"
                value={consultaEmail}
                onChange={(e) => setConsultaEmail(e.target.value)}
                placeholder={contenido.consulta_placeholder}
                disabled={consultaLoading}
                className="input-lux flex-1 rounded-full px-5 py-3 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={consultaLoading || !consultaEmail.trim()}
                className="btn-gold px-7 py-3 rounded-full text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none whitespace-nowrap"
              >
                {consultaLoading ? "Buscando..." : contenido.consulta_boton}
              </button>
            </form>
          </Reveal>

          {consultaError && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 text-center text-red-400 text-sm mb-4">
              {consultaError}
            </div>
          )}

          {consultaResultados !== null && consultaResultados.length === 0 && (
            <div className="card-lux-silver p-6 text-center">
              <p className="text-silver-muted text-sm">
                {contenido.consulta_vacio}
              </p>
              <p className="text-silver-muted text-xs mt-2 opacity-70">
                {contenido.consulta_vacio_nota}
              </p>
            </div>
          )}

          {consultaResultados !== null && consultaResultados.length > 0 && (
            <div className="space-y-4">
              {consultaResultados.map((p) => (
                <div key={p.id} className="card-lux p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <p className="text-silver font-semibold">{p.nombre}</p>
                      <p className="text-silver-muted text-xs mt-0.5">
                        {p.sorteo_nombre}
                      </p>
                    </div>
                    <span className="text-xs text-silver-muted">
                      {new Date(p.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-solid mb-3">
                    Tus {p.cantidad_chances} números asignados
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...p.numeros_asignados]
                      .sort((a, b) => a - b)
                      .map((numero) => (
                        <span
                          key={numero}
                          className="chip-gold font-mono font-semibold px-3 py-1 rounded text-sm"
                        >
                          {numero}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ganadores Express */}
      {sorteo && (
        <GanadoresExpress sorteoId={sorteo.id} contenido={contenido} />
      )}

      {/* Ganadores Pasados: reemplazado por el Mural de Ganadores (a pedido de Facu).
          Dejar comentado por si se quiere reactivar en el futuro. */}
      {/* <GanadoresPasados contenido={contenido} /> */}

      {/* Mural de Ganadores Anteriores (collage de fotos) */}
      <MuralGanadores />

      {/* Links de interés / Redes sociales */}
      <RedesSociales contenido={contenido} />

      {/* Footer */}
      <footer className="py-12">
        <div className="divider-gold max-w-5xl mx-auto mb-10" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="text-lg font-lux font-semibold text-gold tracking-wide">
              {contenido.marca}
            </span>
            <div className="flex space-x-6">
              <Link
                href={contenido.whatsapp_url}
                className="text-silver-muted hover:text-gold-solid transition-colors text-sm"
              >
                Contacto
              </Link>
              <Link
                href="/terminos"
                className="text-silver-muted hover:text-gold-solid transition-colors text-sm"
              >
                Términos
              </Link>
            </div>
          </div>
          <div className="border-t border-[#c8cdd5]/10 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-silver-muted text-xs opacity-70">
              {contenido.footer_copyright}
            </p>
            <Link
              href="https://linktr.ee/deweertstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-silver-muted text-xs opacity-70 hover:opacity-100 hover:text-gold-solid transition-all"
            >
              Desarrollado por De Weert Studio
            </Link>
          </div>
        </div>
      </footer>

      <CompraModalNuevo
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        pack={packSeleccionado}
        onCompraMercadoPago={procesarCompra}
        onCompraTransferencia={procesarTransferencia}
      />

      <Toaster />
    </div>
  )
}
