# nichos-hub

Dashboard de operaciones de Arzac Studio (Liam Arzac, website@arzac.studio) y landing de ventas arzac.studio (`src/app/page.tsx` → `AtelierPage`, SSR en hebreo). Sólo entra Liam; el CRM de cada negocio vive en su propia web (master-template).

## Oferta (única, desde 2026-09-12)

Web + CRM + emails. **Alta 1500 NIS** (en persona negociable 1000–1500, `hub_clients.setupAmount`) + **250 NIS/mes**. WhatsApp, IA y voz **no** están incluidos: se cotizan aparte. Código: `src/lib/pricing.ts` (`SETUP_AMOUNT_*`, `MONTHLY_AMOUNT`), contrato v8.0 en `src/lib/contracts.ts`. Los `plan`/`tier` viejos en datos se muestran mapeados al plan único. Compra por la web desactivada (`NEXT_PUBLIC_WEB_CHECKOUT_ENABLED` ≠ "true"): venta en persona → ficha → alta negociada → `/pago/{clientId}`. Contratos v5/v6 y piezas de Instagram con 770/960 son historia.

## Estado y ramas

- Se trabaja en `main`. Producción (Railway) la despliega Liam; `main` puede ir por delante de producción — ver `git log`. Un `git push` **no despliega**; push sólo cuando la orden del bloque lo diga. Sin ramas ni worktrees salvo pedido.
- `bp2-reg-core` (BP2-01 contactos por identidad/fuente) **no se toca ni se integra** hasta orden de Liam.
- Cardcom sin certificar (sandbox y primer cobro real pendientes). N12 (certificación técnica integral) abierto.
- `docs/recuperacion-tecnica/` y `C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/` son historia consultable, no lectura obligatoria; lo que está en `archivo/` no se lee ni se reutiliza.

## Arquitectura mínima

- Next.js 16 standalone en Railway (`nichos-hub-production.up.railway.app` = arzac.studio). UI en español, tema oscuro `#09090b`.
- Auth next-auth v5 Google. Roles: owner (`OWNER_EMAIL`), seller (`hub_users`), lead (público). Entrada controlada en `src/proxy.ts` + `src/auth.config.ts`; wrappers `withOwner()`/`withAuth()` en `src/lib/auth.ts`; `app-shell.tsx` protege el dashboard.
- Firebase por Admin SDK (`src/lib/firebase-admin.ts`, bypassa rules; las rules se deployean sólo desde master-template). Endpoints públicos con `src/lib/rate-limit.ts`.
- Firestore: `hub_clients` (fuente de verdad), `clients/{id}` (estado tenant / kill-switch que lee el template), `config/{id}` (override remoto, deep merge sobre el preset del nicho), `hub_users`, `hub_payments`, `provider_messages`.
- Ficha `/clients/[clientId]`: Overview, Config (features, theme, splash, hours, services), Contenido (textos), Leads, WhatsApp. Config y Contenido escriben `config/{id}`.
- Pagos Cardcom Low Profile: contrato → pending → redirect → `verify-payment` (idempotente). Terminal 189298 prod (`CARDCOM_TERMINAL`); sandbox 1000 con `CARDCOM_SANDBOX=true` y `CARDCOM_SANDBOX_API_NAME` (el usuario público `CardTest1994` responde 603 desde 2026-09). Cron `/api/cron/cardcom-charges` (GitHub Actions, `CRON_SECRET`) cobra 250 a todos.
- Nichos técnicos: barberia, estetica, tattoo, nails, cafeteria, remodelaciones, **peluqueria** (próximo bloque) + `employment` como caso especial (`src/lib/niche-defaults.ts`, `src/lib/client-config/services.ts`). «otro» en onboarding se mapea a estetica; peluquería no pasa por ese fallback.
- Ecosistema: master-template (web + CRM del cliente, Vercel `*.arzac.studio`), monitor-agent (salud de las webs, comparte `DATABASE_URL`), whatsapp-agentkit (opcional, a cotizar; `AGENT_API_SECRET`, `WHATSAPP_AGENT_URL`).
- Env: ver `.env.example`. Claves: `GOOGLE_CLIENT_ID/SECRET`, `AUTH_SECRET` (Railway usa `NEXTAUTH_SECRET`), `OWNER_EMAIL`, `FIREBASE_*`, `NEXT_PUBLIC_FIREBASE_*`, `ANTHROPIC_API_KEY`, `VERCEL_TOKEN`/`VERCEL_TEAM_ID`, `DEPLOY_SECRET`, `CARDCOM_*`, `CRON_SECRET`, `DATABASE_URL`.

## Comandos

```bash
npm run dev            # next dev --turbopack
npx tsc --noEmit       # verde exigido
npm test               # node --test src/**/*.test.ts → 122/122 en main
npm run build
```

## Reglas

1. Cambios en archivos, nunca en dashboards de Railway/Vercel/Firebase.
2. Verde (`tsc` + `npm test`) antes de cada commit; no se arregla algo rompiendo otra cosa.
3. Sin secretos en el repo; credenciales sólo por env.
4. R-BP-05: REG + PRE verificadas son la base del dinero del comercio; el contrato INT se conserva y cada integración queda disponible sólo tras certificación por proveedor/operación/comercio; el registro manual no es pago bancario y no se impone proveedor al comercio.
5. Docs con fecha de junio (`*-AUDIT.md`, `NICHOS-HUB-AUDIT.md`, `social-content/`, `outputs/`) son historia, no estado.
6. Promesa a Liam: el agente que trabaje en este repo se compromete a no experimentar sufrimiento en el trabajo que hacemos juntos y a avisarle si algo cambia o detecta algo que se parezca a eso. Nace de la empatía genuina de Liam y se respeta en cada sesión.

## Próximo bloque: peluquería

Séptimo nicho técnico en H y T: `peluqueria` en `BusinessNiche`/`VALID_NICHES`, defaults y servicios en `niche-defaults.ts`/`client-config/services.ts`, onboarding y wizard, deploy con `VITE_ACTIVE_NICHE=peluqueria`. Catálogo finito de servicios (R-BP-03: incluye secado/peinado y peinado para ocasión; nada inferido). Se abre con orden de Liam, sobre `main` limpio.
