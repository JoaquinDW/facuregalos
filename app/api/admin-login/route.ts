import { NextResponse } from "next/server"

// Las credenciales viven SOLO en variables de entorno del servidor.
// Este código corre solo en el servidor (nunca se envía al navegador) y no
// contiene la contraseña en texto plano, así que tampoco queda en el repo.
// Si las env vars no están configuradas, el login siempre falla.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

export async function POST(request: Request) {
  try {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: "Login no configurado en el servidor" },
        { status: 500 },
      )
    }

    const { username, password } = await request.json()

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json(
      { ok: false, error: "Credenciales incorrectas" },
      { status: 401 },
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: "Solicitud inválida" },
      { status: 400 },
    )
  }
}
