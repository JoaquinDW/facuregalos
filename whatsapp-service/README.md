# whatsapp-service

Microservicio **always-on** que mantiene viva la sesión de WhatsApp (vía [Baileys](https://github.com/WhiskeySockets/Baileys)) y expone un endpoint para enviar mensajes. La app principal (Next.js / Vercel) le habla a través del `BaileysProvider` en `lib/whatsapp/`.

> ⚠️ Baileys es una librería **no oficial** y usarla puede llevar a que Meta **banee el número**. Usá un número dedicado, no el personal. Para una solución sin este riesgo, migrar a la WhatsApp Cloud API oficial (ya hay un `CloudApiProvider` placeholder en la app).

> ⚠️ Este servicio **no corre en Vercel** (necesita un proceso persistente). Desplegarlo en Railway / Render / Fly.io / un VPS, con **volumen persistente** montado en la carpeta `auth/` para no tener que re-escanear el QR en cada reinicio.

## Correr local

```bash
cd whatsapp-service
cp .env.example .env   # completar WHATSAPP_SERVICE_SECRET
npm install
npm start
```

Al arrancar imprime un **QR en la terminal**: escanealo desde *WhatsApp → Dispositivos vinculados*. Cuando veas `✅ Conexión con WhatsApp abierta`, ya está listo.

## Endpoints

- `GET /health` → `{ ok, connected }`
- `POST /send` (header `Authorization: Bearer <WHATSAPP_SERVICE_SECRET>`)
  - body: `{ "telefono": "5491123456789", "mensaje": "..." }`
  - el `telefono` debe venir ya normalizado (lo hace el `BaileysProvider`); el servicio lo convierte a JID.

### Probar

```bash
curl -X POST http://localhost:3001/send \
  -H "Authorization: Bearer <secret>" \
  -H "Content-Type: application/json" \
  -d '{"telefono":"5491123456789","mensaje":"test"}'
```

## Variables de entorno

| Var | Descripción |
|-----|-------------|
| `PORT` | Puerto HTTP (default 3001) |
| `WHATSAPP_SERVICE_SECRET` | Secreto compartido con la app Next.js |
| `WHATSAPP_AUTH_DIR` | Carpeta de la sesión (default `./auth`, montar volumen persistente) |
