# 3D Impact assets — upload workflow

Las imágenes 3D que usa el sistema `HeroObject3D` / `AmbientParticles` del
master template viven en Firebase Storage bajo paths organizados por
"sabor" (Velvet Muse / Aurea / Onyx) + shared. Esto permite que Liam pueda
elegir, desde el editor de cada cliente en Nichos-hub, qué imagen va a qué
slot, sin manejar URLs aleatorias o nombres tipo `5d57153a-193863.png`.

## Estructura en Storage

```
gs://barbertemplate-madre.firebasestorage.app/3d-assets/
  velvet-muse/
    hero-primary.png
    hero-secondary.png
    accent-bottle.png
    ambient-pearl.png
    deco-ribbon.png
    deco-silk-wave.png
    deco-pearls-cluster.png
    deco-marble-pedestal.png
  aurea/
    hero-primary.png         ← pending generate
    hero-secondary.png       ← pending generate
    accent-device.png
    deco-silk-wave-beige.png
    ambient-droplet.png
  onyx/
    hero-primary.png         ← pending generate
    hero-secondary.png       ← pending generate
    accent-bottle.png
    bg-stone-texture.png
    ambient-ink-droplets.png
  shared/
    ambient-smoke.png
    ambient-light-rays.png
```

20 slots totales. 16 con asset; 4 (hero-primary/secondary de Aurea y Onyx)
pendientes hasta que se generen los 3D correspondientes.

## Cómo correr

```bash
# Plan (dry-run, no escribe nada):
npm run upload-3d-assets

# Aplicar (sube a Storage):
npm run upload-3d-assets -- --apply

# Forzar re-upload (sobrescribe aunque el md5 coincida):
npm run upload-3d-assets -- --apply --force

# Cambiar el directorio fuente:
npm run upload-3d-assets -- --uploads-dir="C:\\ruta\\absoluta\\al\\folder"
```

El script (`scripts/upload-3d-assets.mjs`):

1. Lee credenciales de Firebase Admin desde `.env.local` (mismo patrón que
   `fix-client-configs.mjs`).
2. Para cada slot del mapping interno:
   - Si el archivo fuente no está mapeado → status `pending`.
   - Si el archivo no está en `uploads/` → status `missing-source` (warn,
     no falla).
   - Si ya existe en Storage con md5 idéntico → status `skipped-match`
     (idempotente; sin `--force` no re-sube).
   - Si hay diferencia → planifica upload (dry-run) o sube
     (`--apply`).
3. En upload escribe el archivo con `contentType: image/png` y
   `cacheControl: public, max-age=31536000`, y setea un
   `firebaseStorageDownloadTokens` para generar URL pública estilo
   `https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=...`
   (mismo formato que `api/onboarding/upload` y `api/upload/[clientId]`).

## Salida

Después de cada corrida (dry-run o apply) se generan:

- `outputs/3d-assets-manifest.json` — estado completo: status, source,
  storage path, public URL, size, timestamp.
- `outputs/3d-assets-manifest.md` — versión legible con tabla de URLs por
  categoría.

Estos archivos NO se commitean (son output runtime); sirven para que Liam
copy/paste URLs al editor 3D Impact del dashboard.

## Próximos pasos (opcional)

Idea para una siguiente iteración: flag `--assign-to=<clientId>` que,
además de subir, escriba las URLs directamente a
`config/{clientId}.heroObjects.<slot>.src` en Firestore. Hoy NO está
implementado — la asignación a clientes es decisión manual de Liam.
