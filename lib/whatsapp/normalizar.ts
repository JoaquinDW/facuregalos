// Normaliza un teléfono argentino al formato que WhatsApp espera para móviles:
// 549 + código de área + número (sin 0 inicial, sin +, sin separadores).
// Tanto Baileys (que lo convierte a JID `<numero>@s.whatsapp.net`) como el
// futuro Cloud API necesitan el número en este formato.
//
// Devuelve el número limpio (ej. "5491123456789") o null si no parece válido.
export function normalizarTelefonoAR(input: string | undefined | null): string | null {
  let d = (input || "").replace(/\D/g, "")
  if (!d) return null

  // Prefijo internacional 00
  if (d.startsWith("00")) d = d.slice(2)

  // Código de país (con o sin el 9 de móvil). Lo re-agregamos al final.
  if (d.startsWith("549")) d = d.slice(3)
  else if (d.startsWith("54")) d = d.slice(2)

  // 0 inicial de larga distancia nacional
  if (d.startsWith("0")) d = d.slice(1)

  // El número nacional argentino (área + abonado) tiene 10 dígitos.
  // Aceptamos 10-11 para tolerar casos con un dígito extra; fuera de ese
  // rango lo consideramos inválido (probablemente un usuario de Instagram
  // guardado en el campo telefono, o un número incompleto).
  if (d.length < 10 || d.length > 11) return null

  return "549" + d
}

/**
 * Heurística para decidir si el valor del campo `telefono` es realmente un
 * número (y no un usuario de Instagram guardado ahí por compatibilidad).
 * Coincide con la lógica usada en el backoffice.
 */
export function esNumeroTelefono(valor: string | undefined | null): boolean {
  if (!valor) return false
  return /^[\d\s+()-]+$/.test(valor)
}
