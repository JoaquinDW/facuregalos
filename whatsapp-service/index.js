import express from "express"
import pino from "pino"
import qrcode from "qrcode-terminal"
import { Boom } from "@hapi/boom"
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys"

const PORT = process.env.PORT || 3001
const SECRET = process.env.WHATSAPP_SERVICE_SECRET || ""
const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || "./auth"

const logger = pino({ level: process.env.LOG_LEVEL || "info" })

let sock = null
let connectionReady = false

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      logger.info("Escaneá este QR con el WhatsApp del negocio:")
      qrcode.generate(qr, { small: true })
    }

    if (connection === "open") {
      connectionReady = true
      logger.info("✅ Conexión con WhatsApp abierta")
    }

    if (connection === "close") {
      connectionReady = false
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut

      logger.warn({ statusCode, loggedOut }, "Conexión cerrada")

      if (loggedOut) {
        logger.error(
          "Sesión cerrada por WhatsApp (logout). Borrá la carpeta de auth y volvé a escanear el QR.",
        )
      } else {
        logger.info("Reintentando conexión…")
        startSock().catch((e) => logger.error(e, "Error al reconectar"))
      }
    }
  })

  return sock
}

// Convierte un número limpio (549XXXXXXXXXX) al JID de WhatsApp.
function aJid(numero) {
  const soloDigitos = String(numero).replace(/\D/g, "")
  return `${soloDigitos}@s.whatsapp.net`
}

const app = express()
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ ok: true, connected: connectionReady })
})

app.post("/send", async (req, res) => {
  // Auth
  const auth = req.headers.authorization || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!SECRET || token !== SECRET) {
    return res.status(401).json({ success: false, error: "No autorizado" })
  }

  const { telefono, mensaje } = req.body || {}
  if (!telefono || !mensaje) {
    return res.status(400).json({ success: false, error: "Faltan telefono o mensaje" })
  }

  if (!sock || !connectionReady) {
    return res.status(503).json({ success: false, error: "WhatsApp no conectado todavía" })
  }

  try {
    const jid = aJid(telefono)

    // Verificar que el número exista en WhatsApp
    const [resultado] = await sock.onWhatsApp(jid)
    if (!resultado?.exists) {
      return res.status(422).json({ success: false, error: "El número no tiene WhatsApp" })
    }

    await sock.sendMessage(resultado.jid, { text: mensaje })
    logger.info({ jid: resultado.jid }, "Mensaje enviado")
    return res.json({ success: true })
  } catch (error) {
    logger.error(error, "Error enviando mensaje")
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

startSock()
  .then(() => {
    app.listen(PORT, () => logger.info(`🚀 whatsapp-service escuchando en :${PORT}`))
  })
  .catch((e) => {
    logger.error(e, "No se pudo iniciar Baileys")
    process.exit(1)
  })
