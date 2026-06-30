import type { SendWhatsAppParams, SendWhatsAppResult, WhatsAppProvider } from "./types"
import { normalizarTelefonoAR } from "./normalizar"

// Provider basado en la librería no oficial Baileys.
// No tiene lógica de WhatsApp en sí: normaliza el número y reenvía el envío al
// microservicio always-on (whatsapp-service/) que mantiene la sesión viva.
export class BaileysProvider implements WhatsAppProvider {
  private readonly serviceUrl: string
  private readonly secret: string

  constructor() {
    this.serviceUrl = process.env.WHATSAPP_SERVICE_URL || ""
    this.secret = process.env.WHATSAPP_SERVICE_SECRET || ""
  }

  async sendMessage({ telefono, mensaje }: SendWhatsAppParams): Promise<SendWhatsAppResult> {
    if (!this.serviceUrl || !this.secret) {
      return { success: false, error: "WHATSAPP_SERVICE_URL/SECRET no configurados" }
    }

    const numero = normalizarTelefonoAR(telefono)
    if (!numero) {
      return { success: false, error: `Teléfono inválido: ${telefono}` }
    }

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
        return { success: false, error: body?.error || `Servicio respondió ${res.status}` }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}
