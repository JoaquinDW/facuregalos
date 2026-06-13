import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"

const SECCIONES = [
  {
    titulo: "1. Objeto del Sitio",
    texto:
      "El presente sitio web tiene por finalidad la comercialización de productos digitales consistentes en diseños exclusivos de remeras en formato descargable.",
  },
  {
    titulo: "2. Productos Digitales",
    texto:
      "Cada compra corresponde al acceso a un archivo digital, sin entrega física. El comprador recibe una licencia de uso personal y no transferible del diseño adquirido.",
  },
  {
    titulo: "3. Propiedad Intelectual",
    texto:
      "Todos los diseños ofrecidos en este sitio son propiedad de Facuregalos y están protegidos por las leyes de propiedad intelectual.",
  },
  {
    titulo: "4. Medios de Pago",
    texto:
      "El pago de los productos digitales se realizará mediante las plataformas habilitadas en el sitio web.",
  },
  {
    titulo: "5. Modificaciones",
    texto:
      "Facuregalos se reserva el derecho de modificar los presentes términos y condiciones en cualquier momento.",
  },
  {
    titulo: "6. Ley de Lealtad Comercial",
    texto:
      "Sujeto sin obligación de compra ley de lealtad comercial 22802 república argentina.",
  },
  {
    titulo: "7. Premio Gratuito",
    texto:
      "El premio gratis por la compra de la remera digital se realiza por lotería de Buenos Aires cuando se venden todas las remeras digitales disponibles, y se anunciará por la página quién recibe el regalo 🎁🤩",
  },
  {
    titulo: "8. Requisitos para Ganar",
    texto:
      "Todos los ganadores, sin excepción, deben grabar un video claro y conciso que los identifique como ganadores del sorteo.",
  },
]

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-lux">
      <Header />

      {/* Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-solid mb-3">
              Información legal
            </p>
            <h1 className="text-4xl lg:text-5xl font-lux font-semibold text-gold">
              Términos y Condiciones
            </h1>
          </div>

          <div className="divider-gold max-w-md mx-auto mb-12" />

          <div className="card-lux p-7 sm:p-10">
            <div className="space-y-8">
              {SECCIONES.map((seccion) => (
                <section key={seccion.titulo}>
                  <h2 className="text-lg font-semibold text-gold-solid mb-2">
                    {seccion.titulo}
                  </h2>
                  <p className="text-silver leading-relaxed">
                    {seccion.texto}
                  </p>
                </section>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/"
              className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Inicio
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12">
        <div className="divider-gold max-w-5xl mx-auto mb-10" />
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-silver-muted text-xs opacity-70">
            &copy; 2025 Facuregalos. Todos los derechos reservados.
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
      </footer>
    </div>
  )
}
