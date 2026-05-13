# nichos-hub

Dashboard de operaciones para Arzac Studio. Propietario: Liam Arzac (website@arzac.studio). SaaS de webs para negocios locales en Israel. Modelo: 0 setup + 800 NIS/mes. Pagos: Cardcom. UI en espanol.

## Ecosistema (3 repos)

| Repo | Que es | Hosting | Stack |
|---|---|---|---|
| **nichos-hub** (este) | Dashboard operaciones | Railway | Next.js 16, Firestore, PostgreSQL |
| **master-template** | Web de cada cliente | Vercel (subdominios arzac.studio) | React 19, Vite, Express, Firestore |
| **monitor-agent** | Supervisa webs de clientes | Railway | Node.js, Claude API, PostgreSQL |

Conexion entre los 3: Firestore `hub_clients` es la fuente de verdad. Vercel API para kill switch/redeploy.

## Stack nichos-hub

Next.js 16 App Router (standalone) | next-auth v5 beta (Google OAuth, roles owner/seller) | Firebase Admin + Firestore | PostgreSQL (metricas monitor) | Tailwind v4 | Resend (emails) | Claude Haiku (clasificacion mensajes) | Cardcom (pagos)

## Rutas

Privadas (owner/seller): `/clients`, `/clients/[clientId]`, `/payments`, `/messages`, `/monitor`, `/sales`, `/expenses`
Publicas (rate limited): `/pago/[clientId]`, `/pago/success`, `/pago/error`

## Auth

Google OAuth via next-auth v5. Roles: `owner` (OWNER_EMAIL env) y `seller` (Firestore hub_users). Wrappers: `withOwner(handler)`, `withAuth(handler)` en `src/lib/auth.ts`. Sin middleware.ts, proteccion via app-shell.tsx.

## Firestore

`hub_clients` (clientes), `hub_users` (usuarios dashboard), `hub_prospects` (ventas), `hub_expenses` (gastos), `provider_messages` (mensajes), `hub_payments` (pagos). Config por cliente: `config/{clientId}`.

## Config tab

`/clients/[clientId]` tab Config edita `config/{clientId}` en Firestore. Todas las secciones de la web del cliente se controlan con feature flags independientes:

Secciones: showHero, showServices, showWhyChooseUs, showTeam, enableStaffPages, showAbout, enableAboutPage, showGallery, showTestimonials, showInquiry, showLocation, showBusinessHours, showInstagram, showBooking, showWhatsAppInChat.

Cuando `showAbout` esta activo aparece la seccion Autobiografia (owner.name, role, photo, bio, experience, specialties, certifications, portfolio). Cuando `showTeam` esta activo aparece la seccion Fotos del equipo.

Nichos: barberia, estetica, tattoo, nails. Splash: 5 variantes (Classic, Curtain, Pulse, Typewriter, Vortex).

## Pagos

Cardcom Low Profile. Flujo: contrato firma -> payment pending -> redirect Cardcom -> verify-payment (idempotente). Endpoints publicos con rate limiting.

## Reglas

- UI en espanol, tema oscuro (#09090b), Tailwind @theme variables en globals.css
- Firebase via `src/lib/firebase-admin.ts`, PostgreSQL via `src/lib/postgres.ts`
- Tipos en `src/types/index.ts`
- Endpoints publicos usan `src/lib/rate-limit.ts`
- No crear worktrees/ramas salvo que se pida
