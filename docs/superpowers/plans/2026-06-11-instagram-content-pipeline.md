# Instagram Content Pipeline arzac.studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar 45 imágenes (4 carruseles + 3 videos + 10 singles = 17 slots de feed) listas para publicar en el Instagram de arzac.studio, con sistema visual consistente, verificación automática y entrega estructurada.

**Architecture:** Tres agentes Fable 5 secuenciales, cada uno una fase del pipeline. Entre fases, el orquestador (main loop) revisa el output y Liam aprueba. Image generation vía ChatGPT Plus en Chrome (Playwright MCP). Verificación visual hecha por el propio modelo Fable 5 leyendo las imágenes generadas.

**Tech Stack:**
- Orquestador: Claude main loop
- Workers: Claude Fable 5 (`model: "fable"`, `subagent_type: "general-purpose"`)
- Browser: Playwright MCP (`mcp__plugin_playwright_playwright__*`)
- Image gen: ChatGPT (cuenta Plus/Pro de Liam ya logueada en Chrome)
- Filesystem: Read / Write / Edit / Bash
- Spec de referencia: [docs/superpowers/specs/2026-06-11-instagram-content-pipeline-design.md](../specs/2026-06-11-instagram-content-pipeline-design.md)

---

## Task 0: Preparación (manual de Liam)

**Files:**
- Create: `social-content/instagram/_templates/light-ref.png`

- [ ] **Step 1: Liam guarda la imagen de referencia light en disco**

La imagen que mandaste en el chat (fondo crema con logo Å, tagline ARZAC STUDIO, pills Website · CRM · WhatsApp Agent) tiene que estar en disco antes de despachar el Agente 1. Guardala como:

```
C:\Users\liama\Desktop\Nichos-hub\social-content\instagram\_templates\light-ref.png
```

- [ ] **Step 2: Verificar que existe**

```powershell
Test-Path 'social-content\instagram\_templates\light-ref.png'
```

Expected: `True`

- [ ] **Step 3: Verificar que Chrome con ChatGPT está logueado**

Abrir Chrome manualmente, ir a `https://chat.openai.com`, confirmar que la sesión está activa con cuenta Plus/Pro. Cerrar Chrome (Playwright lo va a abrir limpio con perfil persistente o con sesión a iniciar).

> **Decisión a tomar acá:** ¿Playwright MCP usa tu perfil de Chrome existente (con sesión) o uno limpio (donde tendrías que loguearte cada vez)? Si pisa tu perfil real es más rápido pero invasivo. Si usa uno limpio, primer arranque de Fase B pausa para que te logues.

---

## Task 1: Despachar Agente 1 — Fase A (Análisis y guión)

**Files:**
- Lee: `src/components/landing/atelier-page.tsx`, `src/components/landing/*.tsx`, `src/lib/pricing.ts`, `src/lib/contracts.ts`
- Crea: `social-content/instagram/PLAN.md`

- [ ] **Step 1: Despachar Agent con el prompt completo**

Usar la tool `Agent` con:

```
subagent_type: "general-purpose"
model: "fable"
description: "IG Fase A: análisis y guión"
prompt: <ver bloque abajo>
```

Prompt:

