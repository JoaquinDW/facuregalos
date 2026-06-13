"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, ExternalLink, Mail, Search, Lock, Check, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { obtenerLibrosPorEmail, reclamarLibro } from "@/lib/database"
import type { LibroDigital } from "@/lib/supabase"

export default function LibrosPage() {
  const [email, setEmail] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<{ libros: LibroDigital[]; cuota: number } | null>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [reclamados, setReclamados] = useState<Set<string>>(new Set())

  const [libroAConfirmar, setLibroAConfirmar] = useState<LibroDigital | null>(null)
  const [reclamando, setReclamando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas")
  const [query, setQuery] = useState("")
  const [pagina, setPagina] = useState(1)

  const POR_PAGINA = 20

  const buscarLibros = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setBuscando(true)
    setNoEncontrado(false)
    setResultado(null)
    setErrorMsg(null)
    setCategoriaActiva("todas")
    setQuery("")
    setPagina(1)

    const res = await obtenerLibrosPorEmail(email.trim().toLowerCase())
    if (res) {
      setResultado({ libros: res.libros, cuota: res.cuota })
      setReclamados(new Set(res.reclamados))
    } else {
      setNoEncontrado(true)
    }
    setBuscando(false)
  }

  const confirmarReclamo = async () => {
    if (!libroAConfirmar) return
    setReclamando(true)
    setErrorMsg(null)

    const res = await reclamarLibro(email.trim().toLowerCase(), libroAConfirmar.id)
    if (res.ok) {
      const drive = libroAConfirmar.link_drive
      setReclamados((prev) => new Set(prev).add(libroAConfirmar.id))
      setLibroAConfirmar(null)
      // Abrir el Drive en una pestaña nueva. Si el navegador lo bloquea,
      // el libro ya quedó marcado como elegido y se puede abrir desde su tarjeta.
      window.open(drive, "_blank", "noopener,noreferrer")
    } else if (res.error === "sin_saldo") {
      setErrorMsg("Ya usaste todo tu saldo de libros.")
      setLibroAConfirmar(null)
    } else {
      setErrorMsg("Hubo un problema al elegir el libro. Intentá de nuevo.")
    }
    setReclamando(false)
  }

  const saldoUsado = reclamados.size
  const cuotaAlcanzada = resultado ? saldoUsado >= resultado.cuota : false

  const categorias = resultado
    ? (Array.from(new Set(resultado.libros.map((l) => l.categoria).filter(Boolean))) as string[]).sort()
    : []
  const librosFiltrados = resultado
    ? resultado.libros.filter((l) => {
        const okCat = categoriaActiva === "todas" || l.categoria === categoriaActiva
        const okQuery = !query.trim() || l.nombre.toLowerCase().includes(query.trim().toLowerCase())
        return okCat && okQuery
      })
    : []

  const totalPaginas = Math.max(1, Math.ceil(librosFiltrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const librosPagina = librosFiltrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  const cambiarFiltro = (fn: () => void) => {
    fn()
    setPagina(1)
  }

  return (
    <div className="min-h-screen bg-lux">
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full px-4 py-1.5 mb-4">
            <BookOpen className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-medium tracking-wide">Regalo exclusivo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-lux font-bold text-gold mb-4">
            Biblioteca Digital
          </h1>
          <p className="text-silver-muted text-lg max-w-xl mx-auto">
            Con cada participación recibís libros digitales de regalo. Ingresá tu email para ver cuántos te corresponden.
          </p>
        </div>

        {/* Email lookup */}
        {!resultado && (
          <div className="max-w-md mx-auto">
            <form onSubmit={buscarLibros} className="flex flex-col gap-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-[#d4af37]/20 text-silver placeholder:text-silver-muted focus:outline-none focus:border-[#d4af37]/60 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={buscando}
                className="btn-gold flex items-center justify-center gap-2 py-3 rounded-xl font-medium disabled:opacity-60"
              >
                <Search className="w-4 h-4" />
                {buscando ? "Buscando..." : "Ver mis libros"}
              </button>
            </form>

            {noEncontrado && (
              <div className="mt-6 text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-silver-muted text-sm">
                  No encontramos compras asociadas a ese email.
                </p>
                <Link href="/" className="text-gold text-sm hover:underline mt-1 inline-block">
                  ¿Todavía no participás? Comprá tu número →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {resultado && (
          <div>
            {/* Saldo banner */}
            <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-silver-muted text-sm mb-1">Tu saldo de libros</p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          i < saldoUsado
                            ? "border-[#d4af37] bg-[#d4af37]/20"
                            : i < resultado.cuota
                            ? "border-[#d4af37]/40 bg-transparent"
                            : "border-white/10 bg-transparent opacity-30"
                        }`}
                      >
                        {i < saldoUsado && <Check className="w-4 h-4 text-gold" />}
                        {i >= saldoUsado && i < resultado.cuota && (
                          <BookOpen className="w-3.5 h-3.5 text-[#d4af37]/60" />
                        )}
                        {i >= resultado.cuota && <Lock className="w-3.5 h-3.5 text-white/20" />}
                      </div>
                    ))}
                  </div>
                  <span className="text-silver text-sm">
                    {saldoUsado} de {resultado.cuota} libro{resultado.cuota !== 1 ? "s" : ""} elegido{saldoUsado !== 1 ? "s" : ""}
                  </span>
                </div>
                {resultado.cuota < 3 && (
                  <p className="text-silver-muted text-xs mt-1.5">
                    Comprando el pack superior desbloqueás hasta 3 libros.{" "}
                    <Link href="/" className="text-gold hover:underline">Participar →</Link>
                  </p>
                )}
              </div>

              <button
                onClick={() => { setResultado(null); setEmail(""); setReclamados(new Set()); setErrorMsg(null) }}
                className="text-silver-muted hover:text-silver text-sm transition-colors shrink-0"
              >
                Cambiar email
              </button>
            </div>

            {errorMsg && (
              <div className="max-w-5xl mx-auto mb-6 flex items-center gap-2 text-amber-300 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {resultado.libros.length === 0 ? (
              <div className="text-center py-16 text-silver-muted">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Los libros estarán disponibles pronto.</p>
              </div>
            ) : (
              <>
                {cuotaAlcanzada && (
                  <p className="text-center text-silver-muted text-sm mb-6 max-w-xl mx-auto">
                    Ya elegiste tus {resultado.cuota} libro{resultado.cuota !== 1 ? "s" : ""}. Hacé click en los que elegiste para descargarlos cuando quieras.
                    Si tuviste algún problema, escribinos por WhatsApp.
                  </p>
                )}

                {/* Filtros compactos: buscador + categoría */}
                <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-muted" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => cambiarFiltro(() => setQuery(e.target.value))}
                      placeholder="Buscar por título..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-[#d4af37]/20 text-silver placeholder:text-silver-muted text-sm focus:outline-none focus:border-[#d4af37]/60 transition-colors"
                    />
                  </div>
                  {categorias.length > 1 && (
                    <select
                      value={categoriaActiva}
                      onChange={(e) => cambiarFiltro(() => setCategoriaActiva(e.target.value))}
                      className="sm:w-64 px-3 py-2.5 rounded-xl bg-white/5 border border-[#d4af37]/20 text-silver text-sm focus:outline-none focus:border-[#d4af37]/60 transition-colors cursor-pointer"
                    >
                      <option value="todas" className="bg-[#15130e]">Todas las categorías</option>
                      {categorias.map((cat) => (
                        <option key={cat} value={cat} className="bg-[#15130e]">{cat}</option>
                      ))}
                    </select>
                  )}
                </div>

                {librosFiltrados.length === 0 ? (
                  <p className="text-center text-silver-muted text-sm py-12">
                    No hay libros que coincidan con tu búsqueda.
                  </p>
                ) : (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-5xl mx-auto">
                  {librosPagina.map((libro) => {
                    const elegido = reclamados.has(libro.id)
                    const bloqueado = !elegido && cuotaAlcanzada

                    const cover = (
                      <div
                        className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1812] mb-3 transition-all duration-300 border-2 ${
                          elegido
                            ? "border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                            : "border-[#d4af37]/10 group-hover:border-[#d4af37]/40"
                        }`}
                      >
                        {libro.imagen_url ? (
                          <Image
                            src={libro.imagen_url}
                            alt={libro.nombre}
                            fill
                            className={`object-cover transition-transform duration-300 ${!bloqueado ? "group-hover:scale-105" : ""}`}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <BookOpen className="w-10 h-10 text-[#d4af37]/20" />
                          </div>
                        )}
                        {elegido && (
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 opacity-100 group-hover:bg-black/55 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-[#d4af37] flex items-center justify-center">
                              <Check className="w-5 h-5 text-black" />
                            </div>
                            <span className="flex items-center gap-1 text-white text-xs font-medium">
                              <ExternalLink className="w-3 h-3" />
                              Descargar
                            </span>
                          </div>
                        )}
                        {bloqueado && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                        {!elegido && !bloqueado && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Elegir</span>
                          </div>
                        )}
                      </div>
                    )

                    const info = (
                      <>
                        <p className={`text-sm font-medium leading-tight line-clamp-2 transition-colors duration-200 ${elegido ? "text-gold-solid" : "text-silver group-hover:text-gold-solid"}`}>
                          {libro.nombre}
                        </p>
                        {libro.descripcion && (
                          <p className="text-xs text-silver-muted mt-1 line-clamp-1">{libro.descripcion}</p>
                        )}
                      </>
                    )

                    // Ya elegido → link directo de re-descarga
                    if (elegido) {
                      return (
                        <a
                          key={libro.id}
                          href={libro.link_drive}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block text-left"
                        >
                          {cover}
                          {info}
                        </a>
                      )
                    }

                    // No elegido → botón que abre la confirmación (o bloqueado)
                    return (
                      <button
                        key={libro.id}
                        onClick={() => !bloqueado && setLibroAConfirmar(libro)}
                        disabled={bloqueado}
                        className={`group block text-left transition-all ${bloqueado ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {cover}
                        {info}
                      </button>
                    )
                  })}
                </div>

                {/* Paginado */}
                {totalPaginas > 1 && (
                  <div className="max-w-5xl mx-auto mt-10 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="flex items-center gap-1 text-sm text-silver-muted hover:text-gold disabled:opacity-30 disabled:hover:text-silver-muted transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <span className="text-silver text-sm tabular-nums">
                      Página {paginaActual} de {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="flex items-center gap-1 text-sm text-silver-muted hover:text-gold disabled:opacity-30 disabled:hover:text-silver-muted transition-colors"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                </>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Confirmación de elección */}
      {libroAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#15130e] border border-[#d4af37]/25 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#d4af37]/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-gold leading-tight">{libroAConfirmar.nombre}</h3>
            </div>
            <p className="text-silver-muted text-sm mb-6">
              Una vez que elijas este libro se descuenta de tu saldo y <strong className="text-silver">no se puede cambiar</strong>. ¿Querés continuar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLibroAConfirmar(null)}
                disabled={reclamando}
                className="flex-1 py-2.5 rounded-xl border border-white/15 text-silver-muted hover:text-silver hover:border-white/30 transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarReclamo}
                disabled={reclamando}
                className="btn-gold flex-1 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60"
              >
                {reclamando ? "Procesando..." : "Elegir y descargar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center py-8 text-silver-muted text-sm border-t border-[#d4af37]/10 mt-16">
        <Link href="/" className="hover:text-gold-solid transition-colors">
          ← Volver al sorteo
        </Link>
      </footer>
    </div>
  )
}
