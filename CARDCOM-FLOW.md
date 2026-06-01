# Flujo de pagos Cardcom — Nichos Hub

> Documento generado 2026-06-01. Cubre el ciclo completo de pagos: inicio, cobro, post-pago y cobros recurrentes.

---

## 1. Resumen ejecutivo

| Concepto | Detalle |
|----------|---------|
| Gateway | Cardcom Low Profile (redirect, no iframe) |
| Operacion | `Operation=1` — cobra + crea token recurrente |
| Planes | `web_crm` ₪790/mes · `completo` ₪990/mes |
| Moneda | ILS (CoinID=1) |
| Contrato | Firmado digitalmente antes del pago (4 idiomas: ES, EN, HE, RU) |
| Email post-pago | Via Resend (o log si `EMAIL_PROVIDER=log`) |
| WhatsApp post-pago | Manual (no automatizado) |
| Cobro recurrente | Cron diario via `chargeToken` con tokens almacenados |

---

## 2. Variables de entorno requeridas

```env
# Obligatorias para que funcionen los pagos
CARDCOM_TERMINAL=         # Numero de terminal Cardcom
CARDCOM_API_NAME=         # Usuario API de Cardcom

# Usada como base para redirects y webhooks
NEXTAUTH_URL=https://arzac.studio

# Email (opcional — default "log" que solo imprime en stdout)
EMAIL_PROVIDER=log        # "log" | "resend" | "disabled"
RESEND_API_KEY=           # Solo si EMAIL_PROVIDER=resend

# Cron de cobros recurrentes
CRON_SECRET=              # Header x-cron-secret para validar el cron
```

> **Sin `CARDCOM_TERMINAL` y `CARDCOM_API_NAME`**, todos los endpoints devuelven `{ success: false, error: "Cardcom not configured" }`.

---

## 3. Flujo de pago inicial (onboarding)

### Paso a paso

```
Usuario en arzac.studio
    │
    ▼
1. Elige plan + acepta contrato
    │  POST /api/cardcom/create-onboarding-payment
    │  Body: { plan, lang, email, name, contractVersion }
    │
    ▼
2. Se crea doc en hub_contract_leads:
    │  - contractAccepted: true
    │  - contractAcceptedAt: server timestamp
    │  - contractIp: IP del request
    │  - paymentStatus: "pending"
    │  - status: "pending"
    │
    ▼
3. Se crea sesion Cardcom Low Profile:
    │  - Operation=1 (cobro + token)
    │  - SuccessRedirectUrl: /onboarding/pago/success
    │  - ErrorRedirectUrl: /onboarding/pago/error
    │  - IndicatorUrl: /api/cardcom/webhook
    │  - ReturnValue: leadId
    │
    ▼
4. Se guarda cardcomLowProfileCode en el lead
    │
    ▼
5. Se devuelve { url, leadId } al frontend
    │
    ▼
6. Frontend redirige al usuario a Cardcom
    │  El usuario ve formulario de pago de Cardcom
    │  Ingresa tarjeta y paga
    │
    ▼
7. POST-PAGO: dos caminos en paralelo
    │
    ├─── PATH A: Client-side (usuario vuelve al browser)
    │    Browser → /onboarding/pago/success?lowProfileCode=...
    │    JS → POST /api/cardcom/verify-onboarding-payment
    │    → processCardcomPayment(leadId, lowProfileCode)
    │    → Firma onboarding token (24h)
    │    → Redirige a /onboarding/info?token=...
    │
    └─── PATH B: Webhook server-to-server (Cardcom notifica)
         Cardcom → POST /api/cardcom/webhook
         Body: { lowprofilecode, ReturnValue (=leadId) }
         → processCardcomPayment(leadId, lowProfileCode)
         → Siempre devuelve 200 OK
```

### Archivos involucrados

