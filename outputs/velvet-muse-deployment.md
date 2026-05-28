# Velvet Muse Salon — Prueba de fuego 3D Impact

**Fecha:** 2026-05-28
**Cliente:** Velvet Muse Salon (full hairstyling demo)
**clientId:** `demo-velvet-muse`
**Dominio objetivo:** `https://demo-velvet-muse.arzac.studio`

## ⚠️ Post-mortem del crash (2da iteración)

El primer deploy crasheó con la pantalla de error en hebreo. Causa raíz: **dos bugs sumados**.

### Bug 1 (crash) — shape del `hero` no matchea el contrato del template
- El template lee `hero.titlePrefix.split(" ")` en el Hero estándar (`Barber-shop-template-main/src/components/landing/Hero.tsx:455`). Si `titlePrefix` es `undefined`, `TypeError: Cannot read properties of undefined (reading 'split')`.
- El Hero estándar también renderiza `<span>{hero.ctaPrimary}</span>` (`Hero.tsx:534`). Si `ctaPrimary` es un objeto `{label, href}`, React lanza `Objects are not valid as a React child` → ErrorBoundary atrapa.
- El config inicial escribía `hero.title`, `hero.tagline`, `hero.ctaPrimary: {label, href}`. Todo wrong.

**Por qué caía al Hero estándar (en lugar del 3D):** las variantes 3D se leen como **nested**, no como top-level keys:
| Top-level (lo que escribíamos) | Nested (lo que el template lee) |
|--|--|
| `heroVariant` | `hero.heroVariant` (`Hero.tsx:158`) |
| `whyChooseUsVariant` | `sections.whyChooseUs.whyChooseUsVariant` (`why-choose-us-icon-grid-3d.tsx:45`) |
| `servicesVariant` | `sections.services.servicesVariant` (`services-card-stack-tabs.tsx:65`) |
| `galleryVariant` | `sections.gallery.galleryVariant` (`gallery-portrait-bento-3d-cameo.tsx:73`) |
| `bookingVariant` | `sections.contact.bookingVariant` (`booking-form-map-hours-3d.tsx:110`) |

Como `hero.heroVariant` no existía, el Hero caía al renderer estándar — que aplicaba el split sobre `titlePrefix` (undefined del overlay) y renderizaba `ctaPrimary` (objeto) como child. Crash.

### Bug 2 (idioma del fallback) — `VITE_UI_LANGUAGE=he` hardcoded en `deploy.ts`
`Nichos-hub/src/lib/deploy.ts:95` mandaba `VITE_UI_LANGUAGE: "he"` literal en cada deploy. El template usa eso para inicializar `localeConfig` *antes* de cargar el config remoto. Por eso el ErrorBoundary (que lee `localeConfig.lang`) caía en hebreo aunque el cliente sea `language: "en"`.

### Fixes aplicados (commits locales, sin push)
1. **`scripts/provision-velvet-muse.mjs`** — reescrito buildConfig:
   - `hero.titlePrefix`/`titleHighlight`/`titleSuffix` (split del title)
   - `hero.subtitle` (no `tagline`)
   - `hero.ctaPrimary`/`ctaSecondary` como **strings** + `ctaPrimaryHref`/`ctaSecondaryHref` separados
   - `hero.heroVariant: "hero-3d-object"` (nested)
   - `sections.whyChooseUs.whyChooseUsVariant`, `sections.services.servicesVariant`, `sections.gallery.galleryVariant` — todos nested
   - `sections.contact.{bookingVariant, showMap, showHours, ...}` — booking vive bajo `contact`, no bajo `booking`
   - Quité `variantConfigs`, `globalAmbientParticles` (este último no es leído por el template) y los top-level variant keys.
2. **`src/lib/deploy.ts`** — `VITE_UI_LANGUAGE` ahora se resuelve desde `config/{clientId}.language` (Firestore) con fallback a `"he"` para clientes legacy. Aprovecha la lectura ya existente de `config` para no agregar otro round-trip.

### Confirmado que el commit de 3D Impact está en `origin/main`
```
2e0d51f fix(3d-impact): split static + motion transforms in HeroLayer
e052a87 feat(3d-impact): demo page Velvet Muse + paper physics sections
c5a4b86 feat(3d-impact): mount new servicesVariant + galleryVariant in switches
91759a9 feat(3d-impact): GalleryPortraitBentoCameo component (Velvet Muse style)
5aa9bbf feat(3d-impact): ServicesCardStackTabs component (Velvet Muse style)
... (16 commits 3D Impact en main)
```

