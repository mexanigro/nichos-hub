# Wizard reference images

Mini-screenshots de cómo se ve cada sección del template en cada nicho.
Se muestran arriba del input correspondiente en `/onboarding/info` y
`/onboarding/free` para que el cliente sepa qué está editando.

## Estructura

```
public/wizard-refs/
  barberia/
    hero.jpg
    benefits.jpg
    testimonials.jpg
    faq.jpg
  cafeteria/  …
  estetica/   …
  nails/      …
  remodelaciones/ …
  tattoo/     …
```

Total: 6 nichos × 4 sections = 24 archivos JPG, < 150 KB c/u, 800×600.

## Cómo se enchufan

`WizardRefImage` (`src/components/wizard/wizard-ref-image.tsx`) construye el
path `/wizard-refs/{niche}/{stepKey}.jpg`. Si la imagen no existe (404), no
renderiza nada — fallback silencioso. Las imágenes se pueden agregar o
regenerar de forma independiente.

| stepKey       | renderizado en          | sección del template |
|---------------|-------------------------|----------------------|
| `benefits`    | step-benefits           | whyChooseUs          |
| `testimonials`| step-testimonials       | testimonials carousel|
| `faq`         | step-faq                | FAQ accordion        |
| `hero`        | step-gallery            | hero background      |

## Regenerar

Las 24 capturas se generan automáticamente con:

```bash
npm run capture-wizard-refs
```

El script (`scripts/capture-wizard-refs.mjs`):

1. Spawn Vite dev server del master template (port 5183) — espera la ruta
   relativa `../Nichos/Barber-shop-template-main`.
2. Driver Playwright Chromium a viewport 1280×800.
3. Por cada nicho × sección, navega a la ruta dev-only del master template
   `/dev/wizard-refs-preview?niche=X&section=Y`, espera
   `body[data-wizard-ref-ready="1"]`, screenshot.
4. Redimensiona a 800×600 con sharp (cover, top-anchored), exporta JPG q80
   mozjpeg.
5. Tira el server al terminar.

**Requisitos**: `playwright` y `sharp` en devDeps + `npx playwright install
chromium` la primera vez.

## Master template — código que la ruta usa

- Ruta dev-only en `App.tsx`: `/dev/wizard-refs-preview` (gated by
  `import.meta.env.DEV`).
- Componente: `src/components/dev/WizardRefsPreview.tsx`.
- Helper: `switchSiteToNiche(niche, lang?)` en `src/config/site.ts` —
  rehace `siteConfig` con el preset del nicho indicado.

Los presets ya contienen datos placeholder realistas (logos, textos,
benefits, testimonials, FAQ por rubro), así que no se necesita mock data
adicional — la captura usa el preset directamente.
