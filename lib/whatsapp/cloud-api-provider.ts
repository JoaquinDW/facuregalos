import type { EnviarAprobacionParams, SendWhatsAppResult, WhatsAppProvider } from "./types"

// Placeholder del provider oficial de Meta (WhatsApp Cloud API).
// A futuro: usar WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID para llamar
// directo a la Graph API (no necesita microservicio, corre en Vercel).
// Por ahora no está implementado (se usa Twilio).
export class CloudApiProvider implements WhatsAppProvider {
  async enviarTransferenciaAprobada(_params: EnviarAprobacionParams): Promise<SendWhatsAppResult> {
    return { success: false, provider: "twilio", error: "CloudApiProvider no implementado todavía" }
  }
}
