# nichos-hub — CLAUDE.md

Dashboard de operaciones privado para Arzac Studio. Propietario: Liam Arzac | website@arzac.studio | 055-771-9141 Empresa: Arzac Studio | arzac.studio

## Convenciones de trabajo

- No crear worktrees ni ramas separadas salvo que se pida explícitamente.
- Todos los cambios deben aplicarse directamente en los archivos del proyecto.

## Contexto del negocio

SaaS de desarrollo web para negocios locales en Israel. Modelo: pago inicial ₪4,200 (setup) + ₪500/mes (suscripción recurrente). Proveedor de pagos: Cardcom (número de proveedor 1233048, terminal 189298). Mercado: Israel, clientes en hebreo/inglés. Venta fría: Liam construye la web primero, luego la ofrece al cliente.

## Stack técnico

* Framework: Next.js 16.x App Router (output: standalone)
* Auth: next-auth v5 beta (^5.0.0-beta.31) — solo Google OAuth, rol owner/seller
* Base de datos principal: Firebase Admin (^13.8.0) + Firestore (preferRest: true)
* Base de datos secundaria: PostgreSQL en Railway (pg ^8.20.0, métricas e incidentes del monitor)
* Emails: Resend (dominio verificado: arzac.studio)
* Estilos: Tailwind v4 (^4.2.4) con @theme CSS variables
* UI components: lucide-react (^1.14.0), recharts (^3.8.1)
* IA clasificación: @anthropic-ai/sdk (^0.95.1, Claude Haiku para clasificar mensajes)
* Hosting: Railway (nichos-hub + monitor-agent + PostgreSQL)
* Dominio: arzac.studio via Cloudflare → Railway
* DNS: Cloudflare (nameservers activos, reemplazó Squarespace)
* Kill switch: Vercel API v1 /pause y /unpause por proyecto

## Infraestructura

* nichos-hub corre en Railway, NO en Vercel
* monitor-agent corre en Railway por separado
* Las webs de clientes corren en Vercel (cada una es un deploy del master-template)
* PostgreSQL corre en Railway en el mismo proyecto que nichos-hub
* Firebase proyecto: barbertemplate-madre (usa FIREBASE_DATABASE_ID personalizado)

## Variables de entorno requeridas

```
# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
NEXTAUTH_URL=https://arzac.studio
OWNER_EMAIL=                  # email que recibe rol "owner"

# Firebase Admin
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_DATABASE_ID=         # opcional, default "default"

# PostgreSQL Railway
DATABASE_URL=

# Anthropic (clasificación de mensajes)
ANTHROPIC_API_KEY=

# Vercel (kill switch)
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# Cardcom (pagos Israel)
CARDCOM_API_NAME=
CARDCOM_API_PASSWORD=
CARDCOM_TERMINAL=

# Resend (emails)
RESEND_API_KEY=
```

## Estructura de rutas

```
src/app/
  /                        → redirect a /clients
  /login                   → Google OAuth
  /clients                 → lista de clientes (solo owner)
  /clients/[clientId]      → detalle: métricas, incidentes, mensajes, pagos
  /payments                → gestión de pagos (solo owner)
  /messages                → mensajes de clientes con clasificación IA
  /monitor                 → uptime, incidentes, PostgreSQL
  /sales                   → kanban de prospectos (owner + seller)
  /expenses                → gastos del negocio (solo owner)
  /pago/[clientId]         → PÁGINA PÚBLICA — contrato + firma + pago Cardcom
  /pago/success            → PÁGINA PÚBLICA — verificación post-pago Cardcom
  /pago/error              → PÁGINA PÚBLICA — error de pago con retry
```

### API Routes

```
POST /api/auth/[...nextauth]          → NextAuth handler
GET|POST|PUT /api/clients             → CRUD clientes (PUT filtra campos permitidos)
GET /api/clients/[clientId]           → detalle cliente
POST /api/clients/kill                → pause/unpause Vercel
GET|POST /api/classify                → clasificación mensajes con Claude
GET|PATCH /api/messages               → lista mensajes
POST /api/messages/reply              → responder mensaje
GET /api/messages/thread              → hilo de mensajes
GET|POST|PATCH /api/sales             → datos de ventas
POST /api/sales/notes                 → notas de ventas
GET|POST|DELETE /api/expenses         → gastos
GET /api/expenses/export              → exportar gastos
GET|POST|PATCH /api/payments          → pagos
GET /api/payments/[clientId]          → pagos por cliente
POST /api/payments/contract           → PÚBLICA — crear contrato + payment pending (rate limited)
POST /api/cardcom/create-payment      → PÚBLICA — crear URL de pago Cardcom (rate limited)
POST /api/cardcom/verify-payment      → PÚBLICA — verificar pago con idempotencia (rate limited)
GET|POST /api/users                   → gestión usuarios
GET /api/monitor                      → integración monitor-agent
```

## Auth

* Provider: Google OAuth (next-auth v5 beta)
* Roles: `owner` (email === OWNER_EMAIL env var) y `seller` (desde Firestore hub_users)
* Helpers exportados desde `src/lib/auth.ts`:
  - `withOwner(handler)` — wrapper para API routes, requiere rol owner
  - `withAuth(handler)` — wrapper para API routes, requiere cualquier rol autenticado (owner o seller)
  - `auth()` — obtiene sesión actual
  - `handlers`, `signIn`, `signOut`
* No hay middleware.ts — protección via app-shell.tsx a nivel componente
* Todas las API routes privadas usan `withOwner` o `withAuth` — devuelven 401/403 sin sesión

## Colecciones Firestore

