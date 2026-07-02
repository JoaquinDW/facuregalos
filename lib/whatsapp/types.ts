// Interfaz común para los proveedores de envío de WhatsApp.
// El resto de la app solo conoce esta interfaz; las implementaciones
// concretas (Twilio, Baileys) viven detrás del factory en index.ts.

/** Datos necesarios para construir el mensaje de transferencia aprobada. */
export interface MensajeAprobacionData {
  nombre: string
  cantidadChances: number
  numerosAsignados: number[]
  precioPagado: number
  nombreSorteo: string
  /** Link público a la página del comprobante. */
  comprobanteUrl: string
  /** Id del comprador (usado como suffix del botón/link en plantillas). */
  compradorId: string
}

export interface EnviarAprobacionParams extends MensajeAprobacionData {
  /** Teléfono tal como viene del comprador (sin normalizar). */
  telefono: string
}

export type WhatsAppProviderName = "twilio" | "baileys"

export interface SendWhatsAppResult {
  success: boolean
  error?: string
  provider: WhatsAppProviderName
  /** Identificador del mensaje en el proveedor (ej. sid de Twilio). */
  providerMessageId?: string
}

export interface WhatsAppProvider {
  enviarTransferenciaAprobada(params: EnviarAprobacionParams): Promise<SendWhatsAppResult>
}
