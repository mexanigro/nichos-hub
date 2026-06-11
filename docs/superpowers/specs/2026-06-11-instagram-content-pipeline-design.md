# Instagram Content Pipeline arzac.studio — Design

**Fecha:** 2026-06-11
**Owner:** Liam Arzac
**Objetivo:** generar 45 imágenes (en 17 slots de feed) listas para publicar en el Instagram de arzac.studio, con un sistema visual coherente y verificación automática de consistencia.

---

## 1. Objetivo y alcance

Producir contenido inicial completo para el perfil de Instagram de Arzac Studio que:

- Comunique los tres servicios (Website + CRM + WhatsApp Agent con voz).
- Convierta a PYMEs locales en Israel (público primario hebreo).
- Tenga una grilla con identidad visual reconocible a primera vista.
- Permita extender el grid con videos (Remotion) que vos armás después.

**Fuera de alcance**

- Publicar en Instagram (vos lo subís manual cuando recibís los assets).
- Programar las publicaciones / scheduling.
- Crear los videos finales en Remotion (el agente entrega los frames + script; el render es tuyo).
- Generar contenido para otras redes (TikTok, LinkedIn, etc.).
- Upscaling de imágenes (lo hacés vos antes de pasar a video).

---

## 2. Inventario de contenido

### 2.1 Composición total

| Formato | Cantidad | Imgs por unidad | Total imgs | Slots de feed |
|---|---|---|---|---|
| Carrusel | 4 | 5 slides | 20 | 4 |
| Video (Remotion) | 3 | 5 frames | 15 | 3 |
| Single post | 10 | 1 | 10 | 10 |
| **Total** | **17** | — | **45** | **17** |

### 2.2 Fila top — 3 fijados

| # | Tema | Formato | Idioma | BG | Hook visible desde grilla |
|---|---|---|---|---|---|
| F1 | Cada 90 días renovamos tu web gratis | Carrusel 5 slides | HE | Light | Slide 1 con titular bold y badge "90D" grande |
| F2 | Web + CRM + Agente WhatsApp con voz | Carrusel 5 slides | HE | Light | Slide 1 con los 3 íconos de servicio + tagline |
| F3 | Nos hacemos cargo de todo | Video 5 frames | HE | Light | Frame 1 con lista que se construye dinámicamente |

**Regla:** los 3 fijados van todos en bg light para consistencia visual de la fila superior cuando alguien entra al perfil.

### 2.3 Resto del feed (14 slots)

Borradores temáticos (el agente refina al leer arzac.studio):

| # | Tema sugerido | Formato | Idioma | BG |
|---|---|---|---|---|
| 04 | Nuestro proceso (de mensaje a sitio en X días) | Carrusel | HE | Dark |
| 05 | Manifesto / por qué Arzac existe | Carrusel | EN | Dark |
| 06 | Case study: cliente real antes/después | Video | HE | Light |
| 07 | Demo del agente WhatsApp respondiendo | Video | HE | Dark |
| 08 | Pricing claro (770 / 960 NIS) | Single | HE | Light |
| 09 | Tech stack que usamos | Single | EN | Dark |
| 10 | FAQ: "¿no me cobran setup?" | Single | HE | Light |
| 11 | Founder quote | Single | EN | Dark |
| 12 | Social proof (testimonio) | Single | HE | Light |
| 13 | Nicho: barbería | Single | HE | Dark |
| 14 | Nicho: estética | Single | HE | Light |
| 15 | Nicho: tattoo | Single | HE | Dark |
| 16 | "Tu web habla por vos 24/7" | Single | EN | Light |
| 17 | CTA final: agendá demo | Single | HE | Dark |

Split idioma final: 12 HE / 5 EN.
Split bg final: 9 light / 8 dark (intercalado para evitar bloques visuales monótonos).

---

## 3. Sistema visual

### 3.1 Templates base

| Elemento | Light | Dark |
|---|---|---|
| BG color | `#F5EFE3` (crema, igual al ref) | `#18120F` (negro tinte terracota) |
| Líneas decorativas | Terracota suave `#C66B3D` 30% opacidad | Oro/terracota suave `#C66B3D` 40% opacidad |
| Logo Å | Terracota `#C66B3D`, arriba-izquierda | Terracota (mismo color) |
| Tagline lockup | "ARZAC STUDIO · Digital structure for growing businesses" — gris oscuro | Mismo lockup — crema `#F5EFE3` |
| Pills footer | "Website · WhatsApp Agent · CRM" — texto gris oscuro, divisor terracota | Mismos pills — texto crema |
| Tipografía | Mismo type system del sitio (sans serif moderna) | Mismo |
| Aspect ratio | 4:5 (1080×1350) para feed, 1:1 (1080×1080) opcional | Mismo |

**Decisión de formato:** 4:5 vertical en todo el feed. Aprovecha máximo el espacio en mobile y es el formato recomendado actual de IG.

### 3.2 Zonas de seguridad

