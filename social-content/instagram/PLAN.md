# PLAN — Instagram arzac.studio (Fase A)

**Fecha:** 2026-06-11
**Fuente de verdad:** `docs/superpowers/specs/2026-06-11-instagram-content-pipeline-design.md`
**Copy extraído de:** `src/lib/i18n/locales/he.ts`, `src/lib/i18n/locales/en.ts`, `src/lib/pricing.ts`, `src/lib/contracts.ts`, componentes en `src/components/landing/`.

**Regla de copy:** todo el hebreo marcado "verbatim del sitio" está copiado letra por letra de `he.ts` — ya está en producción y es seguro. Las construcciones nuevas en hebreo están marcadas `// TODO HE` para revisión de Liam. El hebreo es RTL: en todas las composiciones el texto hebreo se alinea a la DERECHA y fluye derecha→izquierda; números y palabras latinas (CRM, AI, SEO) quedan embebidos LTR dentro del flujo RTL.

**Sistema visual (ref sección 3 del spec):** light `#F5EFE3` / dark `#18120F`, acento terracota `#C66B3D`, logo Å arriba-izquierda con lockup "ARZAC STUDIO · Digital structure for growing businesses", pills "Website · WhatsApp Agent · CRM" abajo. 4:5 (1080×1350). Margen 80px.

---

## 01 — F1 · Renovación 90 días (PINNED)

- **id:** 01
- **pinned:** true
- **title:** Renovación 90d gratis
- **format:** carousel (5 slides)
- **language:** he
- **bg:** light
- **feed_slot:** fila 1, posición 1 (arriba-derecha en grilla RTL de IG... IG ordena LTR: posición 1 = primera celda)
- **hook_from_grid:** Badge circular terracota gigante "90D" + sello "חינם" (gratis) cruzado en diagonal + titular bold de 2 líneas. Legible a tamaño thumbnail sin abrir el post.

### Slide 1 — Hook
- **copy** (verbatim del sitio, sección Evergreen):
  ```
  אתרים מזדקנים.
  שלך לא.
  ```
  + badge: `90D` + sello: `חינם`
- **composition:** Titular enorme (2 líneas, serif/bold del type system) centrado-derecha. Badge circular "90D" en terracota sólido, tamaño ~1/4 del canvas, solapando el titular. Sello "חינם" en outline terracota rotado -8°. Líneas decorativas terracota 30%.
- **mood:** energético

### Slide 2 — El problema
- **copy** (verbatim, evergreen.body recortado):
  ```
  תסתכלו על כל אתר מלפני 3 שנים.
  הוא נראה מתקופה אחרת.
  ```
- **composition:** Concepto antes/después SIN clientes inventados: dos wireframes abstractos de browser lado a lado — izquierda un layout anticuado (gris, desaturado, tipografía vieja, etiqueta "2023"), derecha un layout limpio moderno con acento terracota (etiqueta "היום" — "hoy"). Texto arriba alineado a la derecha.
- **mood:** sobrio

### Slide 3 — La solución
- **copy** (verbatim, evergreen.body):
  ```
  כל 90 יום אתם יכולים לקבל
  עיצוב מחדש מלא של האתר.
  בלי עלות נוספת. כלול בכל מסלול.
  ```
- **composition:** Contador grande "90" con unidad "יום" (réplica del contador de la sección Evergreen del sitio: número enorme + unidad pequeña al lado). Texto debajo, alineado derecha. Mucho aire.
- **mood:** aspiracional

### Slide 4 — Las 3 garantías
- **copy** (verbatim, evergreen.points, los 3 completos):
  ```
  חינם — העיצוב מחדש כלול בכל מסלול. בלי אותיות קטנות.

  בקצב שלך — אם האתר מוצא חן בעיניך, תשאיר אותו. רוצה משהו חדש? יש לך.

  ללא הגבלה — כל עוד אתה לקוח, האפשרות חוזרת כל רבעון. תמיד.
  ```
- **composition:** Lista vertical de 3 bloques k/v como en el sitio: keyword en terracota bold a la derecha, descripción en gris debajo. Divisores finos terracota 30% entre bloques.
- **mood:** sobrio

### Slide 5 — CTA
- **copy:**
  ```
  אתר שלא מזדקן. // TODO HE — construcción nueva ("un sitio que no envejece"), verificar
  ```
  + CTA (verbatim hero.cta):
  ```
  להתחיל בוואטסאפ ←
  ```
