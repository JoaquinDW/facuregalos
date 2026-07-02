import type { EnviarAprobacionParams, SendWhatsAppResult, WhatsAppProvider } from "./types"
import { construirMensajeAprobacion } from "./mensaje"
import { normalizarTelefonoAR } from "./normalizar"

// Provider basado en la librería no oficial Baileys.
// No tiene lógica de WhatsApp en sí: normaliza el número, arma el texto y lo
// reenvía al microservicio always-on (whatsapp-service/) que mantiene la sesión.
export class BaileysProvider implements WhatsAppProvider {
  private readonly serviceUrl: string
  private readonly secret: string

  constructor() {
    this.serviceUrl = process.env.WHATSAPP_SERVICE_URL || ""
    this.secret = process.env.WHATSAPP_SERVICE_SECRET || ""
  }

  async enviarTransferenciaAprobada(params: EnviarAprobacionParams): Promise<SendWhatsAppResult> {
    if (!this.serviceUrl || !this.secret) {
      return { success: false, provider: "baileys", error: "WHATSAPP_SERVICE_URL/SECRET no configurados" }
    }

    const numero = normalizarTelefonoAR(params.telefono)
    if (!numero) {
      return { success: false, provider: "baileys", error: `Teléfono inválido: ${params.telefono}` }
    }

    const mensaje = construirMensajeAprobacion(params)

    try {
      const res = await fetch(`${this.serviceUrl.replace(/\/$/, "")}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secret}`,
        },
        body: JSON.stringify({ telefono: numero, mensaje }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body?.success) {
        return { success: false, provider: "baileys", error: body?.error || `Servicio respondió ${res.status}` }
      }
      return { success: true, provider: "baileys" }
    } catch (error) {
      return {
        success: false,
        provider: "baileys",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}
