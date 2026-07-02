export interface ComprobanteComprador {
  nombre: string
  numeros_asignados: number[]
  cantidad_chances: number
  created_at: string
  email?: string | null
  telefono?: string | null
  instagram_username?: string | null
  precio_pagado?: number | null
}

// Dibuja el comprobante en un canvas y lo devuelve (sin descargar).
// Los wrappers de abajo lo usan para descargar o para obtener un dataURL.
function dibujarComprobante(
  premio: string,
  comprador: ComprobanteComprador,
): HTMLCanvasElement | null {
  const ticketsPerRow = 5
  const ticketWidth = 130
  const ticketHeight = 65
  const ticketGap = 15

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const numRows = Math.ceil(comprador.cantidad_chances / ticketsPerRow)
  const ticketsAreaHeight = numRows * (ticketHeight + ticketGap) + ticketGap
  const estimatedHeight = 240 + 300 + 80 + ticketsAreaHeight + 200

  canvas.width = 800
  canvas.height = Math.max(1050, estimatedHeight)

  const C = {
    bg: "#0c0b09",
    goldLight: "#f0d98a",
    gold: "#d4af37",
    goldDeep: "#b8902f",
    goldBright: "#ffe9a8",
    silver: "#c8cdd5",
    silverMuted: "#9aa1ac",
    dark: "#1a1405",
  }

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    if (typeof (ctx as any).roundRect === "function") {
      ;(ctx as any).roundRect(x, y, w, h, r)
    } else {
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
    }
  }

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const glow = ctx.createRadialGradient(canvas.width / 2, 0, 0, canvas.width / 2, 0, canvas.width * 0.7)
  glow.addColorStop(0, "rgba(212, 175, 55, 0.16)")
  glow.addColorStop(1, "rgba(212, 175, 55, 0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, canvas.width, 320)

  ctx.strokeStyle = C.gold
  ctx.lineWidth = 3
  roundRect(16, 16, canvas.width - 32, canvas.height - 32, 24)
  ctx.stroke()

  const pillW = 320
  const pillH = 56
  const pillX = (canvas.width - pillW) / 2
  const pillY = 48
  const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY)
  pillGrad.addColorStop(0, C.goldLight)
  pillGrad.addColorStop(0.55, C.gold)
  pillGrad.addColorStop(1, C.goldDeep)
  ctx.fillStyle = pillGrad
  roundRect(pillX, pillY, pillW, pillH, 14)
  ctx.fill()
  ctx.fillStyle = C.dark
  ctx.font = "bold 26px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("FACUREGALOS", canvas.width / 2, pillY + pillH / 2 + 1)
  ctx.textBaseline = "alphabetic"

  ctx.fillStyle = C.goldBright
  ctx.font = "bold 38px Arial"
  ctx.textAlign = "center"
  ctx.fillText("COMPROBANTE DE COMPRA", canvas.width / 2, 165)

  const lineGrad = ctx.createLinearGradient(150, 0, 650, 0)
  lineGrad.addColorStop(0, "rgba(212, 175, 55, 0)")
  lineGrad.addColorStop(0.5, C.gold)
  lineGrad.addColorStop(1, "rgba(212, 175, 55, 0)")
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(150, 192)
  ctx.lineTo(650, 192)
  ctx.stroke()

  ctx.fillStyle = C.silver
  ctx.font = "24px Arial"
  ctx.textAlign = "left"
  ctx.fillText(`¡Estás participando por ${premio}!`, 50, 245)

  ctx.fillStyle = C.goldLight
  ctx.font = "bold 26px Arial"
  ctx.fillText("Comprador", 50, 300)
  ctx.fillStyle = C.silver
  ctx.font = "24px Arial"
  ctx.fillText(comprador.nombre, 50, 335)

  let yPos = 370
  ctx.font = "20px Arial"
  ctx.fillStyle = C.silverMuted

  if (comprador.email) {
    ctx.fillText(`Email: ${comprador.email}`, 50, yPos)
    yPos += 30
  }
  if (comprador.telefono) {
    ctx.fillText(`Teléfono/WhatsApp: ${comprador.telefono}`, 50, yPos)
    yPos += 30
  }
  if (comprador.instagram_username) {
    ctx.fillText(`Instagram: @${comprador.instagram_username}`, 50, yPos)
    yPos += 30
  }

  yPos += 18
  ctx.fillStyle = C.silver
  ctx.font = "bold 26px Arial"
  ctx.fillText(`Numeros en Total: ${comprador.cantidad_chances}`, 50, yPos)

  if (comprador.precio_pagado != null) {
    yPos += 45
    ctx.fillStyle = C.goldBright
    ctx.font = "bold 32px Arial"
    ctx.fillText(`Total Pagado: $${comprador.precio_pagado.toLocaleString()}`, 50, yPos)
    yPos += 55
  } else {
    yPos += 40
  }

  ctx.fillStyle = C.goldLight
  ctx.font = "bold 26px Arial"
  ctx.fillText("Tus Números:", 50, yPos)

  yPos += 50
  const startX = 50
  let currentX = startX
  let currentY = yPos

  const numerosOrdenados = [...comprador.numeros_asignados].sort((a, b) => a - b)

  numerosOrdenados.forEach((numero, index) => {
    if (index > 0 && index % ticketsPerRow === 0) {
      currentX = startX
      currentY += ticketHeight + ticketGap
    }

    ctx.save()
    ctx.translate(currentX, currentY)

    const scale = ticketWidth / 32
    ctx.scale(scale, scale)

    const ticketPath = new Path2D(
      "M30 13.75c0.414-0 0.75-0.336 0.75-0.75v0-5c-0-0.414-0.336-0.75-0.75-0.75h-28c-0.414 0-0.75 0.336-0.75 0.75v0 5c0 0.414 0.336 0.75 0.75 0.75v0c1.243 0 2.25 1.007 2.25 2.25s-1.007 2.25-2.25 2.25v0c-0.414 0-0.75 0.336-0.75 0.75v0 5c0 0.414 0.336 0.75 0.75 0.75h28c0.414-0 0.75-0.336 0.75-0.75v0-5c-0-0.414-0.336-0.75-0.75-0.75v0c-1.243 0-2.25-1.007-2.25-2.25s1.007-2.25 2.25-2.25v0z",
    )

    const gradient = ctx.createLinearGradient(0, 8, 0, 24)
    gradient.addColorStop(0, C.goldLight)
    gradient.addColorStop(1, C.gold)
    ctx.fillStyle = gradient
    ctx.fill(ticketPath)

    ctx.strokeStyle = C.goldDeep
    ctx.lineWidth = 0.6
    ctx.stroke(ticketPath)

    ctx.fillStyle = C.dark
    ctx.font = `bold ${28 / scale}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(numero.toString(), 16, 16)

    ctx.restore()

    currentX += ticketWidth + ticketGap
  })

  yPos = canvas.height - 140
  const footGrad = ctx.createLinearGradient(150, 0, 650, 0)
  footGrad.addColorStop(0, "rgba(212, 175, 55, 0)")
  footGrad.addColorStop(0.5, "rgba(212, 175, 55, 0.55)")
  footGrad.addColorStop(1, "rgba(212, 175, 55, 0)")
  ctx.strokeStyle = footGrad
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(150, yPos)
  ctx.lineTo(650, yPos)
  ctx.stroke()

  yPos = canvas.height - 100
  ctx.fillStyle = C.silverMuted
  ctx.font = "18px Arial"
  ctx.textAlign = "center"
  ctx.fillText(
    `Fecha de compra: ${new Date(comprador.created_at).toLocaleDateString("es-AR")}`,
    canvas.width / 2,
    yPos,
  )

  yPos += 40
  ctx.fillStyle = C.goldBright
  ctx.font = "bold 22px Arial"
  ctx.fillText("Mucha suerte!", canvas.width / 2, yPos)

  return canvas
}

// Genera el comprobante y dispara la descarga del PNG (uso: landing y backoffice).
export function generarComprobante(
  premio: string,
  comprador: ComprobanteComprador,
  onDone?: () => void,
) {
  const canvas = dibujarComprobante(premio, comprador)
  if (!canvas) return

  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `comprobante-${comprador.nombre.replace(/\s+/g, "-")}-${Date.now()}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      onDone?.()
    }
  })
}

// Genera el comprobante y devuelve un dataURL (PNG) para mostrarlo como <img>.
// Útil en la página pública /comprobante/[id], sobre todo en el WhatsApp del
// celular donde la descarga de un blob no siempre funciona.
export function generarComprobanteDataURL(
  premio: string,
  comprador: ComprobanteComprador,
): string | null {
  const canvas = dibujarComprobante(premio, comprador)
  return canvas ? canvas.toDataURL("image/png") : null
}