- **composition:** Titular corto centrado + botón pill oscuro con texto crema y flecha (RTL: flecha apunta a la IZQUIERDA). Handle @arzac.studio pequeño debajo. Logo y pills del template en su lugar fijo.
- **mood:** energético

---

## 02 — F2 · Web + CRM + Agente WhatsApp (PINNED)

- **id:** 02
- **pinned:** true
- **title:** Los 3 servicios
- **format:** carousel (5 slides)
- **language:** he
- **bg:** light
- **feed_slot:** fila 1, posición 2
- **hook_from_grid:** 3 íconos grandes en línea (browser / dashboard / burbuja WhatsApp) unidos por una línea terracota, con el titular del hero debajo. Desde la grilla se leen los 3 íconos aunque no se lea el texto.

### Slide 1 — Hook
- **copy** (verbatim, hero h1 completo):
  ```
  אתר מקצועי, CRM
  וסוכן וואטסאפ AI
  לעסק שלך.
  ```
- **composition:** Fila de 3 íconos line-art (ventana de browser, grilla de dashboard, burbuja de chat con rayo) en terracota, grandes, parte superior del área de contenido. Titular de 3 líneas debajo, alineado derecha. Un "+" terracota entre ícono e ícono.
- **mood:** energético

### Slide 2 — Servicio 1: la web
- **copy** (verbatim, process.title + everything.whyPoints.mobile):
  ```
  אתר מקצועי

  מהפנייה הראשונה לאתר חי,
  מקסימום 72 שעות.
  ```
  + dato clave (verbatim, everything.items.speed):
  ```
  טעינה תוך פחות משנייה.
  ```
- **composition:** Ícono browser arriba-derecha. "01/03" pequeño en terracota. Mockup minimal de un browser (chrome con 3 puntos, como el componente Showcase del sitio) con bloque hero abstracto adentro. Dato clave como caption abajo.
- **mood:** sobrio

### Slide 3 — Servicio 2: el CRM
- **copy** (verbatim, crm.title + bullet):
  ```
  זה לא רק CRM.
  זה CRM עם אינטליגנציה.
  ```
  + dato clave (verbatim, crm.bullets):
  ```
  תזכורות אוטומטיות למניעת no-shows
  ```
- **composition:** "02/03". Mockup minimal de dashboard (cards: תורים / לידים חדשים / הכנסה היום — labels verbatim de crm.dashboard) en line-art con acentos terracota. Titular a la derecha.
- **mood:** sobrio

### Slide 4 — Servicio 3: el agente
- **copy** (verbatim, agent.title + sub recortado):
  ```
  סוכן AI שמכיר את העסק
  שלך כמוך.
  ```
  + dato clave (verbatim, agent.sub):
  ```
  חמש שפות, אפס הפסקות.
  ```
  + badge: `24/7`
- **composition:** "03/03". Burbuja de chat estilo WhatsApp con doble tick ✓✓ y badge 24/7 (réplica del header del phone mockup del sitio). Titular derecha, dato como caption.
- **mood:** energético

### Slide 5 — CTA
- **copy** (verbatim, pricing.title + setupValue):
  ```
  הכל כלול, אפס הקמה.

  הקמה: ₪0
  ```
  + CTA (verbatim):
  ```
  להתחיל בוואטסאפ ←
  ```
- **composition:** Los 3 íconos del slide 1 repetidos en miniatura arriba como recap. "₪0" gigante en terracota como elemento central. Botón pill CTA abajo.
- **mood:** energético

---

## 03 — F3 · Nos hacemos cargo de todo (PINNED)

- **id:** 03
- **pinned:** true
- **title:** Nos hacemos cargo de todo
- **format:** video (5 frames, Remotion)
- **language:** he
- **bg:** light
- **feed_slot:** fila 1, posición 3
- **hook_from_grid:** Frame 1 (cover) muestra el titular + los 2 primeros ítems de una lista vertical con checkmarks terracota que claramente "sigue" — invita a dar play para ver la lista completarse.

Los 10 ítems son verbatim de everything.items (sección "אנחנו דואגים להכל" del sitio): אחסון · דומיין · תחזוקה · עדכונים · אבטחה · SEO + GMB · גיבויים · ניטור · מהירות · תמיכה

