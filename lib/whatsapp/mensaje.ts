import type { MensajeAprobacionData } from "./types"

// Construye el texto del mensaje de WhatsApp para una transferencia aprobada.
// Compartido entre todos los providers para que el contenido no se duplique.
export function construirMensajeAprobacion(data: MensajeAprobacionData): string {
  const numeros = [...data.numerosAsignados].sort((a, b) => a - b).join(", ")
  const monto = data.precioPagado != null ? `$${data.precioPagado.toLocaleString("es-AR")}` : null

  const lineas = [
    `✅ *¡Transferencia aprobada!*`,
    ``,
    `Hola ${data.nombre}, confirmamos tu participación en *${data.nombreSorteo}* 🎉`,
    ``,
    `🎟️ *Chances:* ${data.cantidadChances}`,
    `🔢 *Tus números:* ${numeros}`,
  ]

  if (monto) lineas.push(`💰 *Total pagado:* ${monto}`)

  lineas.push(
    ``,
    `📄 Descargá tu comprobante acá:`,
    data.comprobanteUrl,
    ``,
    `¡Mucha suerte! 🍀`,
    `_Facuregalos_`,
  )

  return lineas.join("\n")
}