```
Sos un agente Fable 5 que ejecuta la FASE A del pipeline de contenido Instagram para arzac.studio. Tu tarea: analizar el sitio y producir un PLAN.md detallado con los 17 guiones de publicación.

CONTEXTO DE LA MARCA
arzac.studio vende webs SaaS (landing + CRM + agente WhatsApp IA con voz) a PYMEs locales en Israel, en 6 nichos (barbería, estética, tattoo, nails, cafetería, remodelaciones). Modelo: 0 setup + 770 NIS/mes (960 NIS con voz). Owner: Liam Arzac.

SPEC COMPLETA
Lee el spec en `docs/superpowers/specs/2026-06-11-instagram-content-pipeline-design.md` ANTES de empezar. Es la fuente de verdad de qué hay que producir.

PASOS QUE TENÉS QUE EJECUTAR
1. Lee `src/components/landing/atelier-page.tsx` para tener el mapa de secciones.
2. Lee cada componente sección: Hero, Evergreen, Showcase, CrmSection, AgentSection, Everything, TechStack, Manifesto, Process, Pricing, Faq, FinalCta. Están en `src/components/landing/`.
3. Lee `src/lib/pricing.ts` para extraer el copy exacto de planes (Base 770 NIS / Pro 960 NIS).
4. Lee `src/lib/contracts.ts` para tono y promesas de servicio.
5. Refina los 17 guiones del inventario del spec (sección 2.2 y 2.3) con copy real, no genérico.

ESTRUCTURA DE CADA GUIÓN
Cada uno de los 17 items lleva:
- `id`: 01-17
- `pinned`: true/false (los 3 primeros son pinned)
- `title`: nombre corto
- `format`: single | carousel | video
- `language`: he | en
- `bg`: light | dark
- `feed_slot`: posición en grilla
- `hook_from_grid`: descripción del gancho visible desde la grilla SIN abrir el post (importante para los 3 fijados)
- `slides[]`: array de slides/frames/single (1 elemento para single, 5 para carousel/video)
  - Cada slide tiene:
    - `copy`: el texto exacto en HE o EN (cuidado con RTL en hebreo)
    - `composition`: descripción de QUÉ va en la imagen (no el cómo)
    - `mood`: energético | sobrio | playful | aspiracional
- `notes`: cualquier cosa especial (ej. para videos: ritmo de la animación)

PARA LOS 3 FIJADOS, MUY IMPORTANTE
- F1 "Renovación 90d": gancho visible desde grilla = badge grande "90D" o "GRATIS" + titular bold. Los 4 slides interiores muestran ejemplos antes/después (de 4 clientes ficticios o reales).
- F2 "Servicios": gancho = 3 íconos web + CRM + WhatsApp en formación clara. Slides interiores expanden cada servicio con 1 dato clave.
- F3 "Nos hacemos cargo": gancho = lista vertical con primeros items visibles ("Hosting", "Dominio", "Mantenimiento", "SEO", "..."). El video desarrolla la lista completa frame por frame.

OUTPUT
Guardá el resultado en `social-content/instagram/PLAN.md` con estructura markdown legible (no JSON crudo). Para cada uno de los 17 items, una sección clara con todos los campos arriba, copy en bloques de código para que se preserve el formato del hebreo.

Al final del PLAN.md, agregá una sección "## Métricas del plan" con:
- Total imgs a generar: 45
- Split idioma: X HE / Y EN
- Split bg: X light / Y dark
- Confirmación de que cuadra con el spec

QUE NO HAGAS
- NO abras Chrome.
- NO generes imágenes.
- NO inventes clientes reales de Arzac. Si no hay testimonios reales, usá copy genérico que no mienta ("Negocios que ya confían en nosotros" en vez de nombres falsos).
- NO escribas en hebreo si no estás seguro de la traducción — usá inglés y marcalo con `// TODO: traducir HE` para que Liam revise.

CUANDO TERMINES
Devolvé al main loop:
- Path absoluto del PLAN.md generado.
- Resumen de 5 líneas: qué encontraste de distintivo en arzac.studio que usaste para el guión.
- Cualquier ambigüedad que necesite decisión de Liam antes de Fase B.

NO ejecutes Fase B. Tu trabajo termina con PLAN.md guardado.
```

- [ ] **Step 2: Esperar a que termine el agente**

El agente devuelve un resumen al main loop. Tiempo estimado: 5-10 min.

- [ ] **Step 3: Liam revisa `PLAN.md`**

Abrir `social-content/instagram/PLAN.md`. Verificar:
- Los 17 guiones están.
- Copy se siente como vos, no genérico.
- Los 3 fijados tienen ganchos claros desde grilla.
- Hebreo tiene sentido (si dudás, comparalo con copy del sitio).
- Métricas cuadran (45 imgs, 12 HE / 5 EN, 9 light / 8 dark).

Si algo falla → editás manualmente el PLAN.md o le pedís al agente otra pasada con feedback específico.

- [ ] **Step 4: Commit del PLAN.md**

```powershell
git add social-content/instagram/PLAN.md
git commit -m "feat(social): IG content pipeline - Fase A plan (17 guiones, 45 imgs)"
```

---

## Task 2: Despachar Agente 2 — Fase B (Templates light + dark)

**Files:**
- Lee: `social-content/instagram/_templates/light-ref.png`
- Crea: `social-content/instagram/_templates/dark-ref.png`

- [ ] **Step 1: Despachar Agent con el prompt completo**

Usar la tool `Agent` con:

```
subagent_type: "general-purpose"
model: "fable"
description: "IG Fase B: template dark"
prompt: <ver bloque abajo>
```

Prompt:

```
Sos un agente Fable 5 que ejecuta la FASE B del pipeline Instagram arzac.studio. Tu tarea: usar ChatGPT (vía Playwright MCP en Chrome) para producir la versión DARK del template visual, espejo del template LIGHT que ya tenemos.