- Margen externo: 80px en todos los lados (1080×1350).
- Lockup logo + tagline siempre arriba-izquierda, no se mueve entre posts.
- Pills servicios siempre abajo, no se mueven.
- El "área de contenido" es el rectángulo central — ahí va el copy + visual del post.

### 3.3 Templates a producir antes de todo

```
social-content/instagram/_templates/
  light-template.png   (vacío, listo para sobreponer copy)
  dark-template.png    (mismo, versión dark)
  light-ref.png        (el que mandaste, para usar como ref en prompts)
  dark-ref.png         (resultado de pedirle a ChatGPT la versión dark)
```

---

## 4. Pipeline del agente

El pipeline se ejecuta como **3 agentes Fable 5 secuenciales** (no un solo agente largo). Cada uno es despachado vía la tool `Agent` con `model: "fable"` y `subagent_type: "general-purpose"`. La razón: los subagentes no pueden pausar para pedir OK al usuario a mitad de tarea; tienen que terminar y devolver al main loop. Por eso cortamos en las pausas naturales del flujo.

- **Agente 1** ejecuta Fase A → devuelve `PLAN.md`. Liam revisa.
- **Agente 2** ejecuta Fase B → devuelve los 2 templates. Liam revisa.
- **Agente 3** ejecuta Fases C + D → devuelve los 45 assets + reports.

### Fase A — Análisis y guión (sin browser)

1. Lee `src/components/landing/atelier-page.tsx` y todos los componentes secciones (Hero, Evergreen, Showcase, CRM, Agent, Everything, TechStack, Manifesto, Process, Pricing, FAQ, FinalCta).
2. Lee `src/lib/pricing.ts` y `src/lib/contracts.ts` para el copy exacto de planes.
3. Refina los 17 guiones del inventario (sección 2.3) con copy real en HE/EN.
4. Cada guion incluye:
   - `title`
   - `format` (`single` | `carousel` | `video`)
   - `language` (`he` | `en`)
   - `bg` (`light` | `dark`)
   - `slides[]` — para cada slide/frame/single:
     - `copy_he` o `copy_en`
     - `composition` (descripción de qué va en la imagen)
     - `mood` (energético / sobrio / playful)
5. Guarda el plan en `social-content/instagram/PLAN.md`.
6. **Termina** y devuelve al main loop el path del PLAN con un resumen de 5 líneas. Liam decide si avanza a Fase B (dispara Agente 2).

### Fase B — Templates (Chrome + ChatGPT)

7. Abre Chrome con Playwright MCP, navega a `chat.openai.com`.
8. Verifica que estás logueada (Plus/Pro).
9. Crea nuevo chat. Sube `light-ref.png` como referencia.
10. Pide a ChatGPT (en inglés, prompt detallado) la versión dark espejo del template, especificando los colores exactos de la tabla 3.1.
11. Loop de verificación: comparar el resultado contra los 4 checks (sección 5). Si falla → re-prompt hasta 3 intentos.
12. Descarga el resultado a `social-content/instagram/_templates/dark-ref.png`.
13. **Termina** y devuelve al main loop ambos paths con check visual de consistencia. Liam decide si avanza a Fase C (dispara Agente 3).

### Fase C — Generación 45 imágenes

14. Para cada uno de los 17 items del plan:
    - Para cada slide/frame/single dentro del item:
      - Generar prompt detallado con: ref del template correspondiente (light o dark), copy exacto, posicionamiento, mood.
      - Enviar a ChatGPT.
      - Esperar resultado.
      - Aplicar 4 checks de verificación.
      - Si falla → re-prompt hasta 3 intentos.
      - Si pasa los 3 intentos sin pasar → marcar como `needs-review`, guardar el mejor intento y seguir.
      - Descargar a la carpeta correspondiente.
15. Manejo de límites ChatGPT Plus (~40 imgs / 3 horas):
    - Contar imágenes generadas en la ventana.
    - Cuando se acerque al límite (35+), guardar estado y pausar.
    - Notificarte con timestamp de retomada.
    - Al retomar, abrir nuevo chat con contexto resumido del template.
16. Si un chat se vuelve muy largo (>50 mensajes) → abrir nuevo chat con resumen del estilo.

### Fase D — Entrega y stop

17. Genera `GRID-PREVIEW.md` con:
    - Orden de publicación recomendado (cronología).
    - Mockup ASCII del perfil mostrando cómo queda la grilla.
    - Notas sobre cuáles fijar (los 3 primeros).
18. Genera `SUMMARY.md` con:
    - Total generadas / falladas / `needs-review`.
    - Tiempo total y costos aproximados.
    - Notas para vos por post si hace falta intervención manual.
19. Emite mensaje final al thread principal con:
    - "Listo. X/45 imágenes generadas. Y marcadas para revisión. Path: `social-content/instagram/`. Para los videos te dejé los scripts Remotion en cada carpeta."
20. **STOP definitivo.** No intenta nada más.

---

## 5. Loop de verificación

Cada imagen pasa 4 checks antes de aprobarse:

