# Nichos-Hub Audit — 2026-06-01

Auditoría completa del dashboard de operaciones de Arzac Studio.
10 agentes paralelos, ~300 tool calls, 85+ componentes, 65+ API routes, 35+ páginas.

---

## PARTE 1 — Estado funcional

### Resumen general

El dashboard está **operativamente funcional**. Las páginas renderizan, los CRUD a Firestore funcionan, el flujo de provisioning crea clientes end-to-end, y el sistema de pagos Cardcom procesa transacciones. El diseño es consistente con el dark theme (#09090b) y los tokens de diseño están bien organizados.

### Positivos destacados

- **SaveDiffModal** en Config tab — diff visual antes de guardar en Firestore. Auditoría en `config_history` con path/kind/before/after.
- **Draft persistence dual** en wizard — localStorage (500ms debounce) + Firestore server-side (2s debounce) con merge inteligente.
- **Provisioning robusto** — crea `hub_clients`, `clients/{id}`, `config/{id}`, luego despliega a Vercel. Manejo de fallos parciales.
- **i18n TypeScript-enforced** — 5 locales con interfaz `Translations` tipada. Detección de keys faltantes en compile-time. Soporte RTL.
- **Normalización de config** en API — `normalizeConfigShape`/`normalizeImageArray` arregla formatos legacy automáticamente.
- **Sistema de 3D Impact** — hero objects, composition layers, slot picker, variant selectors — impresionantemente completo.
- **Delete safeguard** — escribir "eliminar" para confirmar. Cascadea cleanup a Vercel, Firestore orphans, colecciones relacionadas.
- **Leads tab** — optimistic updates con rollback, paginación cursor-based, CSV export RFC 4180 con BOM para Excel.
- **CRM import AI** — parse de texto libre via Anthropic + CSV con auto-mapping de columnas.

---

## PARTE 2 — Bugs encontrados y corregidos

### Bugs CRÍTICOS (5)

| # | Archivo | Descripción | Estado |
|---|---------|-------------|--------|
| 1 | `expenses/page.tsx:42` | **Moneda ARS en vez de ILS.** Todos los gastos se muestran como Pesos Argentinos. | **CORREGIDO** |
| 2 | `api/cardcom/verify-payment/route.ts:77` | **Race condition en fallback de payment.** Dos requests concurrentes crean registros duplicados sin transacción. Registros incompletos (sin plan/amount/currency). | Pendiente — requiere refactor con transaction |
| 3 | `api/messages/reply/route.ts:27` | **createdAt usa `new Date()` en vez de `FieldValue.serverTimestamp()`.** Causa crash o timestamps inconsistentes al leer. | **CORREGIDO** |
| 4 | `onboarding/preview/page.tsx:57` | **submitGuard nunca se resetea en error.** Auto-submit queda permanentemente roto tras un fallo. | **CORREGIDO** |
| 5 | `clients/[clientId]/page.tsx:151` | **Fetch sin error handling.** Un 404/500 causa `setData({error: ...})` que crashea al destructurar `client.businessName`. | Pendiente — requiere error state UI |

### Bugs HIGH (11)

| # | Archivo | Descripción | Estado |
|---|---------|-------------|--------|
| 1 | `clients/[clientId]/page.tsx:175` | toggleStatus hace optimistic update sin verificar API response | Pendiente |
| 2 | `api/clients/kill/route.ts:43` | Vercel pause/unpause endpoints posiblemente inexistentes en API pública | Pendiente — verificar docs |
| 3 | `messages/page.tsx:48` | fetchMessages sin try/catch — spinner stuck forever en error | **CORREGIDO** |
| 4 | `messages/page.tsx:86` | PATCH mark-as-read fire-and-forget sin rollback | Pendiente |
| 5 | `payments/page.tsx:37` | Fetch sin error handling — spinner vanishes, empty list sin retry | Pendiente |
| 6 | `monitor/page.tsx:62` | Fetch sin error handling — página completamente en blanco en error | Pendiente |
| 7 | `rate-limit.ts:6` | Rate limiter in-memory se resetea en cold start | Aceptable en Railway single-instance |
| 8 | `onboarding/pago/success/page.tsx:159` | Strings hardcodeados con if/else locale en vez de i18n | Pendiente |
| 9 | `config-validator.ts:231` | Operator precedence bug en hasData boolean | **CORREGIDO** |
| 10 | `api/crm/import/route.ts:152` | Rollback counter puede ir negativo | Pendiente |
| 11 | `pago-client.tsx:276` | CSS duplicado `-top-px` y `top-4` en plan indicator | **CORREGIDO** |

### Bugs MEDIUM (16)

| # | Archivo | Descripción | Estado |
|---|---------|-------------|--------|
| 1 | `deploy.ts:53` | ALLOWED_UI_LANGUAGES falta 'es' — Spanish deploys en Hebrew | **CORREGIDO** |
| 2 | `api/clients/route.ts:64` | POST crea clientes sin config/{id} — path duplicado con provision | Pendiente |
| 3 | `clients/new/page.tsx:170` | "Crear otro" no resetea niche/language/mode | **CORREGIDO** |
| 4 | `sales/page.tsx:101` | moveProspect/addNote optimistic sin check response | Pendiente |
| 5 | `expenses/page.tsx:123` | handleDelete no verifica response status | Pendiente |
| 6 | `messages/page.tsx:118` | handleReply traga errores silenciosamente | Pendiente |
| 7 | `api/messages/route.ts:47` | autoClassify corre en cada GET — caro, lento, race conditions | Pendiente |
| 8 | `email-templates.ts:43` | URLs en href no sanitizadas | Pendiente |
| 9 | `classify.ts:4` | Anthropic client eager init crashea si falta API key | Pendiente |
| 10 | `composition-layers-editor.tsx:152` | ReorderControls click bubbles al accordion parent | **CORREGIDO** |
| 11 | `api/onboarding/client-info/route.ts:38` | No verifica clientId existe antes de escribir | Pendiente |
| 12 | `api/deploy/route.ts:9` | DEPLOY_SECRET no usa timing-safe comparison | Pendiente |
| 13 | `api/cardcom/webhook/route.ts:26` | Webhook sin auth ni rate limiting | Pendiente |
| 14 | `client-content-tab.tsx:239` | Empty strings en vez de null — no puede remover fields | Pendiente |
| 15 | `api-costs/page.tsx:86` | localStorage en useState causa hydration mismatch | Pendiente |
| 16 | `hero-objects-editor.tsx:281` | showComposition state stale tras delete | Pendiente |

### Quick fixes adicionales aplicados

| Archivo | Fix |
|---------|-----|
| `clients/new/page.tsx` | Agregados idiomas Árabe y Español al formulario |
| `showcase.tsx` | Non-null assertion `!` cambiado a `?? SITES[0]` |
| `status-badge.tsx` | Fallback para status desconocido (previene crash) |
| `api-keys/route.ts` | `.trim()` en validación de API keys |
| `whatsapp-fab.tsx` | Label cambiado de CTA genérico a "WhatsApp" |
| `crm-section.tsx` | Bullet numbering `0{i+1}` → `padStart(2, "0")` |

**Total: 14 fixes implementados, build pasa limpio.**

---

## PARTE 3 — Mejoras de UX

### Navegación

| Prioridad | Issue | Recomendación |
|-----------|-------|---------------|
| **Alta** | Tabs de cliente no sincronizan con URL | Usar `?tab=config` con `router.replace` |
| **Alta** | Tab bar no scrollable en mobile (<380px) | Agregar `overflow-x-auto` |
| **Alta** | Wizard sin navegación directa a steps anteriores | Hacer progress dots clickeables (goTo() ya existe) |
| **Alta** | Landing mobile sin navegación | Agregar hamburger menu/drawer |
| Media | Pricing CTAs no pasan plan seleccionado | `?plan=essential` en la URL |

### Feedback y estados de error

| Prioridad | Issue | Recomendación |
|-----------|-------|---------------|
| **Alta** | 8+ páginas con mismo patrón: sin .catch(), spinner stuck, empty ≈ error | Shared `useFetch` hook con error/retry |
| **Alta** | Reply silencioso — ghost messages en thread | Error banner + restore reply + remove optimistic msg |
| **Alta** | Upload rechaza >500KB sin feedback (4 componentes) | Inline error + client-side compression |
| Media | Login no muestra errores de auth | Leer `?error` param de next-auth |
| Media | Payment success retry redirige al flow completo (double-pay risk) | Botón "Reintentar verificación" |

### Formularios

| Prioridad | Issue | Recomendación |
|-----------|-------|---------------|
| **Alta** | Config/Content tabs pierden edits sin warning al cambiar tab | Dirty state tracking + confirm dialog |
| Media | 18 config editors sin `htmlFor`/`id` — labels no clickeables | `useId()` de React 18 |
| Media | Config tab 2065 líneas, 25+ secciones sin búsqueda | Search bar que filtra secciones |
| Media | Expense delete sin confirmación — 1 click elimina | Confirm dialog o soft-delete con undo |

### Consistencia visual

| Prioridad | Issue | Recomendación |
|-----------|-------|---------------|
| **Alta** | mi-cuenta usa light theme (`bg-[#fafafa]`), resto es dark | Restilizar con tokens dark theme |
| Media | Spanish locale sin `name` en showcase.sites | Agregar names traducidos |
| Baja | Founder section completa pero comentada | Habilitar con foto real |

### Mobile

| Prioridad | Issue | Recomendación |
|-----------|-------|---------------|
| Media | Action buttons client detail se stackean feo en mobile | Overflow menu para acciones destructivas |
| Media | Lang switcher touch targets <44px | Dropdown en mobile |
| Media | CRM import dice "drag & drop" pero solo soporta click | Agregar handlers o cambiar texto |
| Media | Monitor sin auto-refresh | Polling 30-60s + botón refresh |

---

## PARTE 4 — Feature Ideas (ranked por impacto/esfuerzo)

### Impacto Crítico

| # | Feature | Descripción | Esfuerzo |
|---|---------|-------------|----------|
| 1 | **Billing cron job** | `chargeToken` existe pero nada lo invoca. Sin billing automático, cobrar requiere intervención manual cada mes por cada cliente. | Medium (1-2 sesiones) |

### Impacto Alto

| # | Feature | Descripción | Esfuerzo |
|---|---------|-------------|----------|
| 2 | URL tab persistence | `?tab=config` para refresh, back/forward, deep links | Small |
| 3 | Image compression client-side | Auto-compress fotos de celular (3-10MB → 500KB) | Medium |
| 4 | Real-time messages | Polling 30s o Firestore onSnapshot + unread badge en nav | Medium |
| 5 | Unsaved changes guard | Dirty tracking en Config/Content tabs | Medium |
| 6 | Wizard step navigation | Progress dots clickeables (goTo() ya existe) | Small |
| 7 | Unread message badge | Badge en "Mensajes" del sidebar | Small |
| 8 | Mobile nav drawer (landing) | Hamburger menu con links a secciones | Small |

### Impacto Medio

| # | Feature | Descripción | Esfuerzo |
|---|---------|-------------|----------|
| 9 | Auto-save indicator wizard | Subtle "Guardado" indicator | Small |
| 10 | Plan selection persistence | Pasar plan via query param al CTA | Small |
| 11 | Duplicate item en list editors | Clonar servicios/staff/menu items | Small |
| 12 | Bulk actions en client list | Checkbox + redeploy/suspend masivo | Medium |
| 13 | Payment reminders | Detectar pagos vencidos + alerts | Medium |
| 14 | Sales analytics | Conversion rate, time in pipeline | Small |
| 15 | Config tab search | Buscar entre 25+ secciones | Medium |
| 16 | Login error display | Mostrar errores de next-auth | Small |
| 17 | Expense receipt upload | Adjuntar fotos/PDFs a gastos | Small |
| 18 | Cmd+S shortcut para save | En Config y Content tabs | Small |
| 19 | Redis rate limiter | Upstash Redis para persistencia | Small |

### Proyectos Grandes (sesión separada)

| # | Proyecto | Descripción | Esfuerzo |
|---|----------|-------------|----------|
| A | **Billing cron** | Endpoint que itera clientes activos, cobra via chargeToken, registra en hub_payments | 1-2 sesiones |
| B | **Server-side i18n (SEO)** | Route-based locale (/en, /he, /ar) con metadata por idioma, hreflang, html lang | Múltiples sesiones |
| C | **Error handling overhaul** | Shared useFetch hook + error UI consistente en 8+ páginas | 1-2 sesiones |
| D | **Real-time messaging** | Firestore onSnapshot + unread badge + notifications | 1-2 sesiones |
| E | **P&L dashboard unificado** | Revenue + expenses + API costs en vista consolidada | Múltiples sesiones |
| F | **mi-cuenta self-service** | Billing history, invoices Cardcom, cancel form, notification prefs | Múltiples sesiones |
| G | **Image compression pipeline** | Client-side compression + progress UI en 4 upload components | 1 sesión |
| H | **Arabic language completion** | Contract text, pago-client i18n, success page strings, RTL testing | 1-2 sesiones |

---

## Stubs y features incompletas

| Archivo | Estado |
|---------|--------|
| `cardcom.ts` — `chargeToken()` | Implementado, pero ningún cron lo invoca |
| `email.ts` — provider system | Default 'log' solo console.log. Resend code existe pero requiere API key |
| `contracts.ts` — Arabic text | Falta completamente. Clientes árabes reciben contrato en inglés |
| `pago-client.tsx` — Arabic i18n | Falta. Payment page rota para hablantes de árabe |
| `api-cost-fetchers.ts` | fetchAnthropicUsage/fetchVercelUsage son stubs — no retornan costos reales |
| `email-templates.ts` — liamMessage | TODO: URL apunta a homepage genérica en vez de portal de mensajes |
| `whatsapp status endpoint` | Depende de WHATSAPP_AGENT_URL env var no configurada |
| `mi-cuenta/page.tsx` | Read-only. Sin edición, billing history, ni invoices |
| `monitor/page.tsx` | Read-only. Sin resolución de incidentes, health check manual, ni alertas |
| `founder.tsx` | Completo pero comentado. Esperando foto real |
| `client-config-tab.tsx` — ImageListField | 50+ líneas de dead code (componente no usado) |
| `payments/page.tsx` | Sin edición. API tiene PATCH pero UI no lo expone |
| `expenses/page.tsx` | Sin edición de gastos existentes. Sin gráficos |

---

## Resumen ejecutivo

**Lo que funciona bien:**
- Core loop funcional: provisioning → config → deploy → cobro (primer pago)
- Dark theme consistente con tokens bien organizados
- i18n tipado con 5 locales
- Config editors completos con diff visual y auditoría
- Wizard onboarding con draft persistence dual

**Lo que necesita atención urgente:**
1. Billing automático (chargeToken sin invocar)
2. Error handling sistemático (8+ páginas vulnerable)
3. Currency bug corregido (ARS → ILS)
4. Verify-payment race condition
5. Arabic language gaps (contratos, pagos)

**Quick wins implementados hoy: 14 fixes** — build pasa limpio.
