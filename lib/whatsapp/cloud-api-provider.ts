import type { SendWhatsAppParams, SendWhatsAppResult, WhatsAppProvider } from "./types"

// Placeholder del provider oficial de Meta (WhatsApp Cloud API).
// A futuro: usar WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID para llamar
// directo a la Graph API (no necesita microservicio, corre en Vercel).
// Por ahora no está implementado.
export class CloudApiProvider implements WhatsAppProvider {
  async sendMessage(_params: SendWhatsAppParams): Promise<SendWhatsAppResult> {
    return { success: false, error: "CloudApiProvider no implementado todavía" }
  }
}
