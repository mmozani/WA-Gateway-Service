# NeoZone WhatsApp OTP Gateway

Small internal WhatsApp OTP delivery service for NeoZone.

## Runtime contract

NeoZoneCore calls the gateway directly:

```text
NeoZoneCore -> HTTPS/Nginx -> WA Gateway -> WhatsApp Web
```

Google Apps Script is not part of the active runtime path.

## Requirements

- Node.js 22.x
- Chrome/Chromium
- A WhatsApp account linked through WhatsApp Web

## Local setup (Windows)

```powershell
$env:PUPPETEER_SKIP_DOWNLOAD="true"
npm install
Copy-Item .env.example .env
npm run check
npm start
```

Set the local Chrome path in `.env`, for example:

```env
PUPPETEER_EXECUTABLE_PATH=C:\Users\USERNAME\AppData\Local\Google\Chrome\Application\chrome.exe
```

## Linked Device name

The gateway configures the linked device through whatsapp-web.js:

```env
WHATSAPP_DEVICE_NAME=NeoZone OTP Gateway
WHATSAPP_BROWSER_NAME=Chrome
```

## Authentication

Protected endpoints use:

```http
Authorization: Bearer <API_TOKEN>
```

`API_TOKEN` must be at least 32 characters.

## API

### GET /health/live

Public liveness check.

### GET /health/ready

Protected readiness check. Returns HTTP 503 when no WhatsApp session is READY.

### GET /v1/status

Protected internal session status.

### POST /v1/otp

Protected OTP send.

Request:

```json
{
  "phone": "+9647700000000",
  "code": "482913",
  "locale": "ar"
}
```

Only `fa`, `ar`, and `en` are supported.

Successful response:

```json
{
  "ok": true,
  "status": "accepted",
  "channel": "whatsapp",
  "provider_message_id": "...",
  "request_id": "...",
  "deduplicated": false
}
```

## Automatic duplicate protection

Backend does not send an Idempotency-Key.

The gateway automatically fingerprints:

```text
phone + code + locale
```

If the same request arrives again within `OTP_DEDUPE_WINDOW_MS` (default 15 seconds), the WhatsApp message is not sent again and the previous result is reused.

A real user resend after the dedupe window results in a new delivery attempt.

## Session persistence

WhatsApp authentication is persisted using LocalAuth under:

```env
WHATSAPP_AUTH_PATH=.wwebjs_auth
```

Production will place this outside the application directory so deploys do not remove active sessions.

## Security notes

- Never commit `.env`.
- Never commit WhatsApp auth/session data.
- Never log OTP codes, Bearer tokens, QR values, or full phone numbers.
- Bind Node to localhost in production and expose only Nginx/TLS.
- Do not run `npm audit fix --force` without compatibility testing.
