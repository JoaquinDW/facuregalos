import { BaileysProvider } from "./baileys-provider"
import { CloudApiProvider } from "./cloud-api-provider"
import { TwilioProvider } from "./twilio-provider"
import type { WhatsAppProvider } from "./types"

// Factory: devuelve la implementación del provider según WHATSAPP_PROVIDER.
// Default: "twilio". Cambiar de proveedor = cambiar el env var, sin tocar
// el resto del código.
export function getWhatsAppProvider(): WhatsAppProvider {
  const provider = (process.env.WHATSAPP_PROVIDER || "twilio").toLowerCase()

  switch (provider) {
    case "baileys":
      return new BaileysProvider()
    case "cloud":
    case "cloud-api":
    case "meta":
      return new CloudApiProvider()
    case "twilio":
    default:
      return new TwilioProvider()
  }
}

export type {
  WhatsAppProvider,
  EnviarAprobacionParams,
  SendWhatsAppResult,
  MensajeAprobacionData,
  WhatsAppProviderName,
} from "./types"
export { construirMensajeAprobacion } from "./mensaje"
export { normalizarTelefonoAR, esNumeroTelefono } from "./normalizar"