| Archivo | Funcion |
|---------|---------|
| `src/app/api/cardcom/create-onboarding-payment/route.ts` | Crea lead + sesion Cardcom |
| `src/app/api/cardcom/verify-onboarding-payment/route.ts` | Verifica pago + firma token |
| `src/app/api/cardcom/webhook/route.ts` | Callback server-to-server |
| `src/lib/cardcom.ts` | `createLowProfilePayment()`, `verifyPayment()` |
| `src/lib/cardcom-promote.ts` | `processCardcomPayment()` — orquestador principal |
| `src/lib/contracts.ts` | Textos de contrato (4 idiomas, 2 planes) |
| `src/lib/pricing.ts` | Montos: `getPlanAmount(plan)` |
| `src/lib/onboarding-token.ts` | JWT para el wizard post-pago |

---

## 4. Que hace `processCardcomPayment()` (el orquestador)

Este es el core — llamado tanto por el verify client-side como por el webhook.

**Archivo:** `src/lib/cardcom-promote.ts`

### Secuencia:

1. **Idempotencia rapida** — Si `hub_contract_leads` ya tiene `paymentStatus=paid` + `hubClientId`, retorna `alreadyProcessed: true` sin llamar a Cardcom.

2. **Verifica con Cardcom** — `verifyPayment(lowProfileCode)` llama a `BillGoldGetLowProfileIndicator.aspx`. Confirma que el pago fue exitoso y obtiene:
   - `transactionId`
   - `cardLastFour`
   - `token` (GUID para cobros recurrentes)
   - `cardValidityMonth` / `cardValidityYear`
   - `approvalNumber`

3. **Transaccion atomica** (`db.runTransaction`):
   - **hub_contract_leads**: marca `paymentStatus=paid`, guarda token + expiry + transactionId
   - **hub_clients**: crea si no existe (`status: "pending_provision"`, `paymentStatus: "active"`, `infoSubmitted: false`); si existe, solo actualiza campos de pago (NUNCA pisa businessName/niche/infoSubmitted)
   - **clients/{clientId}**: sync para que el template lea `status` y `paymentStatus`
   - **hub_payments**: inserta registro tipo `subscription_initial`, status `success`

4. **Calcula nextChargeAt** — 1 mes desde hoy

5. **Email** (best-effort, no bloqueante) — template `paymentConfirmed`:
   - Subject: "Recibimos tu pago — [Plan]"
   - Contiene: monto, plan, fecha proximo cobro
   - CTA: boton → `/onboarding/info?token=...`
   - Texto: "Apenas tenga la primera version te escribo por WhatsApp"

### Race condition

Si el webhook y el verify client-side llegan simultaneamente:
- La transaccion Firestore usa `db.runTransaction()` con fresh read
- El segundo proceso detecta que ya esta paid → retorna `alreadyProcessed: true`
- No hay doble cobro ni datos duplicados

---

## 5. Flujo post-pago (que ve el usuario)

```
Pago exitoso
    │
    ▼
/onboarding/pago/success
    │  useEffect llama verify-onboarding-payment
    │  Recibe onboarding token (JWT, 24h)
    │
    ▼
/onboarding/info?token=...
    │  Wizard donde el cliente llena:
    │  - Nombre del negocio
    │  - Nicho
    │  - Logo / fotos
    │  - Horarios, servicios, etc.
    │  POST /api/onboarding/client-info
    │  → infoSubmitted = true
    │
    ▼
Email "Recibi la info de tu negocio" (template infoSubmittedThanks)
    │
    ▼
Liam revisa en el dashboard → provisiona el sitio → WhatsApp manual
```

### Que se guarda en Firestore

