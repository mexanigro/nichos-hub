# SUMMARY — Pipeline Instagram arzac.studio (Fases C + D)

**Fecha:** 2026-06-11
**Estado:** ✅ COMPLETO — 45/45 imágenes generadas y verificadas

## Stats de generación

| Métrica | Valor |
|---|---|
| Imágenes totales | **45/45** (4 carruseles ×5 + 3 videos ×5 + 10 singles) |
| Pasaron al 1er intento | **40** (89%) |
| Necesitaron 2 intentos | **4** (03-frame-3, 08, 10, 12) |
| Necesitaron 3 intentos | **1** (07-frame-2) |
| Generaciones totales en ChatGPT | 50 (35 sesión 1 + 15 sesión 2) |
| NEEDS_REVIEW | **1** |

### NEEDS_REVIEW (revisar manualmente)

1. `social-content/instagram/07-video-whatsapp-demo/frame-2.png` — tras 3 intentos los horarios quedaron correctos (11:00 / 14:30 / 17:00) pero la conjunción hebrea "ו" antes de 17:00 quedó posiblemente omitida (se lee "14:30- 17:00" en vez de "ו-17:00"). Los frames 3-4 heredan la misma burbuja, así que la consistencia frame a frame del video está OK; si Liam lo aprueba, no hay que tocar nada.

### Retries por causa

- **Bidi/RTL (3):** items 08 y 10 salieron con una línea mixta hebreo+números en orden LTR; item 12 con checkmarks a la izquierda. Los tres se corrigieron al 2º intento pidiendo explícitamente el orden visual.
- **Mirror Hebrew (1):** 03-frame-3 ("להכל." espejado), corregido al 2º intento.
- **Números equivocados (1):** 07-frame-2, el caso NEEDS_REVIEW de arriba.

## Tiempo

| Sesión | Ventana | Trabajo |
|---|---|---|
| 1 (agente anterior) | ~15:19–16:46 | 33 imágenes (items 01-06 + 07 frames 1-3), 35 generaciones, pausa por límite ChatGPT Plus |
| 2 (esta) | 18:23–~19:40 | 12 imágenes (07 frames 4-5 + items 08-17), 15 generaciones, sin tocar el límite |
| **Total acumulado** | | **~2h 45m** de generación activa (+ pausa de 1h37m por rate limit) |

## Output en disco

```
social-content/instagram/
├── 01-pinned-renewal-90d/      5 slides + script.md
├── 02-pinned-services/         5 slides + script.md
├── 03-pinned-coverage/         5 frames + script.md (video Remotion)
├── 04-carousel-process/        5 slides + script.md
├── 05-carousel-manifesto/      5 slides + script.md
├── 06-video-showcase-barberia/ 5 frames + script.md (video Remotion)
├── 07-video-whatsapp-demo/     5 frames + script.md (video Remotion)
├── 08-single-pricing/          image.png + script.md
├── 09-single-tech-stack/       image.png + script.md
├── 10-single-faq-setup/        image.png + script.md
├── 11-single-founder-quote/    image.png + script.md
├── 12-single-no-lockin/        image.png + script.md
├── 13-single-nicho-barberia/   image.png + script.md
├── 14-single-nicho-estetica/   image.png + script.md
├── 15-single-nicho-tattoo/     image.png + script.md
├── 16-single-24-7/             image.png + script.md
├── 17-single-cta-demo/         image.png + script.md
├── GRID-PREVIEW.md             orden de publicación + mockup de grilla
└── SUMMARY.md                  este archivo
```

## Decisiones pendientes de Liam (heredadas del PLAN)

1. **07 frame 2** — aprobar o regenerar la burbuja con horarios (NEEDS_REVIEW).
2. **08 pricing** — ¿mencionar "החל מ-₪480" (plan Solo Web) o mantener solo Base/Pro? Hoy va solo Base/Pro según spec.
3. **14 estética** — se usó "חוזרות" (fem.) en lugar del "חוזרים" del sitio; verificar.
4. **01 slide 5** — "אתר שלא מזדקן." es construcción nueva (TODO HE del plan).
5. **07 frame 4** — microcopy del chip "✓ תור נקבע" es construcción nueva.
6. **12** — regenerar con testimonio real cuando exista.

## Próximos pasos

1. **Upscale:** las imágenes salen ~1122×1402 de ChatGPT; upscale 2x (Topaz/Real-ESRGAN) antes de publicar para nitidez máxima en hebreo chico.
2. **Videos Remotion:** armar los 3 Reels (items 03, 06, 07) con los 5 frames de cada uno — timing y transiciones especificados en la sección "Remotion notes" de cada `script.md`.
3. **Publicar:** seguir el orden de `GRID-PREVIEW.md` (17 → 04, después fijar 03 → 02 → 01).
4. **Captions + hashtags:** los `script.md` tienen el copy de cada post; falta redactar caption por post (no estaba en el scope de Fase C/D).
