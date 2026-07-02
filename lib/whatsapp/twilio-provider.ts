import type { EnviarAprobacionParams, SendWhatsAppResult, WhatsAppProvider } from "./types"
import { normalizarTelefonoAR } from "./normalizar"

// Provider oficial vía Twilio. Corre en Vercel (solo HTTP, sin microservicio).
// Para mensajes iniciados por el negocio, WhatsApp exige una plantilla aprobada:
// en Twilio es un "Content Template" referenciado por ContentSid + ContentVariables.
//
// Las variables de la plantilla se mapean por índice ("1".."6"). El orden acá
// debe coincidir con el orden de {{1}}..{{n}} definido al crear la plantilla:
//   1: nombre        2: nombreSorteo   3: cantidadChances
//   4: números       5: monto          6: compradorId (suffix del botón URL)
export class TwilioProvider implements WhatsAppProvider {
  private readonly accountSid: string
  private readonly authToken: string
  private readonly from: string
  private readonly contentSid: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || ""
    this.authToken = process.env.TWILIO_AUTH_TOKEN || ""
    this.from = process.env.TWILIO_WHATSAPP_FROM || ""
    this.contentSid = process.env.TWILIO_CONTENT_SID || ""
  }

  async enviarTransferenciaAprobada(params: EnviarAprobacionParams): Promise<SendWhatsAppResult> {
    if (!this.accountSid || !this.authToken || !this.from || !this.contentSid) {
      return {
        success: false,
        provider: "twilio",
        error: "Faltan credenciales de Twilio (TWILIO_ACCOUNT_SID/AUTH_TOKEN/WHATSAPP_FROM/CONTENT_SID)",
      }
    }

    const numero = normalizarTelefonoAR(params.telefono)
    if (!numero) {
      return { success: false, provider: "twilio", error: `Teléfono inválido: ${params.telefono}` }
    }

    const numeros = [...params.numerosAsignados].sort((a, b) => a - b).join(", ")
    const monto =
      params.precioPagado != null ? `$${params.precioPagado.toLocaleString("es-AR")}` : ""

    const contentVariables = JSON.stringify({
      "1": params.nombre,
      "2": params.nombreSorteo,
      "3": String(params.cantidadChances),
      "4": numeros,
      "5": monto,
      "6": params.compradorId,
    })

    const body = new URLSearchParams({
      To: `whatsapp:+${numero}`,
      ContentSid: this.contentSid,
      ContentVariables: contentVariables,
    })

    // El remitente puede ser un número (`whatsapp:+...`) o un Messaging Service SID (`MG...`).
    if (this.from.startsWith("MG")) {
      body.set("MessagingServiceSid", this.from)
    } else {
      body.set("From", this.from.startsWith("whatsapp:") ? this.from : `whatsapp:${this.from}`)
    }

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        },
      )

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return {
          success: false,
          provider: "twilio",
          error: json?.message || `Twilio respondió ${res.status}`,
        }
      }

      return { success: true, provider: "twilio", providerMessageId: json?.sid }
    } catch (error) {
      return {
        success: false,
        provider: "twilio",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}