### Frame 1 — Cover + arranque de lista
- **copy** (verbatim, everything.title):
  ```
  אנחנו דואגים
  להכל.
  ```
  + ítems 1-2:
  ```
  ✓ אחסון
  ✓ דומיין
  ```
- **composition:** Titular arriba-derecha (palabra "להכל." en serif itálica como en el sitio). Lista vertical alineada derecha, checkmarks terracota a la derecha de cada palabra (RTL). Espacio vacío evidente debajo de la lista — se va a llenar.
- **mood:** energético

### Frame 2 — Ítems 3-4
- **copy:** se agregan:
  ```
  ✓ תחזוקה
  ✓ עדכונים
  ```
- **composition:** Misma composición exacta, lista crece a 4 ítems. Nada más se mueve (consistencia frame a frame es lo que da el efecto stop-motion).
- **mood:** energético

### Frame 3 — Ítems 5-6
- **copy:** se agregan:
  ```
  ✓ אבטחה
  ✓ SEO + GMB
  ```
- **composition:** Lista a 6 ítems. Idéntico layout.
- **mood:** energético

### Frame 4 — Ítems 7-9
- **copy:** se agregan:
  ```
  ✓ גיבויים
  ✓ ניטור
  ✓ מהירות
  ```
- **composition:** Lista a 9 ítems. Tipografía de la lista se compacta levemente para que entre todo (planificado desde frame 1: la grilla de la lista ya reserva 10 filas).
- **mood:** energético

### Frame 5 — Ítem 10 + cierre
- **copy:** se agrega:
  ```
  ✓ תמיכה
  ```
  + cierre (verbatim, everything.sub):
  ```
  מנוי אחד מכסה את כל הצד הדיגיטלי של העסק.
  ```
- **composition:** Lista completa de 10 con todos los checks en terracota. Línea de cierre debajo en gris + handle @arzac.studio. Sutil subrayado terracota en "מנוי אחד".
- **mood:** aspiracional

### notes (Remotion)
- Frame 1 → 2 → 3 → 4: cada ítem nuevo entra con slide-in desde la derecha (RTL) + fade, 250ms por ítem, stagger 120ms. Checkmark "se dibuja" (stroke animation 200ms) después de que entra el texto.
- Frame 4 → 5: último ítem entra igual; luego pausa 400ms y la línea de cierre hace fade-up 500ms.
- Tick sonoro suave por checkmark (opcional), tono percusivo minimal.
- Duración total: ~8s. Loop limpio: hold 1.5s en frame final antes de cortar.

---

## 04 — Proceso: 72 horas

- **id:** 04
- **pinned:** false
- **title:** De mensaje a sitio en 72h
- **format:** carousel (5 slides)
- **language:** he
- **bg:** dark
- **feed_slot:** fila 2, posición 4
- **hook_from_grid:** "72" gigante en crema sobre fondo oscuro con "שעות" en terracota — número legible desde la grilla.

### Slide 1 — Hook
- **copy** (verbatim, process.title):
  ```
  מהפנייה הראשונה לאתר חי,
  מקסימום 72 שעות.
  ```
- **composition:** "72" en cuerpo gigante crema, "שעות" en terracota debajo. Titular completo arriba-derecha en cuerpo chico. Timeline punteada horizontal abajo con 4 nodos (preview de los 4 pasos: /01 /02 /03 /04).
- **mood:** energético

### Slide 2 — Paso 1 (verbatim, process.steps[0])
- **copy:**
  ```
  /01 — פנייה

  15 דקות בוואטסאפ או הודעה. ממפים שירותים,
  שעות, מותג, מה מייחד אותך.

  שעה 0
  ```
- **composition:** Número de paso "/01" enorme en terracota outline (como los stp-num del sitio). Nombre del paso bold, descripción gris claro, timestamp "שעה 0" como chip con borde terracota. Timeline abajo con nodo 1 encendido.
- **mood:** sobrio

### Slide 3 — Paso 2 (verbatim, process.steps[1])
- **copy:**
  ```
  /02 — בנייה

  מקימים את האתר, ה-CRM וסוכן הוואטסאפ.
  מותאם לנישה.

  שעה 1 – 24
  ```
- **composition:** Idéntica a slide 2, nodo 2 encendido.
- **mood:** sobrio

