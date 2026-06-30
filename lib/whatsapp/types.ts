// Interfaz común para los proveedores de envío de WhatsApp.
// El resto de la app solo conoce esta interfaz; las implementaciones
// concretas (Baileys hoy, Cloud API oficial más adelante) viven detrás
// del factory en index.ts.

export interface SendWhatsAppParams {
  /** Teléfono tal como viene del comprador (sin normalizar). */
  telefono: string
  /** Texto del mensaje a enviar. */
  mensaje: string
}

export interface SendWhatsAppResult {
  success: boolean
  error?: string
}

export interface WhatsAppProvider {
  sendMessage(params: SendWhatsAppParams): Promise<SendWhatsAppResult>
}

/** Datos necesarios para construir el mensaje de transferencia aprobada. */
export interface MensajeAprobacionData {
  nombre: string
  cantidadChances: number
  numerosAsignados: number[]
  precioPagado: number
  nombreSorteo: string
  /** Link público a la página del comprobante. */
  comprobanteUrl: string
}
