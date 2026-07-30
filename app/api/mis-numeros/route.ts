import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Deja solo los dígitos para comparar números de WhatsApp sin importar el formato
const soloDigitos = (valor: string) => valor.replace(/\D/g, "")

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const telefonoParam = searchParams.get("telefono")?.trim() ?? ""
  const telefonoDigitos = soloDigitos(telefonoParam)

  if (telefonoDigitos.length < 8) {
    return NextResponse.json(
      { error: "Ingresá un número de WhatsApp válido" },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("compradores")
    .select(
      `id, nombre, numeros_asignados, cantidad_chances, created_at, telefono, sorteos!compradores_sorteo_id_fkey(nombre, estado)`,
    )
    .eq("estado_pago", "pagado")
    .not("telefono", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error buscando por WhatsApp:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    )
  }

  const participaciones = (data || [])
    .filter(
      (row: any) =>
        row.sorteos?.estado === "activo" &&
        soloDigitos(row.telefono ?? "") === telefonoDigitos,
    )
    .map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      numeros_asignados: row.numeros_asignados || [],
      cantidad_chances: row.cantidad_chances,
      sorteo_nombre: row.sorteos?.nombre ?? "Sorteo",
      created_at: row.created_at,
    }))

  return NextResponse.json({ participaciones })
}