### Slide 4 — Paso 3 (verbatim, process.steps[2])
- **copy:**
  ```
  /03 — בדיקה

  אתה רואה בלינק פרטי. מתאימים יחד
  טקסטים, תמונות, שירותים.

  שעה 24 – 36
  ```
- **composition:** Idéntica, nodo 3 encendido.
- **mood:** sobrio

### Slide 5 — Paso 4 + CTA (verbatim, process.steps[3])
- **copy:**
  ```
  /04 — חי

  מצביעים על הדומיין, מסנכרנים Google Business.
  מתחיל לקבל תורים.

  שעה 48
  ```
  + CTA (verbatim):
  ```
  להתחיל בוואטסאפ ←
  ```
- **composition:** Nodo 4 encendido, timeline completa en terracota. Botón pill CTA crema sobre fondo oscuro.
- **mood:** energético

---

## 05 — Manifesto

- **id:** 05
- **pinned:** false
- **title:** Branding is a gift
- **format:** carousel (5 slides)
- **language:** en
- **bg:** dark
- **feed_slot:** fila 2, posición 5
- **hook_from_grid:** Frase serif gigante "Branding is a gift." en crema sobre dark — post tipográfico puro, contrasta con los vecinos.

### Slide 1 — Hook
- **copy** (verbatim, en.manifesto.h):
  ```
  Branding is a gift.
  The site is our craft.
  ```
- **composition:** Solo tipografía. "Branding is a gift." en serif grande crema, "The site is our craft." en itálica terracota debajo. Línea decorativa fina. Nada más.
- **mood:** aspiracional

### Slide 2 — El problema del cliente
- **copy** (verbatim, en.manifesto.body recortado):
  ```
  No logo, colors or photos?
  Don't worry.
  ```
- **composition:** Pregunta grande arriba, "Don't worry." en terracota como respuesta. Tres placeholders tachados (cuadro de logo vacío, swatch de color vacío, marco de foto vacío) en line-art gris.
- **mood:** playful

### Slide 3 — Cómo funciona
- **copy** (verbatim, en.manifesto.points, los 4):
  ```
  Branding — If you have it, we use it. If not, it's on us.
  Content — Yours. If you have nothing, we write it.
  Business info — Tell us what you do. That's enough.
  Delivery — 24 to 72 hours, live and online.
  ```
- **composition:** Lista k/v de 4 filas: keyword crema bold a la izquierda, valor gris. Divisores terracota 40%.
- **mood:** sobrio

### Slide 4 — Por qué importa
- **copy** (verbatim, en.everything.whyBody, primera frase):
  ```
  A DIY site decorates.
  A site built by a designer
  and a marketing strategist sells.
  ```
- **composition:** "decorates." en gris apagado, "sells." en terracota — el contraste tipográfico ES el mensaje. Alineado izquierda, mucho aire.
- **mood:** sobrio

### Slide 5 — CTA
- **copy** (verbatim, en.final):
  ```
  Run your business.
  We'll run the digital.
  ```
  + CTA (verbatim, en.hero.cta):
  ```
  Talk on WhatsApp →
  ```
- **composition:** Las dos líneas del final-cta del sitio (segunda en itálica serif). Botón pill crema. Handle @arzac.studio.
- **mood:** energético

---

## 06 — Showcase tour: barbería

- **id:** 06
- **pinned:** false
- **title:** Tour de un sitio real (Onyx & Steel)
- **format:** video (5 frames, Remotion)
- **language:** he
- **bg:** light
- **feed_slot:** fila 2, posición 6
- **hook_from_grid:** Mockup de teléfono con el hero de Onyx & Steel (sitio showcase real del portfolio, visible en arzac.studio) + titular. Es la única celda de la fila con una "foto" de producto — atrae el ojo.

> **Nota honestidad:** Onyx & Steel es un sitio showcase REAL del portfolio público de arzac.studio (aparece en la sección "עבודות חיות" del sitio). NO se presenta como cliente pago ni se inventan métricas. El video es un tour del sitio, no un caso de éxito con números.

### Frame 1 — Cover
- **copy** (verbatim, showcase.title):
  ```
  תראה איך נראים
  האתרים שלנו.
  ```
  + tag (verbatim showcase data): `מספרה · Onyx & Steel`
- **composition:** Phone mockup (con island, como el hero del sitio) mostrando el hero de Onyx & Steel (asset existente: `/landing/hero-onyx-steel-vertical.png`). Titular a la derecha del phone. Tag de nicho como chip.
- **mood:** aspiracional