1. **BG correcto** — color de fondo coincide con `light-ref.png` o `dark-ref.png` (tolerancia ±10 en RGB).
2. **Logo en posición** — Å terracota arriba-izquierda, lockup con tagline, no movido ni distorsionado.
3. **Tipografía consistente** — misma fuente del template, peso correcto, no fuente sustituta.
4. **Copy correcto** — texto exacto del script, sin typos, sin caracteres extra/faltantes (especial cuidado con hebreo RTL).

**Implementación de los checks:** el agente compara visualmente leyendo la imagen generada (capability nativa del modelo). No usamos OCR externo. Si está dudoso → re-prompt.

**Política de fallos:**
- 3 intentos por imagen. Después se marca `needs-review` y continúa.
- Si más del 30% de un batch (≥3 en 10) falla → pausa y te notifica que algo está mal con el prompt template, no solo casos individuales.

---

## 6. Output

### 6.1 Estructura de carpetas

```
social-content/
  instagram/
    PLAN.md                            (Fase A — guión completo)
    GRID-PREVIEW.md                    (Fase D — orden + mockup)
    SUMMARY.md                         (Fase D — resumen ejecutivo)
    _templates/
      light-ref.png                    (el que mandaste)
      dark-ref.png                     (generado en Fase B)
    01-pinned-renewal-90d/
      slide-1.png
      slide-2.png
      slide-3.png
      slide-4.png
      slide-5.png
      script.md                        (copy HE, posicionamiento, notas)
    02-pinned-services/
      ...
    03-pinned-coverage/
      frame-1.png ... frame-5.png
      script.md                        (incluye sección "Remotion notes")
    04-carousel-process/
      ...
    ...
    17-single-cta-demo/
      image.png
      script.md
```

### 6.2 Formato del `script.md` por carpeta

```markdown
# [Título]

**Formato:** carousel | video | single
**Idioma:** HE | EN
**BG:** light | dark
**Slot en grilla:** #N

## Copy

(El texto exacto que va en cada slide/frame/single.)

## Composición

(Qué va dónde en cada imagen.)

## Remotion notes (solo si es video)

- Frame 1 → Frame 2: fade, 400ms
- Frame 2 → Frame 3: slide up, 600ms
- ...
- Audio sugerido: tono X
- Duración total: 7s
```

---

## 7. Tecnologías

- **Orquestador**: Claude Fable 5 (subagent_type elegido al despacho).
- **Browser**: Playwright MCP (`mcp__plugin_playwright_playwright__*`) — más confiable que computer-use para webapps. Se usa por defecto; computer-use queda como fallback solo si Playwright no puede.
- **Image gen**: ChatGPT (DALL-E / GPT-Image vía interfaz web) — cuenta Plus/Pro tuya, ya logueada.
- **Verificación**: el propio modelo Fable 5 inspecciona las imágenes generadas (capability multimodal).
- **Filesystem**: tools `Read`, `Write`, `Edit`, `Bash` para guardar archivos y reportes.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| ChatGPT cambia su UI y rompe el browser flow | Playwright MCP usa selectores accesibles, no posiciones de píxeles. Si rompe, agente reporta y para. |
| Límite Plus se agota a mitad | Estado guardado por imagen. Retomada con resumen del template en chat nuevo. |
| Hebreo RTL se renderiza mal en ChatGPT | Verificación visual del copy en cada check. Si recurrente → marca el batch entero `needs-review`. |
| Templates dark no sale consistente con light | Loop de 3 intentos en Fase B con prompt cada vez más específico. Si 3 fallan → STOP y te pide intervención manual con el ref. |
| Generaciones inconsistentes entre chats | Cada chat nuevo arranca con un "system prompt" que adjunta el template ref y los códigos hex exactos. |
| Costos de tokens del agente Fable 5 | Análisis (Fase A) en una sola pasada de lectura. Verificación visual usa input multimodal pero no genera tokens largos. Estimado <300k tokens output total. |

---

## 9. Criterios de éxito

- [x] 45 imágenes en estructura de carpetas correcta.
- [x] Cada post con su `script.md`.
- [x] `PLAN.md`, `GRID-PREVIEW.md`, `SUMMARY.md` generados.
- [x] ≥85% de imágenes pasan los 4 checks sin intervención manual.
- [x] Los 3 fijados tienen hooks claramente visibles desde grilla.
- [x] Mockup ASCII del perfil entregado para que validés el flow visual.
- [x] El agente para limpio con mensaje final. No intenta acciones extra.

---

## 10. Lo que hacés vos después

1. Revisás el `PLAN.md` antes de Fase B.
2. Revisás los 2 templates antes de Fase C.
3. Cuando llega el `SUMMARY.md`:
   - Abrís los `needs-review` (si los hay), decidís rehacer manual o aceptar.
   - Pasás las 45 imágenes por tu upscaler.
   - Para los videos, abrís el `script.md` con notas Remotion y armás el render.
4. Subís a Instagram en el orden de `GRID-PREVIEW.md`, fijás los 3 primeros.
