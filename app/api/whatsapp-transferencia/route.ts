import { NextRequest, NextResponse } from "next/server"
import { getWhatsAppProvider } from "@/lib/whatsapp"
import { obtenerConfiguracionWhatsApp, registrarEnvioWhatsApp } from "@/lib/database"

// Envía la confirmación de transferencia aprobada por WhatsApp a través de la
// capa de providers (este route no sabe si detrás está Twilio o Baileys) y
// registra el envío para la facturación a Facu.
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

    const provider = getWhatsAppProvider()
    const resultado = await provider.enviarTransferenciaAprobada({
      telefono: data.telefono,
      nombre: data.nombre,
      cantidadChances: data.cantidadChances,
      numerosAsignados: data.numerosAsignados || [],
      precioPagado: data.precioPagado,
      nombreSorteo: data.nombreSorteo || "Sorteo",
      comprobanteUrl,
      compradorId: data.compradorId,
    })

    // Registrar el envío (snapshot del costo unitario actual) para el reporte.
    const config = await obtenerConfiguracionWhatsApp()
    await registrarEnvioWhatsApp({
      comprador_id: data.compradorId,
      sorteo_id: data.sorteoId ?? null,
      telefono: data.telefono,
      provider: resultado.provider,
      provider_message_id: resultado.providerMessageId ?? null,
      estado: resultado.success ? "enviado" : "error",
      costo_unitario: config.costoUnitario,
      moneda: config.moneda,
    })

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
