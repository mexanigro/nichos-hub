# Brief de producción — videos 3D del erizo (Arzac Studio)

> Para generar **con Liam presente** (requiere su login en ChatGPT / Google Flow
> y revisión creativa antes de ir a producción, ya que arzac.studio auto-deploya
> a main). El Chrome MCP ya está conectado (Browser 1). Este doc deja todo listo
> para producir y enchufar los assets sin improvisar.

## Por qué no se generó en el loop autónomo
Generar video con IA usa la sesión logueada de Liam, tarda minutos por render y
necesita criterio subjetivo (que se vea "vivo", no un video pegado). Pushear video
AI sin revisión a la web live no corresponde estando Liam ausente. El efecto
**scroll-anchored ya quedó resuelto en código** con el asset aprobado (commit
ed55e24): el erizo del hero deriva + se desvanece con el scroll. Estos videos son
el "nivel premium" opcional encima de eso.

## Paleta / estilo (mantener coherencia con la mascota actual)
Erizo plush de lana terracota, panza cream, "A" bordada. Fondo de generación cream
`#ece7df`; **se le quita el fondo** (transparente) para los assets web. Cálido,
artesanal, movimiento sutil y calmo (no hiperactivo).

---

## Asset 1 — Video loop "criatura viva" (hero), sin scroll
Objetivo: que el erizo del hero se sienta vivo (respira, parpadea, micro-movimiento)
como un asset 3D real, en loop perfecto.

- **Requisito clave:** el primer y el último frame deben ser **idénticos** (loop
  seamless, sin corte visible). Duración 4–6 s, ~30 fps.
- **Formato web:** WebM VP9 **con alpha** (`-pix_fmt yuva420p`) + fallback MOV
  HEVC con alpha para Safari. Sin audio. `loop muted playsinline autoplay`.
- **Encuadre:** mismo pose base que `04-curled-A` (acurrucado, mirando al frente,
  "A" en la panza). Acción: respiración + 1–2 parpadeos + micro-tilt de cabeza.
- **Tamaño:** render cuadrado ~1000×1000, export 2x; en web se muestra ~188px
  desktop / ~104px mobile (igual que el estático actual).
- **Prompt ChatGPT (keyframe inicial=final):** "Plush yarn hedgehog, terracotta
  wool spines, cream belly with an embroidered letter A, curled and peeking
  forward, soft studio lighting, cream background #ece7df, centered, high detail."
- **Flow (animación):** "subtle idle: gentle breathing, one slow blink, tiny head
  tilt, returns to the exact starting pose; seamless loop; no camera move."
- **Integración:** nuevo `<MascotVideo variant="hero">` que renderiza `<video>` y,
  bajo `prefers-reduced-motion` o si el video no carga, cae al PNG actual
  (`04-curled-A.png`). Reusa el posicionamiento `.at-mascot--hero` (RTL/ FAB ya
  resueltos). Mantener `scrollParallax` (el video reemplaza solo la imagen).

## Asset 2 — Video anclado al scroll (scroll-scrub)
Objetivo: un "guion" de 3 poses que avanza con el scroll (efecto Apple-style:
el video no se reproduce solo, se **scrubbea** según el progreso de scroll).

- **3 keyframes (storyboard):** (1) erizo acurrucado/durmiendo → (2) despierta y
  se asoma (pose `04`) → (3) saluda/levanta una patita, contento. Generar los 3 en
  ChatGPT con el mismo estilo/encuadre, fondo cream.
- **Video:** generar en Flow una transición suave 1→2→3 (~3–4 s, 30 fps). NO loop
  (es lineal). Export MP4 H.264 (no necesita alpha si va en un contenedor con
  fondo de sección) o WebM alpha si va flotando.
- **Integración (scrub):** componente `<MascotScrollVideo>` con un `<video>` (o
  un `<canvas>` con frames pre-extraídos para scrub fino). En scroll, mapear el
  progreso de la sección contenedora → `video.currentTime = progress * duration`
  (pausado, nunca `play()`). Usar `IntersectionObserver` para activar solo en
  viewport y `requestAnimationFrame` para el set. Bajo `prefers-reduced-motion`:
  mostrar el keyframe (3) estático.
- **Dónde:** candidato fuerte = transición Hero→Evergreen (el doc lo marca ⭐), o
  como guía del stepper de Process (#how). Decidir con Liam para no chocar con los
  mascots estáticos existentes (hero/evergreen/manifesto/final).

## Pipeline operativo (Chrome MCP, con Liam)
1. ChatGPT (logueado) → generar los keyframes (prompts de arriba). Descargar PNG.
2. Figma → `Design` → pegar todas las imágenes → seleccionar todas → **mejorar
   resolución** → cuando terminan, con todas seleccionadas → **remover fondo** →
   exportar una por una en **2x** (abajo a la derecha).
3. Google Flow (logueado) → generar los videos (loop seamless para Asset 1;
   transición lineal para Asset 2). Ajustar en editor si hace falta que el
   primer=último frame coincidan exactamente (Asset 1).
4. Guardar en `public/mascot/hedgehog/video/` (`hero-idle.webm/.mov`,
   `scroll-story.mp4`/frames).
5. Enchufar con los componentes descritos + verificar (desktop/mobile, RTL,
   reduced-motion, peso/LCP) antes de push.

## Constraints técnicos (no negociables)
- `prefers-reduced-motion` → frame estático (innegociable).
- LCP del hero: el `<video>` del hero debe ser liviano y diferido (poster = PNG
  actual, `preload="none"` hasta post-LCP). Nunca degradar el LCP.
- RTL: espejar como el estático (scaleX(-1) ya aplicado en `.at-mascot-img`;
  para video, espejar el contenedor).
- FAB WhatsApp (bottom-right físico) sin colisión — ya cubierto por el
  posicionamiento actual de los mascots.
- Peso: WebM alpha del hero idealmente < 500 KB; video scroll < 1–1.5 MB.