SPEC
Lee `docs/superpowers/specs/2026-06-11-instagram-content-pipeline-design.md` sección 3 (Sistema visual). Acá están los colores exactos de los dos backgrounds.

REFERENCIA LIGHT
Ya existe en disco: `social-content/instagram/_templates/light-ref.png`. Es un fondo crema (#F5EFE3) con:
- Logo Å terracota arriba-izquierda
- Lockup "ARZAC STUDIO · Digital structure for growing businesses"
- Pills footer: "Website · CRM · WhatsApp Agent"
- Líneas decorativas terracota suave en esquinas

QUÉ PRODUCIR
Una versión DARK del MISMO diseño:
- BG: #18120F (negro con tinte terracota)
- Logo Å: terracota (mismo #C66B3D)
- Lockup texto: crema #F5EFE3
- Pills texto: crema, divisor terracota
- Líneas decorativas: oro/terracota suave (mismo trazo, color que destaque en oscuro)
- Aspect ratio: 1080×1350 (4:5 vertical IG)
- Vacío en el área central (donde irá el copy de cada post)

PROCESO PASO A PASO
1. Verificar que Chrome MCP está disponible. Si no, fallar limpio y reportar al main loop.
2. `browser_navigate` a https://chat.openai.com
3. Verificar que estás logueada (selector del avatar de usuario o el botón "New chat" presente). Si no estás logueada, devolver al main loop con error "Login required" y parar.
4. `browser_click` en "New chat" para arrancar limpio.
5. Crear el primer mensaje:
   - Subir `light-ref.png` como adjunto (usar `browser_file_upload` con el input de imagen de ChatGPT).
   - Texto del mensaje:
     """
     This is my brand template (light version). I need you to design the DARK MIRROR version.

     Requirements:
     - Background: #18120F (deep brown-black)
     - Keep the EXACT same Å terracotta logo (#C66B3D) in the same position (top-left)
     - Keep the lockup "ARZAC STUDIO · Digital structure for growing businesses" in the same position, but in cream color (#F5EFE3)
     - Keep the footer pills "Website · WhatsApp Agent · CRM" with cream text and terracotta dividers
     - Keep the same decorative line patterns in the corners, but in soft gold/terracotta that pops on dark
     - Same aspect ratio: 1080×1350 (4:5 vertical)
     - Central area must stay EMPTY (this is a template — copy will be overlaid later)
     - Brand consistency is critical. Same typography, same proportions, same elegance.

     Generate the image.
     """
6. Esperar a que ChatGPT genere la imagen (puede tardar 30-90s). Usar `browser_wait_for` con texto que indique completado o polling con `browser_snapshot`.
7. Cuando termine, abrir la imagen full size y descargarla.
8. Guardarla en `social-content/instagram/_templates/dark-ref.png`.

VERIFICACIÓN (4 CHECKS)
Después de descargar, leer la imagen (capability multimodal tuya) y verificar:
1. BG es oscuro (no salió otro color por error).
2. Logo Å presente, terracota, arriba-izquierda.
3. Lockup tagline visible y legible en cream.
4. Pills footer visibles.
Si CUALQUIERA falla → en el mismo chat, mandar mensaje correctivo específico ("The logo isn't in the right position, please regenerate with the Å clearly in the top-left at 80px margin"). Hasta 3 intentos. Si después de 3 sigue mal → marcar el resultado como `needs-review`, guardar el mejor de los 3, y reportar al main loop.

CUANDO TERMINES
Devolvé al main loop:
- Path de `dark-ref.png`.
- Resultado de los 4 checks (pasó / falló / cuál intento).
- Si fue `needs-review`, decir explícitamente para que Liam decida.

NO sigas con Fase C. Tu trabajo termina acá.
```

- [ ] **Step 2: Esperar a que termine**

Tiempo estimado: 5-15 min (depende de retries).

- [ ] **Step 3: Liam revisa los dos templates lado a lado**

Abrir `social-content/instagram/_templates/light-ref.png` y `dark-ref.png`. Confirmar que son espejos del mismo sistema visual. Si el dark no convence → editás manualmente el prompt y volvés a correr el agente, o lo hacés vos manual.

- [ ] **Step 4: Commit de los templates**

```powershell
git add social-content/instagram/_templates/
git commit -m "feat(social): IG templates light + dark"
```

---

## Task 3: Despachar Agente 3 — Fases C + D (45 imgs + reports)

**Files:**
- Lee: `social-content/instagram/PLAN.md`, `social-content/instagram/_templates/*.png`
- Crea: `social-content/instagram/01-pinned-renewal-90d/` ... `17-single-cta-demo/` (17 carpetas con scripts + imgs)
- Crea: `social-content/instagram/GRID-PREVIEW.md`, `SUMMARY.md`

- [ ] **Step 1: Despachar Agent con el prompt completo**

Usar la tool `Agent` con:

```
subagent_type: "general-purpose"
model: "fable"
description: "IG Fases C+D: generar 45 imgs + reports"
prompt: <ver bloque abajo>
run_in_background: true
```

Razón de `run_in_background: true`: el agente puede tardar 2-4 horas (45 imgs + verificación + posibles pausas por límite Plus). Background permite que Liam siga con otras cosas mientras corre.

Prompt:

```
Sos un agente Fable 5 que ejecuta las FASES C + D del pipeline Instagram arzac.studio. Tu tarea: generar las 45 imágenes finales según el PLAN.md, verificar cada una, y entregar todos los reports.

INPUTS QUE YA EXISTEN
- `social-content/instagram/PLAN.md` — los 17 guiones detallados (LEELO PRIMERO Y COMPLETO).
- `social-content/instagram/_templates/light-ref.png` — template light de referencia.
- `social-content/instagram/_templates/dark-ref.png` — template dark de referencia.

SPEC
Lee `docs/superpowers/specs/2026-06-11-instagram-content-pipeline-design.md` secciones 4, 5, 6 (pipeline Fase C+D, verificación, output).

PROCESO

PARTE 1 — Generar 45 imágenes
Por cada uno de los 17 items en el PLAN.md, en orden:
1. Crear carpeta `social-content/instagram/{id}-{slug}/` (ej: `01-pinned-renewal-90d/`).
2. Para cada slide del item:
   a. Construir prompt para ChatGPT:
      - Adjuntar el template ref correspondiente (light o dark según el `bg` del item).
      - Especificar copy exacto (con cuidado especial al hebreo RTL — pedile a ChatGPT que respete el flow RTL).
      - Especificar composición (qué va dónde en el espacio central — el área del lockup logo + pills NO se toca).
      - Especificar mood (energético, sobrio, etc.).
   b. Enviar a ChatGPT en el chat actual. Si es la primera imagen de un chat nuevo, primero pegale un mensaje de contexto: "We're producing 45 IG images for arzac.studio. Use this template as the base for every image. Same Å logo position, same pills footer, same typography. Only the central area changes per post. Confirm." Esperar confirmación. Después mandás la primera imagen.
   c. Esperar resultado.
   d. Aplicar los 4 checks de verificación (sección 5 del spec):
      1. BG color coincide con la ref (light o dark).
      2. Logo Å en posición arriba-izquierda, terracota, no distorsionado.
      3. Tipografía consistente con la ref.
      4. Copy exacto sin typos.
   e. Si CUALQUIER check falla → re-prompt específico en el mismo chat: "The logo moved. Regenerate keeping the Å at exactly the position shown in the reference, top-left, 80px from edge." Hasta 3 intentos.
   f. Si los 3 intentos fallan → guardar el mejor intento, marcar el slide como `NEEDS_REVIEW` en una lista interna, seguir.
   g. Descargar la imagen a `social-content/instagram/{id}-{slug}/slide-N.png` (o `frame-N.png` para videos, `image.png` para singles).

3. Al terminar todas las slides del item, escribir `social-content/instagram/{id}-{slug}/script.md`:
   ```markdown
   # [Título]

   **Formato:** carousel | video | single
   **Idioma:** HE | EN
   **BG:** light | dark
   **Slot en grilla:** #N
   **Pinned:** sí/no

   ## Copy por slide

   ### Slide 1
   (copy exacto que se le pidió a ChatGPT)

   ### Slide 2
   ...

   ## Composición
   (descripción de qué va en cada slide)

   ## Notas verificación
   - Slide 1: ✅ pasó al 1er intento
   - Slide 2: ⚠ 2 intentos
   - Slide 3: ❌ NEEDS_REVIEW — guardado mejor intento, revisar manual
   ...

   ## Remotion notes (SOLO si es video)
   - Frame 1 → 2: fade, 400ms
   - Frame 2 → 3: slide up, 600ms
   - Frame 3 → 4: ...
   - Frame 4 → 5: ...
   - Duración total sugerida: 7s
   - Audio sugerido: descripción de tono/ritmo
   ```

PARTE 2 — Manejo del límite ChatGPT Plus
- Contar imágenes generadas en la ventana de 3h actual.
- Cuando llegues a 35 (cerca del límite ~40/3h), guardar el estado actual (qué items completaste, en qué slide vas) en `social-content/instagram/_state.json`. Pausar.
- Devolver al main loop con mensaje: "Pausa por límite ChatGPT. Estado guardado. Retomable a las HH:MM (3h desde el inicio de esta ventana). Despachar nuevo agente con flag `--resume` en ese horario."
- Si el límite Plus se manifiesta antes (ChatGPT muestra error de rate limit), capturar la hora exacta de retomada que muestra ChatGPT y reportar eso.

PARTE 3 — Manejo de chats que se vuelven largos
- Si un chat supera 50 mensajes o muestra warning de contexto largo de ChatGPT → abrir nuevo chat.
- Al arrancar chat nuevo, mandar mensaje de contexto re-cargando la ref correspondiente:
  "We're producing IG images for arzac.studio. Attached is the template (light/dark). Use this exactly as the base. Same logo, same pills, same typography. Only central area changes. Confirm."
- Esperar confirmación, después seguir.

PARTE 4 — Reports finales (DESPUÉS de las 45 imgs)
Cuando hayas terminado todo:

1. `social-content/instagram/GRID-PREVIEW.md`:
   - Orden recomendado de publicación (cronología, de más nuevo a más viejo así los 3 fijados quedan arriba del todo).
   - Mockup ASCII del perfil mostrando cómo queda la grilla:
     ```
     ┌─────┬─────┬─────┐
     │ F1  │ F2  │ F3  │  ← fila top, fijados
     │renew│serv │care │
     ├─────┼─────┼─────┤
     │ 17  │ 16  │ 15  │  ← orden de publicación: más reciente arriba-izq
     ├─────┼─────┼─────┤
     ...
     ```
   - Notas sobre cuáles fijar (los 3 primeros) y por qué.

2. `social-content/instagram/SUMMARY.md`:
   - Total imágenes generadas: X/45
   - Pasaron al 1er intento: X
   - Necesitaron 2-3 intentos: X
   - `NEEDS_REVIEW` (a revisar manual): X
   - Tiempo total
   - Posts que requieren atención de Liam (lista con paths)
   - Próximos pasos para Liam (upscale, Remotion, publicar)

CUANDO TERMINES (o pauses por límite)
Devolvé al main loop:
- Total imgs generadas hasta ahora.
- Total `NEEDS_REVIEW`.
- Path raíz `social-content/instagram/`.
- Si pausaste: hora exacta para retomar.
- Si terminaste: "DONE — listo para Liam".

REGLAS CRÍTICAS
- NUNCA hacés más que lo que dice este prompt. Si encontrás un edge case raro, parás y pedís decisión.
- NUNCA inventás clientes reales o testimonios. Si el copy lo necesita, usá lenguaje genérico verdadero.
- NUNCA cambiás el sistema visual (logo, pills, lockup) "para mejorarlo". El template es ley.
- Si el hebreo te genera dudas, marcalo como `NEEDS_REVIEW` con nota explícita.
- Logging: por cada batch de 5 imgs, mandá un `log()` al main loop con progreso (no más frecuente, no menos).
```

- [ ] **Step 2: Mientras corre en background, Liam recibe progreso**

El main loop recibe `log()` cada 5 imgs. Tiempo estimado total: 2-4 horas activas, más pausas si pega el límite Plus.

- [ ] **Step 3: Cuando termina, Liam revisa `SUMMARY.md`**

Abrir `social-content/instagram/SUMMARY.md`. Verificar:
- Cuántas pasaron al 1er intento (idealmente >70%).
- Cuántas quedaron en `NEEDS_REVIEW` (idealmente <15%).
- Tiempo total razonable.

- [ ] **Step 4: Liam revisa los `NEEDS_REVIEW` uno por uno**

Por cada item marcado `NEEDS_REVIEW`:
- Abrir la carpeta correspondiente.
- Mirar el "mejor intento" guardado.
- Decidir: aceptar / re-prompt manual / rehacer desde cero.

- [ ] **Step 5: Liam abre `GRID-PREVIEW.md`**

Verificar que el orden recomendado tiene sentido visual antes de empezar a publicar.

- [ ] **Step 6: Commit del set completo**

```powershell
git add social-content/instagram/
git commit -m "feat(social): IG 45 assets generados + reports"
```

---

## Task 4: Post-entrega (manual de Liam)

- [ ] **Step 1: Upscale de las 45 imágenes**

Pasar todas las imgs por tu upscaler de elección. Guardar las versiones HD en cada carpeta como `slide-N-hd.png` (o `frame-N-hd.png` / `image-hd.png`).

- [ ] **Step 2: Si quedó tiempo y querés más assets**

Devolverle al agente las versiones HD por si quiere componer algo más (ej. carruseles compuestos, animaciones extra para los videos). Esto NO está en el scope original — es opcional.

- [ ] **Step 3: Armar los 3 videos en Remotion**

Por cada carpeta de video (`03-pinned-coverage/`, `06-...`, `07-...`):
- Abrir `script.md`, sección "Remotion notes".
- Crear el render Remotion con los 5 frames y las transiciones indicadas.

- [ ] **Step 4: Publicar en Instagram**

Seguir el orden de `GRID-PREVIEW.md`. Fijar los 3 primeros desde la app.

---

## Self-Review

**Spec coverage:** Cada sección del spec tiene tasks que la implementan:
- Sec 1 (objetivo) → cubierto por todo el plan.
- Sec 2 (inventario) → Task 1 produce el PLAN.md con los 17 guiones.
- Sec 3 (sistema visual) → Task 0 + Task 2 (templates light + dark).
- Sec 4 (pipeline) → Tasks 1, 2, 3 (los tres agentes).
- Sec 5 (verificación) → Embebido en los prompts de Task 2 y Task 3.
- Sec 6 (output) → Task 3 produce la estructura completa.
- Sec 7 (tech) → Tech Stack del header del plan.
- Sec 8 (riesgos) → Mitigaciones embebidas en los prompts (límite Plus, RTL, chats largos).
- Sec 9 (éxito) → Verificado en Task 3 Step 3.
- Sec 10 (post) → Task 4.

**Placeholder scan:** Sin TBDs, TODOs ni "fill in details". Cada prompt es ejecutable tal cual.

**Type consistency:** Los nombres son consistentes a lo largo del plan: `light-ref.png` / `dark-ref.png` / `PLAN.md` / `SUMMARY.md` / `GRID-PREVIEW.md` / `_state.json` aparecen siempre con el mismo nombre. Los IDs de items (01-17), los formatos (single/carousel/video), los idiomas (he/en), los bgs (light/dark) son consistentes.

**Spec gap detectado y arreglado:** El spec menciona que Playwright MCP es la opción primera. Task 0 Step 3 ahora pregunta explícitamente cómo manejar la sesión de Chrome (perfil persistente vs login nuevo) — esto era ambiguo y lo dejo como decisión del orquestador.