| Coleccion | Campo clave | Valor post-pago |
|-----------|-------------|-----------------|
| `hub_contract_leads` | `paymentStatus` | `"paid"` |
| `hub_contract_leads` | `hubClientId` | leadId (= clientId) |
| `hub_contract_leads` | `cardcomToken` | GUID del token recurrente |
| `hub_clients` | `paymentStatus` | `"active"` |
| `hub_clients` | `status` | `"pending_provision"` |
| `hub_clients` | `plan` | `"web_crm"` o `"completo"` |
| `hub_clients` | `cardcomToken` | GUID para cobros futuros |
| `hub_clients` | `nextChargeAt` | Timestamp (hoy + 1 mes) |
| `hub_clients` | `lastChargedAt` | Timestamp del pago |
| `hub_clients` | `infoSubmitted` | `false` (hasta que complete el wizard) |
| `clients/{id}` | `status` | `"pending_provision"` |
| `clients/{id}` | `paymentStatus` | `"active"` |
| `hub_payments` | `type` | `"subscription_initial"` |
| `hub_payments` | `status` | `"success"` |
| `hub_payments` | `amount` | 790 o 990 |

### Emails que se envian

| Momento | Template | Destinatario | Servicio |
|---------|----------|-------------|----------|
| Post-pago | `paymentConfirmed` | Cliente | Resend (o log) |
| Post-info | `infoSubmittedThanks` | Cliente | Resend (o log) |
| Si Liam pide cambios | `changesRequested` | Cliente | Resend (o log) |
| Re-submission | `changesResubmitted` | Liam (owner) | Resend (o log) |

### WhatsApp

No hay notificacion automatica por WhatsApp. El email dice "te escribo por WhatsApp" — Liam lo hace manualmente.

---

## 6. Cobros recurrentes (cron mensual)

**Archivo:** `src/app/api/cron/cardcom-charges/route.ts`

### Como funciona

```
Cron diario (Railway/Vercel, ej. 0 9 * * *)
    │  GET /api/cron/cardcom-charges
    │  Header: x-cron-secret = CRON_SECRET
    │
    ▼
Query: hub_clients donde nextChargeAt <= ahora
    │  Limite: 50 clientes por invocacion
    │
    ▼
Por cada cliente:
    │  chargeToken({ token, expMonth, expYear, amount, ... })
    │  → POST https://secure.cardcom.solutions/Interface/ChargeToken.aspx
    │
    ├── Exito:
    │   - hub_clients: paymentStatus="active", lastChargedAt=ahora, nextChargeAt=+1mes
    │   - hub_payments: tipo="subscription_recurring", status="success"
    │
    └── Fallo:
        - hub_clients: paymentStatus="past_due", pastDueAt=ahora, pastDueReason=error
        - hub_payments: tipo="subscription_recurring", status="failed"
        - Reintento: nextChargeAt = ahora + 24h
```

---

## 7. Pago de clientes existentes (no onboarding)

**Archivo:** `src/app/api/cardcom/create-payment/route.ts`

Para clientes que ya estan en `hub_clients` (ej. upgrade de plan):
- POST con `{ clientId, plan }`
- Rate limit: 5 req / 60s / IP
- Usa el mismo `createLowProfilePayment()` pero con paths de redirect diferentes
- Verify: `/api/cardcom/verify-payment` (sin el flujo de onboarding token)

---

## 8. Hay modo test/sandbox?

**No hay un flag de sandbox explicito en el codigo.** Cardcom maneja esto por terminal:

- Si `CARDCOM_TERMINAL` apunta a un terminal de prueba de Cardcom → los cobros son simulados
- Si apunta al terminal de produccion → los cobros son reales
- Cardcom provee terminales de prueba al crear la cuenta

### Como verificar sin cobro real

1. **Opcion A: Terminal de prueba** — Pedirle a Cardcom un terminal de prueba. Configurar `CARDCOM_TERMINAL` y `CARDCOM_API_NAME` con las credenciales de prueba.

2. **Opcion B: Recorrer el flujo sin Cardcom** — Sin `CARDCOM_TERMINAL`/`CARDCOM_API_NAME` configurados, el endpoint devuelve error `"Cardcom not configured"`. Esto confirma que el codigo llega hasta ahi pero no se puede probar el redirect.

