import { NextRequest, NextResponse } from "next/server"
import { getWhatsAppProvider, construirMensajeAprobacion } from "@/lib/whatsapp"

// Envía la confirmación de transferencia aprobada por WhatsApp.
// Espejo de /api/email-transferencia, pero a través de la capa de providers
// (este route no sabe si detrás está Baileys o el Cloud API oficial).
export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()

    if (!data || !data.telefono || !data.compradorId) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (telefono, compradorId)" },
        { status: 400 }
      )
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://facuregalos.com").replace(/\/$/, "")
    const comprobanteUrl = `${siteUrl}/comprobante/${data.compradorId}`

    const mensaje = construirMensajeAprobacion({
      nombre: data.nombre,
      cantidadChances: data.cantidadChances,
      numerosAsignados: data.numerosAsignados || [],
      precioPagado: data.precioPagado,
      nombreSorteo: data.nombreSorteo || "Sorteo",
      comprobanteUrl,
    })

    const provider = getWhatsAppProvider()
    const resultado = await provider.sendMessage({ telefono: data.telefono, mensaje })

    if (!resultado.success) {
      return NextResponse.json(
        { error: "Error enviando WhatsApp", details: resultado.error },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en API de WhatsApp transferencia:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
