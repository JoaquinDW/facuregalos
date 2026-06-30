import { BaileysProvider } from "./baileys-provider"
import { CloudApiProvider } from "./cloud-api-provider"
import type { WhatsAppProvider } from "./types"

// Factory: devuelve la implementación del provider según WHATSAPP_PROVIDER.
// Default: "baileys". Cambiar de proveedor = cambiar el env var, sin tocar
// el resto del código.
export function getWhatsAppProvider(): WhatsAppProvider {
  const provider = (process.env.WHATSAPP_PROVIDER || "baileys").toLowerCase()

  switch (provider) {
    case "cloud":
    case "cloud-api":
    case "meta":
      return new CloudApiProvider()
    case "baileys":
    default:
      return new BaileysProvider()
  }
}

export type {
  WhatsAppProvider,
  SendWhatsAppParams,
  SendWhatsAppResult,
  MensajeAprobacionData,
} from "./types"
export { construirMensajeAprobacion } from "./mensaje"
export { normalizarTelefonoAR, esNumeroTelefono } from "./normalizar"
