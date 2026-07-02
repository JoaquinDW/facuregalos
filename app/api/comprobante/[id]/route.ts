import { NextRequest, NextResponse } from "next/server"
import { obtenerCompradorPorId } from "@/lib/database"

// Devuelve los datos mínimos para renderizar el comprobante público.
// El id del comprador es un UUID, suficientemente no-adivinable para usarse
// como token del link enviado por WhatsApp.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comprador = await obtenerCompradorPorId(id)

    if (!comprador) {
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 })
    }

    // Solo mostrar comprobante de compras efectivamente pagadas
    if (comprador.estado_pago !== "pagado") {
      return NextResponse.json({ error: "El pago aún no fue confirmado" }, { status: 403 })
    }

    return NextResponse.json({
      premio: comprador.sorteo_nombre || "Sorteo",
      comprador: {
        nombre: comprador.nombre,
        numeros_asignados: comprador.numeros_asignados || [],
        cantidad_chances: comprador.cantidad_chances,
        created_at: comprador.created_at,
        email: comprador.email ?? null,
        telefono: comprador.telefono ?? null,
        instagram_username: comprador.instagram_username ?? null,
        precio_pagado: comprador.precio_pagado ?? null,
      },
    })
  } catch (error) {
    console.error("Error en API de comprobante:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
