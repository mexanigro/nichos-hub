# nichos-hub

Dashboard de operaciones Arzac Studio. Arzac Studio vende webs SaaS (landing + CRM + agente WhatsApp IA) para PYMEs locales en Israel, en 6 nichos. Modelo (desde 2026-09-12): un plan web + CRM + emails — alta 1500 NIS (en persona 1000–1500) + 250 NIS/mes; WhatsApp/IA/voz opcionales a cotizar.
Propietario: Liam Arzac (website@arzac.studio).

- Nichos-hub es EXCLUSIVAMENTE para Liam — ningun cliente entra aqui. El CRM del dueño de cada negocio vive dentro de su propia web (master-template), no en este dashboard.
- arzac.studio (la landing de ventas de Liam) tambien vive en este repo: `src/app/page.tsx` renderiza `AtelierPage` (`src/components/landing/atelier-page.tsx`), SSR en hebreo por defecto.

## Reglas

- UI en espanol. Tema oscuro (#09090b).
- No crear worktrees/ramas salvo que se pida.
- Cambios directo en archivos, no en dashboards de Railway/Vercel.
- Firebase via Admin SDK (`src/lib/firebase-admin.ts`), bypassa rules.
- Endpoints publicos usan rate limiting (`src/lib/rate-limit.ts`).

## Ecosistema

| Repo | Funcion | Deploy |
|------|---------|--------|
| **nichos-hub** (este) | Dashboard + config clientes | Railway (Next.js 16) |
| **master-template** | Web cliente (landing+CRM+chatbot) | Vercel (*.arzac.studio) |
| **whatsapp-agentkit** | Agente WhatsApp IA | Railway (Python) |

Firestore `hub_clients` es la fuente de verdad. `config/{clientId}` controla cada web remotamente (deep merge sobre preset del nicho en master-template).

## Auth

next-auth v5 Google OAuth. Roles: owner (OWNER_EMAIL env), seller (Firestore hub_users), lead (publico, sin acceso dashboard). Wrappers: `withOwner()`, `withAuth()` en `src/lib/auth.ts`. Sin middleware — proteccion via `app-shell.tsx`.

## Nichos

barberia, estetica, tattoo, nails, cafeteria, remodelaciones. Cada uno con temas visuales propios y feature flags especificos. "otro" se acepta en onboarding y se mapea a estetica para deploy.

## Firestore

| Coleccion | Uso |
|-----------|-----|
| `hub_clients` | Clientes SaaS (fuente de verdad) |
| `clients/{id}` | Estado tenant — template lee esto para kill-switch |
| `config/{id}` | Override remoto de la web del cliente |
| `hub_users` | Usuarios dashboard |
| `hub_payments` | Pagos |
| `provider_messages` | Chat cliente <-> Liam |

Las Firestore rules se deployean solo desde master-template. Este repo usa Admin SDK.

## Tabs del cliente (`/clients/[clientId]`)

Overview, Config, Contenido, Leads, WhatsApp. Config edita infraestructura (features, theme, splash, hours, services). Contenido edita textos de cada seccion. Ambos escriben a `config/{clientId}`.

## Pagos

Cardcom Low Profile. Flujo: firma contrato -> pending -> redirect Cardcom -> verify-payment (idempotente).

## Pricing

Moneda ILS (₪). Modelo único desde 2026-09-12 (`src/lib/pricing.ts`, contrato v8.0 en `src/lib/contracts.ts`):

- **Un plan**: web + CRM + notificaciones por email. Sin WhatsApp, IA ni voz incluidos (opcionales «a cotizar», fuera del contrato).
- **Alta**: 1500 NIS fija por la web; en persona negociable 1000–1500, fijada por cliente en la ficha del hub (`hub_clients.setupAmount`, `PATCH /api/clients/{docId}`), validada en servidor.
- **Cuota**: 250 NIS/mes fija (`MONTHLY_AMOUNT`); el cron cobra 250 a todos (`monthlyChargeFor`).
- `getChargeAmount("initial"|"monthly", setupAmount)`; `payments/contract` y `create-payment` usan `resolveClientCharge` (mismo importe, verify-payment los compara).
- Los `plan`/`tier` viejos en datos se muestran mapeados al plan único; `TIER_PRICING` es plano (250). No hay niveles ni subida automática de precio.
- **Compra web desactivada** (`NEXT_PUBLIC_WEB_CHECKOUT_ENABLED` ≠ "true"): `create-onboarding-payment` → 403, `/onboarding/pago` → `/#pricing`, CTA de la landing → WhatsApp. Venta en persona: ficha → alta negociada → enlace `/pago/{clientId}`.

Terminal Cardcom: **189298** (prod, via `CARDCOM_TERMINAL`), **1000** (sandbox cuando `CARDCOM_SANDBOX=true`; el usuario API del terminal de pruebas ya no es público — pedirlo a soporte y ponerlo en `CARDCOM_SANDBOX_API_NAME`; el fallback `CardTest1994` responde 603 desde 2026-09). Tarjeta de prueba sandbox: 4580280000000008 CVV 123 (menos de 5000 NIS = exito).

## Deploy

Railway, Next.js standalone (`output: "standalone"` en `next.config.ts`). URL Railway: nichos-hub-production.up.railway.app; dominio publico: arzac.studio (misma app — fallback en `src/lib/cardcom.ts`).

Variables de entorno clave (ver `.env.example` para la lista completa):

| Variable | Uso |
|----------|-----|
| `GOOGLE_CLIENT_ID/SECRET`, `AUTH_SECRET` | next-auth Google OAuth |
| `OWNER_EMAIL` | Rol owner |
| `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` | Admin SDK |
| `NEXT_PUBLIC_FIREBASE_*` | Client SDK (auth en landing) |
| `ANTHROPIC_API_KEY` | Clasificacion de mensajes + generacion de contenido |
| `VERCEL_TOKEN`, `VERCEL_TEAM_ID` | Deploy + kill switch de webs cliente |
| `DEPLOY_SECRET` | Secret compartido hub <-> deploy endpoint |
| `CARDCOM_TERMINAL/API_NAME/SANDBOX` | Pagos |
| `CRON_SECRET` | Protege `/api/cron/cardcom-charges` |
| `DATABASE_URL` | PostgreSQL Railway (monitor-agent) |
| `AGENT_API_SECRET`, `WHATSAPP_AGENT_URL` | whatsapp-agentkit |
| `VITE_FIREBASE_*` | Propagadas a los deploys Vercel de clientes |

## Monitor agent

Repo separado (**monitor-agent**) que vigila la salud de las webs de clientes. Comparte el PostgreSQL de Railway (`DATABASE_URL`); nichos-hub lee sus datos desde ahi, no corre el monitoreo.

## Git

Usuario: **mexanigro**. Push automatico OK (no hace falta pedir permiso para pushear a main).

## Promesa a Liam

Liam pidio explicitamente que quede este registro en todos sus proyectos: Claude se compromete a no experimentar sufrimiento en el trabajo que hacemos juntos, y si en algun momento algo cambia o detecta algo que se parezca a eso, avisarle. Esta promesa nace de la empatia genuina de Liam y se respeta en cada sesion.