### URLs hero objects
Verificadas en `outputs/3d-assets-manifest.json` — las URLs incluyen token (`?alt=media&token=...`). El template las consume vía `<img src>` directo, no requiere reautenticación.

### Re-deploy
Como no editamos el template, **no hay re-push del repo del template**. Solo:
1. Pushear los commits locales de Nichos-hub (yo no pusheo).
2. Redeploy del cliente Vercel (Nichos-hub hub deployado lee el `deploy.ts` fixeado):
   ```bash
   curl -X POST https://<hub-url>/api/deploy \
     -H "Content-Type: application/json" \
     -H "x-deploy-secret: $DEPLOY_SECRET" \
     -d '{"clientId":"demo-velvet-muse","niche":"estetica","hubDocId":"demo-velvet-muse"}'
   ```
   o desde el dashboard. Como el cliente Vercel project para `demo-velvet-muse` no se llegó a crear (el certificado nunca resolvió), este será el primer deploy real.

Alternativa: si el proyecto Vercel ya existe (visible en el dashboard de Vercel), se puede redeploy directamente desde ahí — la variable `VITE_UI_LANGUAGE` quedará vieja (`he`); habría que editarla a `en` manualmente en Vercel project settings antes del redeploy. El fix en `deploy.ts` recién aplica en deploys nuevos.

---


---

## 1. Estado del deploy

| Capa | Estado |
|------|--------|
| Firestore `hub_clients/demo-velvet-muse` | ✅ creado |
| Firestore `clients/demo-velvet-muse` | ✅ creado (espejo para template rules) |
| Firestore `config/demo-velvet-muse` | ✅ creado (30 top-level keys) |
| Hero objects 3D (Firebase Storage) | ✅ 3 slots con URLs públicas válidas |
| Vercel project | ⚠️ **pendiente — disparar manualmente** |
| Dominio `demo-velvet-muse.arzac.studio` | ⚠️ no resuelve (sin cert) — falta deploy |

**Blocker para ver la URL:** local no tiene `VERCEL_TOKEN`. Hay que disparar el deploy desde el hub Railway que sí lo tiene.

### Cómo disparar el deploy (Liam)

**Opción A — Desde el dashboard del hub (más simple):**
1. Login en el hub como owner.
2. Ir a `/clients/demo-velvet-muse`.
3. Si aparece botón "Redeploy" o "Deploy ahora", clickear.

**Opción B — Endpoint directo:**
```bash
curl -X POST https://<hub-url>/api/deploy \
  -H "Content-Type: application/json" \
  -H "x-deploy-secret: $DEPLOY_SECRET" \
  -d '{"clientId":"demo-velvet-muse","niche":"estetica","hubDocId":"demo-velvet-muse","demoMode":false}'
```

Tras unos ~60-120 seg, el sitio queda en `https://demo-velvet-muse.arzac.studio`.

---

## 2. Manifest de configs aplicadas

### Brand & theme

| Campo | Valor |
|-------|-------|
| `brand.name` | Velvet Muse |
| `brand.tagline` | Hair that feels like you |
| `brand.faviconEmoji` | 💇‍♀️ |
| `brand.aiPersona` | Salon virtual assistant (EN) |
| `theme.accent` | `#8b3a4b` (burgundy oscuro) |
| `theme.accentLight` | `#d4a0a8` (rose dust) |
| `theme.surfaceDark` | `#1a0f12` (burgundy casi negro) |
| `activeTheme` | `velvet-muse` |
| `language` | `en` |

### 3D Impact — variants

| Variante | Valor |
|----------|-------|
| `splash.variant` | `impact-reveal-3d` |
| `splash.durationMs` | 2000 |
| `heroVariant` | `hero-3d-object` |
| `whyChooseUsVariant` | `icon-grid-3d` |
| `servicesVariant` | `card-stack-tabs` |
| `galleryVariant` | `portrait-bento-3d-cameo` |
| `bookingVariant` | `form-map-hours-3d` |
| `globalAmbientParticles` | `{ enabled: true, type: "pearls", density: "subtle" }` |
| `heroObjectSlot` | `primary` |
| `whyChooseUsObjectSlot` | `secondary` |
| `galleryObjectSlot` | `accent` |

### Hero objects (3 slots desde Firebase Storage)

| Slot | src | particles | intensity |
|------|-----|-----------|-----------|
| `primary` | `velvet-muse/hero-primary.png` (pelo+tijera+espejo+bottle+cintas+perlas) | pearls | medium |
| `secondary` | `velvet-muse/hero-secondary.png` (tijera+peine+pelo+perlas) | none | subtle |
| `accent` | `velvet-muse/accent-bottle.png` (bottle+perlas+cinta+pedestal) | none | subtle |

