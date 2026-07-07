import { type NextRequest, NextResponse } from "next/server"
import { uploadToSupabase } from "@/lib/supabase-storage"
import { crearCompradorTransferencia } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const nombre = formData.get("nombre") as string
    const telefono = formData.get("telefono") as string
    const sorteoId = formData.get("sorteoId") as string
    const cantidadChances = Number.parseInt(formData.get("cantidadChances") as string)
    const comprobanteFile = formData.get("comprobante") as File

    // Validar datos requeridos
    if (!nombre || !sorteoId || !cantidadChances || !comprobanteFile) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Validar que el WhatsApp sea un número válido (obligatorio)
    if (!telefono || telefono.replace(/\D/g, "").length < 8) {
      return NextResponse.json(
        { error: "Debe proporcionar un número de WhatsApp válido" },
        { status: 400 }
      )
    }

    const filename = `${Date.now()}-${comprobanteFile.name}`
    const comprobanteUrl = await uploadToSupabase(comprobanteFile, "comprobantes", filename)

    // Crear registro pendiente de aprobación
    const nuevoComprador = await crearCompradorTransferencia({
      sorteoId,
      nombre,
      telefono,
      cantidadChances: cantidadChances,
      comprobanteUrl,
    })

    if (!nuevoComprador) {
      return NextResponse.json({ error: "Error creando comprador" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      compradorId: nuevoComprador.id,
      message: "Comprobante enviado correctamente. Recibirás una confirmación cuando revisemos tu pago.",
    })
  } catch (error) {
    console.error("Error procesando transferencia:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