3. **Opcion C: Verificar la integracion manualmente**:
   - Configurar terminal de prueba
   - Ir a `/onboarding/pago` en el sitio
   - Aceptar contrato y elegir plan
   - Verificar que redirige a Cardcom
   - Completar con tarjeta de prueba (Cardcom da numeros)
   - Verificar que vuelve a `/onboarding/pago/success`
   - Verificar en Firestore que `hub_contract_leads`, `hub_clients` y `hub_payments` se crearon correctamente

4. **Opcion D: Verificar el webhook** — Desde Railway logs, buscar `[cardcom]` para ver los logs de cada paso.

---

## 9. Problemas encontrados / observaciones

### Criticos: ninguno

El flujo esta bien implementado con:
- Idempotencia en verify y webhook (no doble cobro)
- Transaccion atomica (no datos huerfanos)
- Race condition cubierta entre webhook y client-side
- Email best-effort (no rompe el flujo si falla)
- Rate limiting en endpoints publicos

### Observaciones menores

1. **EMAIL_PROVIDER default es "log"** — Los emails se imprimen en stdout pero NO se envian. Para enviar emails reales, configurar `EMAIL_PROVIDER=resend` y `RESEND_API_KEY`.

2. **No hay webhook HMAC** — Cardcom no firma sus webhooks. La validacion se hace re-verificando el `lowProfileCode` con Cardcom (patron correcto).

3. **No hay notificacion automatica a Liam** — Cuando un cliente paga, Liam no recibe email/WhatsApp. Solo ve el pago en el dashboard. Considerar agregar una notificacion al owner.

4. **El cron necesita estar configurado** — `src/app/api/cron/cardcom-charges/route.ts` existe pero necesita un cron job en Railway/Vercel que lo dispare diariamente (ej. `curl -H "x-cron-secret: $CRON_SECRET" https://arzac.studio/api/cron/cardcom-charges`).

5. **No hay suspension automatica** — Si un cliente queda `past_due`, el cron reintenta pero no hay logica de suspension automatica despues de N fallos consecutivos.

---

## 10. Endpoints de pago — referencia rapida

| Metodo | Ruta | Auth | Proposito |
|--------|------|------|-----------|
| POST | `/api/cardcom/create-onboarding-payment` | Publico (rate limit) | Nuevo lead paga |
| POST | `/api/cardcom/verify-onboarding-payment` | Publico | Success page verifica |
| POST/GET | `/api/cardcom/webhook` | Publico (Cardcom S2S) | Callback de Cardcom |
| POST | `/api/cardcom/create-payment` | Publico (rate limit) | Cliente existente paga |
| POST | `/api/cardcom/verify-payment` | Publico | Verify para cliente existente |
| GET | `/api/cron/cardcom-charges` | `x-cron-secret` | Cobros recurrentes |
| GET | `/api/payments` | Owner only | Listar pagos |
| POST | `/api/payments` | Owner only | Crear pago manual |
| PATCH | `/api/payments` | Owner only | Editar pago |
| POST | `/api/payments/contract` | Owner only | Registrar aceptacion contrato |

---

## 11. Diagrama de colecciones Firestore

```
hub_contract_leads/         ← Leads que inician pago
  ├── email, name, plan, lang
  ├── contractAccepted, contractAcceptedAt, contractIp
  ├── paymentStatus: pending → paid | failed
  ├── cardcomLowProfileCode, cardcomToken
  └── hubClientId → link a hub_clients

hub_clients/                ← Clientes activos
  ├── clientId, email, businessName, niche, plan
  ├── paymentStatus: active | past_due | suspended
  ├── cardcomToken, cardcomTokenExpMonth/Year
  ├── lastChargedAt, nextChargeAt
  ├── status: pending_provision → active
  └── infoSubmitted: false → true

hub_payments/               ← Registro de todos los cobros
  ├── clientId, leadId
  ├── amount, currency (ILS)
  ├── type: subscription_initial | subscription_recurring
  ├── status: success | failed | pending
  └── cardcomTransactionId, approvalNumber

clients/{clientId}/         ← Sync para el template
  ├── status
  └── paymentStatus
```
