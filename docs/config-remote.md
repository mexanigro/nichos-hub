# Sistema de Configuracion Remota

Como nichos-hub controla cada web desplegada en Vercel via Firestore.

## Flujo de lectura (master-template)

1. Al arrancar, master-template llama `bootstrapTenantConfig()` en `src/services/tenant.ts`
2. Lee `clients/{clientId}` para verificar status (kill-switch)
3. Lee `config/{clientId}` para obtener overrides de configuracion
4. Llama `applyTenantConfigOverride()` que hace deep merge sobre el preset del nicho

## Regla de SAFE_FIRESTORE_TOP_LEVEL

Cuando `config/{clientId}` tiene `business.type` que coincide con el nicho de la build (`VITE_ACTIVE_NICHE`), se aplica el documento completo como override.

Cuando `business.type` falta o no coincide (el caso normal para la mayoria de clientes), solo se aplican los campos en `SAFE_FIRESTORE_TOP_LEVEL`:

- `features` — toggles de secciones
- `payment` — configuracion de pagos
- `notifications` — alertas email/SMS
- `adminEmail` — email del administrador
- `splash` — pantalla de carga
- `businessRules` — buffer, max advance days, etc.
- `activeTheme` — ID del tema visual
- `hero` — heading, subtitle, CTA, background image
- `gallery` — array de URLs de imagenes
- `sections` — headings y subtitles de cada seccion
- `staff` — nombres, fotos, schedules
- `brand` — nombre, tagline, logo, description
- `contact` — telefono, email, direccion, redes sociales
- `businessMode` — "solo" o "team"

## Campos editables desde nichos-hub

### Brand
- `brand.name` — nombre del negocio
- `brand.tagline` — subtitulo
- `brand.logo` / `brand.logoDark` — URLs de logo
- `brand.description` — meta description SEO
- `brand.ogImage` — imagen Open Graph
- `brand.aiPersona` — personalidad del chatbot

### Contact
- `contact.phone` — telefono (tambien activa WhatsApp)
- `contact.email` — email de contacto
- `contact.address.street` / `.district` / `.cityStateZip`
- `contact.social.*` — Instagram, Facebook, etc.

### Features (todos los toggles)
- `features.showBooking`, `showGallery`, `showTeam`, `showHero`, etc.

### Hero
- `hero.titlePrefix` / `.titleHighlight` / `.titleSuffix`
- `hero.subtitle`, `hero.ctaPrimary`, `hero.ctaSecondary`
- `hero.backgroundImage`, `hero.stats[]`

### Staff
- `staff[].name`, `.specialty`, `.bio`, `.photoUrl`, `.schedule`

### Services
- `visibleServices[]` — filtrar y reordenar servicios por ID
- `serviceOverrides.{id}.*` — patch nombre, precio, imagen por servicio

### Otros
- `businessMode` — "solo" (oculta team) o "team"
- `activeTheme` — ID del tema (ej: "barberia-urban")
- `hours.{day}.*` — horarios por dia
- `businessRules.*` — bufferMinutes, maxAdvanceBookingDays, autoConfirm
- `payment.*` — enabled, mode, provider, depositAmount
- `splash.*` — enabled, variant, durationMs
- `gallery[]` — URLs de imagenes de galeria
- `sections.*.heading` / `.subtitle` — textos de cada seccion

## Coleccion clients/{clientId} (kill-switch)

Solo contiene `{ status: "active" | "suspended" | "trial" | "maintenance" | "archived" | "demo" }`.

La plantilla verifica esto en cada request. Modificar SOLO via:
- `/api/clients/kill` — pausa/reactiva
- `/api/clients/provision` — crea nuevo cliente

Esto mantiene sincronizacion con `hub_clients`.

## Regla critica

**Nunca cambiar `business.type` en `config/{clientId}` sin redesployar el proyecto Vercel.**

El `business.type` debe coincidir con `VITE_ACTIVE_NICHE` de la build. Si no coinciden, solo se aplican campos SAFE_FIRESTORE_TOP_LEVEL, no el documento completo.
