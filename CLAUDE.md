# nichos-hub

Dashboard de operaciones Arzac Studio. SaaS de webs para negocios locales en Israel.
Propietario: Liam Arzac (website@arzac.studio). Modelo: 0 setup + 800 NIS/mes.

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