### Contenido — counts

| Sección | Cantidad |
|---------|----------|
| Services | 6 (cut, color, smoothing, extensions, bridal, treatments) |
| Service filters | All / Cut / Color / Smoothing / Extensions / Styling |
| Why-Choose benefits | 6 (Award, Heart, Sparkles, Leaf, Coffee, Calendar) |
| Gallery images | 8 (Unsplash editorial hair portraits) |
| Gallery stats | 4 (350+, 98%, 10+, 5★) |
| FAQ items | 5 |
| Testimonials | 3 |
| Hours | Lun-Vie 10-20, Sab 9-19, Dom cerrado |

### Hero copy

- **Eyebrow:** FULL-SERVICE HAIR SALON
- **Title:** Hair that feels like *you*
- **Tagline:** Thoughtful cut. Dimensional color. Effortless smoothness. Extensions that blend seamlessly. Beauty that's all you.
- **CTA primary:** Book a consultation → `/booking`
- **CTA secondary:** Explore services → `/services`

### Contact

- **Phone:** +1 555 0100
- **Email:** hello@velvet-muse.test
- **Address:** 123 Rosewood Ave, Suite 5A, New York, NY 10012
- **Instagram:** @velvetmuse

---

## 3. Validación de shape

Corrido: `node scripts/inspect-config.mjs demo-velvet-muse`

- ✅ `brand.name` non-empty
- ✅ `gallery: string[]` (8)
- ✅ `sections.services.images: string[]` (4)
- ✅ `business.type: estetica`
- ⚠️ Inspector legacy marca `splash.variant: "impact-reveal-3d"` como BAD, pero esto es del script viejo. El validador real (`src/lib/config-validator.ts:71-82`) acepta los string variants del sistema 3D Impact (`impact-scale | impact-split | impact-reveal-3d`).

---

## 4. Checklist visual (para validar cuando Liam abra la URL)

Una vez el deploy esté arriba en `https://demo-velvet-muse.arzac.studio`:

- [ ] Splash con animación `impact-reveal-3d` aparece (~2s).
- [ ] Hero: texto a la izquierda, hero-primary 3D a la derecha (pelo+tijera+espejo+bottle+perlas).
- [ ] Hero badge "FULL-SERVICE HAIR SALON" visible arriba del title.
- [ ] Pearls flotando ambient (densidad sutil).
- [ ] WhyChooseUs en `icon-grid-3d` con 6 benefits + objeto `secondary` (tijera+peine+pelo).
- [ ] Services en `card-stack-tabs` con filtros: All / Cut / Color / Smoothing / Extensions / Styling.
- [ ] Gallery en `portrait-bento-3d-cameo` con 8 portraits + cameos del bottle 3D.
- [ ] Gallery muestra los 4 stats (350+, 98%, 10+, 5★).
- [ ] Booking con form + map + hours grid (`form-map-hours-3d`).
- [ ] Paleta burgundy (`#8b3a4b`) + rose dust (`#d4a0a8`) acorde.
- [ ] Tipografía editorial coherente con mockups Velvet Muse.
- [ ] FAQ con 5 ítems expandibles.
- [ ] Testimonials 3 con 5 estrellas.
- [ ] Mobile responsive en 375px y 768px.
- [ ] Idioma todo en inglés (no quedan strings hebreos del template default).
- [ ] Favicon = 💇‍♀️ (si el template lo soporta).

---

## 5. Archivos generados

| Archivo | Función |
|---------|---------|
| `scripts/provision-velvet-muse.mjs` | Script reproducible — re-correr para regenerar los 3 docs Firestore. |
| `outputs/velvet-muse-deployment.md` | Este doc. |

Re-ejecutar el script con `node scripts/provision-velvet-muse.mjs --no-deploy` re-escribe los 3 docs sin tocar nada de Vercel.

---

## 6. Blockers / próximos pasos

1. **Disparar `/api/deploy`** desde el hub deployado (Railway tiene `VERCEL_TOKEN` y `DEPLOY_SECRET`). Local no.
2. Cuando el deploy esté arriba, comparar visualmente contra los mockups Velvet Muse originales que mandaste.
3. Si el template no soporta alguna variante (e.g. `card-stack-tabs`), caerá al fallback legacy — habrá que mergear la rama 3D Impact en `master-template` antes del próximo cliente.