* `hub_clients` — clientes registrados (clientId, businessName, niche, deployUrl, vercelProjectId, status, adminEmail)
* `hub_users` — usuarios del dashboard (email como ID, role: owner/seller)
* `hub_prospects` — prospectos de venta (kanban: following/rejected/closed)
* `hub_expenses` — gastos del negocio
* `provider_messages` — mensajes entre clientes y Liam (sender: client/provider)
* `hub_payments` — pagos (type: initial/recurring, status: paid/pending/failed/cancelled, amount, contractAccepted, cardcomLowProfileCode, cardcomTransactionId, cardLastFour)

## PostgreSQL (monitor)

Tablas:

* `metrics` — checks de uptime por cliente (client_id, check_type, response_time_ms, success, checked_at)
* `incidents` — incidentes detectados (client_id, severity, claude_diagnosis, resolved)

## Modelo de pagos

* Setup inicial: ₪4,200 (type: "initial")
* Mensualidad: ₪500 (type: "recurring")
* Proveedor: Cardcom Low Profile (API key + password + terminal en env)
* Comisión Cardcom transacciones locales: 1.2%
* Flujo completo:
  1. Cliente visita /pago/[clientId] → ve contrato
  2. Firma contrato → POST /api/payments/contract → crea payment "pending" en Firestore
  3. Click "Continuar al pago" → POST /api/cardcom/create-payment → obtiene URL de Cardcom
  4. Redirect a Cardcom Low Profile → cliente ingresa tarjeta
  5. Cardcom redirige a /pago/success?LowProfileCode=xxx&ReturnValue=clientId
  6. /pago/success llama POST /api/cardcom/verify-payment → verifica con Cardcom API, actualiza payment a "paid"
* Idempotencia: verify-payment verifica cardcomLowProfileCode antes de re-procesar
* Rate limiting: endpoints públicos limitados a 5-10 req/min por IP
* Módulo de precios: src/lib/pricing.ts (getPaymentAmount, CURRENCY)

## Sistema de monitoreo (monitor-agent)

* Corre en Railway por separado (proyecto: monitor-agent)
* Lee clientes activos desde Firestore (hub_clients, cache 5min TTL)
* Fast round (cada 5min): checks HTTP + API con concurrencia acotada (10 workers)
* Slow round (cada 30min): checks Firestore + Booking
* Registra métricas en PostgreSQL, computa baselines con percentile_cont(0.95)
* Detecta anomalías automáticamente (latencia >3x p95 = critical, >1.5x p95 sostenido = warning)
* Agente Claude (claude-sonnet-4-6) diagnostica incidentes con tool-use loop (max 5 turns)
* Herramientas del agente: getMetricsHistory, vercelLogs, vercelRedeploy, writeIncident
* Auto-resolve: 3 checks consecutivos sanos → resuelve incidente automáticamente
* Protecciones: max 3 agentes concurrentes, cooldown 10min por cliente, rate limit emails 5/hora
* Health endpoint: HTTP en :8080 reporta estado de rounds (Railway healthcheck)
* Pruning automático: métricas >30 días se borran diariamente
* Email notifications: Resend, solo cuando requiere intervención manual
* Kill switch: pausa/reactiva proyectos Vercel via API (env: VERCEL_TOKEN)

## Diseño y UI

* Tema: oscuro (`#09090b` background)
* Colores definidos en @theme en globals.css (--color-bg, --color-accent: `#3b82f6`, --color-success: `#22c55e`, etc.)
* Tipografía: Inter (Google Fonts)
* Componentes de referencia: ClientStatusBadge, HealthDot en status-badge.tsx
* Todo el texto de UI en ESPAÑOL
* Estilo consistente con páginas existentes (ver clients/page.tsx como referencia)

## Reglas de desarrollo

1. No modificar archivos existentes salvo los explícitamente indicados en el prompt
2. Mantener el mismo estilo visual exacto del resto del dashboard
3. Todo texto de UI en español
4. Cardcom integrado via Low Profile — módulo en src/lib/cardcom.ts
5. Las páginas /pago/* son PÚBLICAS — no requieren autenticación, pero tienen rate limiting
6. Todas las demás rutas son PRIVADAS — requieren rol owner o seller (withOwner/withAuth)
7. Usar Firebase Admin via src/lib/firebase-admin.ts (nunca inicializar Firebase directamente)
8. Usar pool de PostgreSQL via src/lib/postgres.ts
9. Agregar tipos en src/types/index.ts cuando se crean nuevas entidades
10. PUT /api/clients filtra campos con allowlist (ALLOWED_CLIENT_FIELDS) — no acepta campos arbitrarios
11. Endpoints públicos deben usar src/lib/rate-limit.ts para protección contra abuso

## Archivos clave

* `src/lib/firebase-admin.ts` — inicialización Firebase con preferRest
* `src/lib/postgres.ts` — pool PostgreSQL con SSL Railway (Proxy pattern, lazy init)
* `src/lib/auth.ts` — next-auth config con roles (withOwner, withAuth wrappers)
* `src/lib/auth-types.ts` — augmentación tipos NextAuth session/user
* `src/lib/cardcom.ts` — integración Cardcom Low Profile (createLowProfilePayment, verifyPayment)
* `src/lib/pricing.ts` — montos de pago y moneda (getPaymentAmount, CURRENCY)
* `src/lib/rate-limit.ts` — rate limiter in-memory por IP para endpoints públicos
* `src/lib/classify.ts` — clasificación de mensajes con Claude Haiku
* `src/types/index.ts` — todos los tipos TypeScript del proyecto
* `src/components/app-shell.tsx` — layout principal con auth guard
* `src/components/sidebar.tsx` — navegación (ownerNav vs sellerNav)
* `src/components/providers.tsx` — context/provider setup
* `src/components/status-badge.tsx` — badges de estado
* `src/app/globals.css` — design tokens (@theme variables)