### Frame 2 — La página
- **copy** (verbatim, showcase.why recortado):
  ```
  עיצוב שמנחה. טקסט שמשכנע.
  וכפתור שלוחצים עליו.
  ```
- **composition:** El phone scrollea a la sección de servicios del sitio showcase. Caption a la derecha.
- **mood:** sobrio

### Frame 3 — La reserva
- **copy** (verbatim, crm.bullets):
  ```
  מערכת קביעת תורים אונליין,
  מסונכרנת ל-Google
  ```
- **composition:** Phone muestra el flujo de reserva (calendario/horarios). Flecha terracota dibujada a mano señalando el botón de reserva.
- **mood:** energético

### Frame 4 — Detrás: el CRM
- **copy** (construcción simple):
  ```
  וכל תור נכנס ישר ל-CRM. // TODO HE — "y cada turno entra directo al CRM", verificar
  ```
- **composition:** Split: phone con el sitio a la derecha, browser con el dashboard CRM a la izquierda (mockup line-art con cards תורים/לידים, no screenshot real del CRM de un cliente). Línea terracota conectando ambos.
- **mood:** sobrio

### Frame 5 — CTA
- **copy** (verbatim, hero h1 recortado + cta):
  ```
  אתר מקצועי לעסק שלך.

  להתחיל בוואטסאפ ←
  ```
- **composition:** Phone centrado con el hero de Onyx & Steel, botón pill CTA debajo. Handle.
- **mood:** energético

### notes (Remotion)
- Frame 1 → 2: scroll vertical simulado dentro del phone, 800ms ease-out. El frame exterior NO se mueve.
- Frame 2 → 3: otro scroll + la flecha terracota se dibuja (stroke 400ms).
- Frame 3 → 4: el browser CRM entra con slide desde la izquierda 600ms; línea conectora se dibuja 400ms.
- Frame 4 → 5: fade cruzado 400ms, phone se centra con scale 1.05→1.
- Duración total: ~9s. Audio: lo-fi suave, sin voz.

---

## 07 — Demo del agente WhatsApp

- **id:** 07
- **pinned:** false
- **title:** El agente respondiendo en vivo
- **format:** video (5 frames, Remotion)
- **language:** he
- **bg:** dark
- **feed_slot:** fila 3, posición 7
- **hook_from_grid:** Interfaz de chat WhatsApp (header "Arzac Studio · 24/7") sobre fondo dark con la primera burbuja visible — se entiende "demo de chat" al instante.

El diálogo completo es verbatim de agent.chat en he.ts (es el demo animado que corre en el sitio):

### Frame 1 — Mensaje del cliente
- **copy** (verbatim):
  ```
  היי! יש זמינות מחר לתספורת?
  ```
  + timestamp `03:12` + header: `Arzac Studio · מחובר · תגובה אוטומטית` (verbatim chatStatus) + badge `24/7`
- **composition:** Phone mockup dark con UI de chat estilo WhatsApp. Burbuja del cliente (gris) a la izquierda. Timestamp 03:12 bien visible — el detalle de que son las 3 AM es el gancho.
- **mood:** playful

### Frame 2 — El agente responde
- **copy** (verbatim):
  ```
  בטח 👋 יש 11:00, 14:30 ו-17:00 מחר. מה מתאים?
  ```
- **composition:** Burbuja del agente (verde WhatsApp suave/terracota adaptado al template) a la derecha, con ✓✓. Indicador "typing" (3 puntos) visible arriba de la burbuja en transición.
- **mood:** playful

### Frame 3 — Cliente elige
- **copy** (verbatim):
  ```
  14:30 בבקשה. עם יוסי אם אפשר.
  ```
- **composition:** Tercera burbuja, conversación crece hacia arriba como chat real.
- **mood:** playful

### Frame 4 — Reserva confirmada
- **copy** (verbatim):
  ```
  הוזמן עם יוסי ב-14:30 ✓ אשלח תזכורת שעתיים לפני. עוד משהו?
  ```
