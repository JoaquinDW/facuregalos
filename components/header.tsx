"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"

const NAV_LINKS = [
  { href: "#packs", label: "Packs" },
  { href: "#premios", label: "Premios" },
  { href: "#consulta", label: "Mis números" },
  { href: "#ganadores", label: "Ganadores" },
  { href: "/libros", label: "Libros" },
]

export function Header({ marca = "Facuregalos" }: { marca?: string }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#0c0b09]/90 backdrop-blur-md border-b border-[#d4af37]/15">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            {/* <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-[#d4af37]/40 group-hover:ring-[#d4af37]/80 transition-all duration-300">
              <Image src="/facuregalos.jpeg" alt={marca} fill className="object-cover" />
            </div> */}
            <span className="text-xl font-lux font-semibold text-gold tracking-wide">
              {marca}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-silver-muted hover:text-gold-solid transition-colors duration-200 text-sm tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            className="md:hidden text-silver-muted hover:text-gold-solid transition-colors p-2"
          >
            {menuAbierto ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuAbierto && (
          <div className="md:hidden py-4 border-t border-[#d4af37]/10">
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-silver-muted hover:text-gold-solid transition-colors duration-200 px-2 py-2 text-sm tracking-wide"
                  onClick={() => setMenuAbierto(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
