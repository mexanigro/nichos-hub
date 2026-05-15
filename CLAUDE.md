# nichos-hub — CLAUDE.md

Dashboard de operaciones para Arzac Studio. Propietario: Liam Arzac (website@arzac.studio). SaaS de webs para negocios locales en Israel. Modelo: 0 setup + 800 NIS/mes. Pagos: Cardcom. UI en espanol.

## Convenciones de trabajo

- No crear worktrees ni ramas separadas salvo que se pida explicitamente.
- Todos los cambios deben aplicarse directamente en los archivos del proyecto.
- UI siempre en espanol.
- Tema oscuro (#09090b), Tailwind @theme variables en globals.css.

## Ecosistema (3 repos)

| Repo | Que es | Hosting | Stack |
|---|---|---|---|
| **nichos-hub** (este) | Dashboard operaciones + config de clientes | Railway | Next.js 16, Firestore, PostgreSQL |
| **master-template** | Web de cada cliente (landing + CRM + chatbot) | Vercel (subdominios arzac.studio) | React 19, Vite, Express, Firestore |
| **whatsapp-agentkit** | Agente WhatsApp con IA para ventas/soporte | Railway | Python, FastAPI, Claude API, SQLite |

Conexion entre los 3: Firestore `hub_clients` es la fuente de verdad. Vercel API para kill switch/redeploy. WhatsApp agent opera independientemente pero comparte contexto de leads.

## Stack

Next.js 16 App Router (standalone output) | next-auth v5 beta (Google OAuth, roles owner/seller) | Firebase Admin + Firestore | PostgreSQL (metricas monitor) | Tailwind v4 | Resend (emails) | Claude Haiku (clasificacion mensajes) | Cardcom (pagos)

## Rutas

### Privadas (owner/seller)
* `/clients` -- listado de clientes con filtros y estado
* `/clients/[clientId]` -- detalle de cliente con tabs (Overview, Config, Messages, Monitor)
* `/payments` -- historial de pagos y facturacion
* `/messages` -- inbox unificado de mensajes de todos los clientes
* `/monitor` -- dashboard de salud de webs (uptime, errores, metricas)
* `/sales` -- pipeline de ventas y prospectos
* `/expenses` -- control de gastos operativos

### Publicas (rate limited)
* `/pago/[clientId]` -- pagina de pago para el cliente (Cardcom)
* `/pago/success` -- confirmacion de pago exitoso
* `/pago/error` -- error en pago

## Auth

Google OAuth via next-auth v5. Roles: `owner` (OWNER_EMAIL env) y `seller` (Firestore hub_users). Wrappers: `withOwner(handler)`, `withAuth(handler)` en `src/lib/auth.ts`. Sin middleware.ts, proteccion via app-shell.tsx.

## Firestore collections

* `hub_clients` -- clientes del SaaS (fuente de verdad del ecosistema)
* `hub_users` -- usuarios del dashboard (roles, permisos)
* `hub_prospects` -- leads de ventas (pipeline)
* `hub_expenses` -- gastos operativos
* `provider_messages` -- mensajes cliente <-> Liam
* `hub_payments` -- registro de pagos
* `config/{clientId}` -- config override por cliente (se aplica al master-template)

## Config tab (control remoto de cada web)

`/clients/[clientId]` tab Config edita `config/{clientId}` en Firestore. El master-template lee ese documento al arrancar y aplica deep merge sobre el preset del nicho.

### Feature flags (secciones de la web)

showHero, showServices, showWhyChooseUs, showTeam, enableStaffPages, showAbout, enableAboutPage, showGallery, showTestimonials, showInquiry, showLocation, showBusinessHours, showInstagram, showBooking, showWhatsAppInChat.

### Nichos disponibles

barberia, estetica, tattoo, nails. Cada uno con 3 temas visuales y 3 idiomas (en, he, ru).

### Splash screen

5 variantes seleccionables: Classic (1), Curtain (2), Pulse (3), Typewriter (4), Vortex (5). Cada nicho tiene un default: barberia=1, tattoo=5, nails=3, estetica=4.

### Otros overrides

* `activeTheme` -- cambiar tema visual del cliente
* `visibleServices` -- filtrar y reordenar servicios
* `serviceOverrides` -- patchear nombre/precio/duracion/imagen de servicios individuales
* `splash.enabled`, `splash.variant`, `splash.durationMs`, `splash.image`
* `payment.enabled`, `payment.mode`
* `notifications.*` -- toggles de alertas

### businessMode

"solo" (un profesional) o "team" (equipo). Solo mode: oculta staff tab, muestra About en nav, elimina columna staff de turnos.

## Pagos

Cardcom Low Profile. Flujo: contrato firma -> payment pending -> redirect Cardcom -> verify-payment (idempotente). Endpoints publicos con rate limiting via `src/lib/rate-limit.ts`.

## Reglas de desarrollo

- Firebase via `src/lib/firebase-admin.ts`, PostgreSQL via `src/lib/postgres.ts`
- Tipos en `src/types/index.ts`
- Endpoints publicos usan `src/lib/rate-limit.ts`
- No crear worktrees/ramas salvo que se pida
- Para cambios en UI del browser (Railway, Vercel dashboard), dar instrucciones manuales al usuario en vez de automatizar