- **composition:** Burbuja final del agente. Chip "✓ תור נקבע" (turno agendado // TODO HE — verificar microcopy del chip) aparece sobre el chat como confirmación de calendario.
- **mood:** energético

### Frame 5 — Cierre
- **copy** (verbatim, agent.reasons[0]):
  ```
  3 בלילה, שבת, חגים —
  התורים ממשיכים.
  ```
  + badge `24/7` + CTA (verbatim): `להתחיל בוואטסאפ ←`
- **composition:** El chat queda de fondo desenfocado/atenuado; titular grande crema encima con "24/7" en terracota. CTA pill.
- **mood:** energético

### notes (Remotion)
- Ritmo de chat real: burbuja cliente entra (slide-up 300ms) → pausa 600ms → typing dots 1.1s → burbuja agente entra 300ms → pausa 900ms. Igual al timing del componente AnimatedChat del sitio (700ms inicial, 1100ms typing, 900-1200ms entre mensajes).
- Frame 4 → 5: blur + dim del chat 500ms, titular fade-up 500ms.
- Duración total: ~10s.
- Audio sugerido: tono de notificación WhatsApp sutil por mensaje (2 veces máx, no spamear).

---

## 08 — Pricing claro

- **id:** 08
- **pinned:** false
- **title:** Pricing transparente
- **format:** single
- **language:** he
- **bg:** light
- **feed_slot:** fila 3, posición 8
- **hook_from_grid:** "₪770" y "₪960" grandes + "הקמה ₪0" en terracota. Números legibles desde la grilla.

### Slide única
- **copy** (verbatim, pricing.title / plans / setupLabel / redesignHighlight):
  ```
  כמה עולה אתר לעסק?
  הכל כלול, אפס הקמה.

  Base — ₪770/חודש
  אתר + CRM + סוכן וואטסאפ AI

  Pro — ₪960/חודש
  הכל מ-Base + שיחות קוליות AI

  הקמה: ₪0
  עיצוב מחדש לאתר כל 90 יום — בחינם
  ```
- **composition:** Dos cards de plan lado a lado (réplica minimal de las cards del sitio: tag, nombre, precio con ₪ chico y número grande, una línea de descripción). Card Pro con borde terracota (es la highlighted en el sitio). Banda inferior: "הקמה: ₪0" + línea de renovación 90d con subrayado terracota. Footer pills del template.
- **mood:** sobrio

> **Nota:** el sitio tiene 4 planes (Solo Web ₪480 / Base ₪770 / Pro ₪960 / Enterprise ₪1,270). El spec pide enfocar 770/960. Decisión pendiente de Liam: ¿mencionar "החל מ-₪480" (desde ₪480, como hace el hero del sitio) o mantener solo Base/Pro?

---

## 09 — Tech stack

- **id:** 09
- **pinned:** false
- **title:** Tech stack
- **format:** single
- **language:** en
- **bg:** dark
- **feed_slot:** fila 3, posición 9
- **hook_from_grid:** Grilla de logos tech reconocibles (Google, WhatsApp, OpenAI, Claude...) sobre dark — lenguaje visual "infra seria".

### Slide única
- **copy** (verbatim, en.techStack):
  ```
  Tools that power your business.
  ```
  + nombres bajo cada logo:
  ```
  Google · Calendar · Sheets · Gemini · OpenAI · Claude ·
  Meta · WhatsApp · Vercel · Firebase · Twilio · ElevenLabs
  ```
- **composition:** Titular arriba-izquierda ("power your business." en itálica terracota). Grilla 4×3 de los 12 logos en monocromo crema con label pequeño debajo de cada uno (los mismos 12 del marquee de la sección TechStack del sitio). Espaciado uniforme, sin marcos.
- **mood:** sobrio

---

## 10 — FAQ: ¿cero setup?

- **id:** 10
- **pinned:** false
- **title:** FAQ — ₪0 de instalación
- **format:** single
- **language:** he
- **bg:** light
- **feed_slot:** fila 4, posición 10
- **hook_from_grid:** "₪0" gigante en terracota — el número más grande de toda la grilla.

### Slide única
- **copy** (basado verbatim en el FAQ "כמה עולה לבנות אתר לעסק קטן?"):
  ```
  ₪0 הקמה

  בשוק הישראלי, אתר תדמית עולה בדרך כלל
  3,000–12,000 ₪ בהקמה.

  אצלנו המודל הפוך: אפס דמי הקמה,
  והכל כלול במנוי חודשי אחד.
  ```
- **composition:** "₪0" ocupa ~40% del canvas en terracota. Comparación debajo: "3,000–12,000 ₪" tachado con línea terracota vs "₪0" — formato pregunta/respuesta estilo FAQ del sitio (el "+" del accordion como elemento gráfico arriba-derecha).
- **mood:** energético

---

## 11 — Founder quote

- **id:** 11
- **pinned:** false
- **title:** Quote de Liam
- **format:** single
- **language:** en
- **bg:** dark
- **feed_slot:** fila 4, posición 11
- **hook_from_grid:** Comillas serif gigantes terracota + texto — formato quote clásico, rompe el ritmo de la grilla.

### Slide única
- **copy** (verbatim, en.founder.body):
  ```
  "When you message us, you talk to me.
  When the site goes live, I'm the one
  who pressed publish."

  Liam Arzac — Founder, Arzac Studio
  ```
- **composition:** Comillas de apertura serif enormes en terracota 40%. Quote en serif crema, 3 líneas. Atribución en sans pequeña con divisor terracota. SIN foto (la sección Founder del sitio está oculta hasta tener foto real — no inventar retrato).
- **mood:** aspiracional

---

## 12 — Promesa sin lock-in (reemplaza "social proof")

- **id:** 12
- **pinned:** false
- **title:** Sin ataduras — la data es tuya
- **format:** single
- **language:** he
- **bg:** light
- **feed_slot:** fila 4, posición 12
- **hook_from_grid:** Candado abierto line-art terracota + titular corto bold.

> **Nota:** el spec sugería "testimonio", pero NO existen testimonios reales de clientes de Arzac todavía. En lugar de inventar, este post usa la promesa verificable más fuerte del sitio: cancelás cuando querés y te llevás todo. Decisión pendiente de Liam: cuando haya un testimonio real, este slot puede regenerarse.

### Slide única
- **copy** (verbatim, pricing.sub + FAQ "מה קורה אם אני מבטל?"):
  ```
  מבטלים בכל חודש.
  הדאטה הולכת איתך.

  אתה יוצא עם הדומיין, מסד הלקוחות
  מיוצא, והיסטוריית התורים.
  בלי קנס, בלי נעילות.
  ```
- **composition:** Candado ABIERTO en line-art terracota como ícono central. Titular de 2 líneas arriba-derecha. Lista de 3 ítems con checks (דומיין / מסד לקוחות / היסטוריית תורים). "בלי קנס, בלי נעילות." como sello final en bold.
- **mood:** sobrio

---

## 13 — Nicho: barbería

- **id:** 13
- **pinned:** false
- **title:** Para barberías
- **format:** single
- **language:** he
- **bg:** dark
- **feed_slot:** fila 5, posición 13
- **hook_from_grid:** Tijera/navaja line-art terracota + "מספרה" grande — el primer post de la mini-serie de nichos, estética unificada entre 13/14/15.

### Slide única
- **copy** (label verbatim de pago.niches + agent.reasons[0] verbatim):
  ```
  מספרה

  3 בלילה, שבת, חגים —
  התורים ממשיכים.
  ```
  + caption (verbatim, crm.bullets):
  ```
  תזכורות אוטומטיות למניעת no-shows
  ```
- **composition:** Serie de nichos: layout idéntico entre 13/14/15 — ícono del nicho line-art grande arriba (tijera de barbero), nombre del nicho como label chip terracota, frase fuerte al centro, caption con un beneficio concreto abajo. Sobre dark.
- **mood:** energético

---

## 14 — Nicho: estética

- **id:** 14
- **pinned:** false
- **title:** Para clínicas de estética
- **format:** single
- **language:** he
- **bg:** light
- **feed_slot:** fila 5, posición 14
- **hook_from_grid:** Ícono de loto/gota line-art + "קוסמטיקה" — segunda celda de la serie de nichos, versión light.

### Slide única
- **copy** (label verbatim de pago.niches + crm.bullets verbatim):
  ```
  קוסמטיקה

  מעקב חכם — יודע אילו
  לקוחות לא חוזרות. // TODO HE — el bullet original dice "חוזרים" (masc.); para estética en femenino verificar "חוזרות"
  ```
  + caption (verbatim, crm.bullets):
  ```
  שיווק אוטומטי שמתאים את עצמו לתחום שלך
  ```
- **composition:** Mismo layout de serie que 13, en light: ícono loto line-art terracota, chip "קוסמטיקה", frase central, caption.
- **mood:** aspiracional

---

## 15 — Nicho: tattoo

- **id:** 15
- **pinned:** false
- **title:** Para estudios de tattoo
- **format:** single
- **language:** he
- **bg:** dark
- **feed_slot:** fila 5, posición 15
- **hook_from_grid:** Máquina de tatuar line-art + "סטודיו קעקועים" — cierra la fila completa de nichos (dark/light/dark).

### Slide única
- **copy** (label verbatim de pago.niches + faq languages verbatim recortado):
  ```
  סטודיו קעקועים

  הסוכן עונה בערבית, עברית,
  אנגלית, רוסית וספרדית.
  ```
  + caption (verbatim, crm.bullets):
  ```
  וואטסאפ, טופס ו-walk-in בתיבה אחת
  ```
- **composition:** Mismo layout de serie: máquina de tatuar line-art, chip "סטודיו קעקועים", frase central (ángulo: clientela internacional de TLV → 5 idiomas), caption.
- **mood:** energético

---

## 16 — Tu negocio responde 24/7

- **id:** 16
- **pinned:** false
- **title:** Two AI employees
- **format:** single
- **language:** en
- **bg:** light
- **feed_slot:** fila 6, posición 16
- **hook_from_grid:** "24/7" tipográfico gigante con la barra "/" en terracota.

### Slide única
- **copy** (verbatim, en.hero.sub recortado + en.agent.why recortado):
  ```
  Two AI employees that know
  your business and never sleep.

  60% of WhatsApp messages and 40% of calls
  to local businesses go unanswered after hours.
  Yours won't be.
  ```
  (última línea "Yours won't be." es construcción nueva — eco del "Yours won't." de Evergreen)
- **composition:** "24/7" enorme como elemento gráfico central, "/" en terracota. Titular arriba-izquierda. El dato 60%/40% como stat block abajo con los números en bold terracota.
- **mood:** energético

---

## 17 — CTA final

- **id:** 17
- **pinned:** false
- **title:** Agendá tu demo
- **format:** single
- **language:** he
- **bg:** dark
- **feed_slot:** fila 6, posición 17
- **hook_from_grid:** Flecha "←" serif gigante terracota (el ornament del final-cta del sitio, espejado RTL) + dos líneas bold. Cierre claro de la grilla.

### Slide única
- **copy** (verbatim, final completo):
  ```
  תתעסק בעסק שלך.
  אנחנו נתעסק בדיגיטל.

  לדבר עם ליאם בוואטסאפ ←

  ההודעה שלך היא בעדיפות, אני מחכה לך.
  ```
- **composition:** Réplica del bloque FinalCta del sitio: flecha ornamental serif arriba, titular de 2 líneas (segunda en itálica serif terracota), botón pill crema con el CTA, nota personal en cuerpo chico debajo. Handle @arzac.studio + wa.me corto.
- **mood:** aspiracional

---

## Métricas del plan

| Métrica | Valor | Check vs spec |
|---|---|---|
| Total slots de feed | 17 | ✓ (4 carruseles + 3 videos + 10 singles) |
| Total imgs a generar | **45** | ✓ (4×5 + 3×5 + 10×1 = 20+15+10) |
| Split idioma | **13 HE / 4 EN** | ⚠ ver nota abajo |
| Split bg | **9 light / 8 dark** | ✓ (light: 01,02,03,06,08,10,12,14,16 · dark: 04,05,07,09,11,13,15,17) |
| Pinned | 3 (ids 01-03), todos light | ✓ |
| Formatos | carousel: 01,02,04,05 · video: 03,06,07 · single: 08–17 | ✓ |

**⚠ Nota split idioma:** el spec dice "12 HE / 5 EN" en el resumen de la sección 2.3, pero su propia tabla asigna HE a 13 items (F1-F3, 04, 06, 07, 08, 10, 12, 13, 14, 15, 17) y EN a 4 (05, 09, 11, 16) = 13/4. Este plan sigue la **tabla** (asignación por item), que es la fuente más específica. Si Liam prefiere 12/5, el candidato natural a pasar a EN es el 12 (lock-in promise) o el 13 (barbería).

**Confirmación:** el plan cuadra con el spec en total de imágenes (45), estructura de slots (17), formatos, fila pinned all-light, y alternancia light/dark. Única divergencia: split de idioma (arriba) y el reenfoque del item 12 (sin testimonios inventados, según regla del propio pipeline).
