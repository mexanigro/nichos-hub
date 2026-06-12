# Nos hacemos cargo de todo (PINNED)

**Formato:** video
**Idioma:** HE
**BG:** light
**Slot en grilla:** #3
**Pinned:** sí

## Copy por slide

### Frame 1
```
אנחנו דואגים
להכל.

✓ אחסון
✓ דומיין
```

### Frame 2
+ `✓ תחזוקה` `✓ עדכונים` (lista a 4)

### Frame 3
+ `✓ אבטחה` `✓ SEO + GMB` (lista a 6)

### Frame 4
+ `✓ גיבויים` `✓ ניטור` `✓ מהירות` (lista a 9)

### Frame 5
+ `✓ תמיכה` (lista completa a 10)
```
מנוי אחד מכסה את כל הצד הדיגיטלי של העסק.
@arzac.studio
```

## Composición

Layout idéntico en los 5 frames: titular arriba-derecha ("אנחנו דואגים" bold + "להכל." serif itálica), lista vertical alineada derecha con checkmarks terracota a la derecha de cada palabra (RTL). La lista crece frame a frame; espacio reservado visible. Frame 5 agrega línea de cierre con subrayado terracota en "מנוי אחד" + handle.

## Notas verificación

- Frame 1: ✅ 1er intento
- Frame 2: ✅ 1er intento
- Frame 3: ⚠ 2 intentos — 1er intento salió "להכל." espejado (mirror Hebrew); corregido con re-prompt
- Frame 4: ✅ 1er intento
- Frame 5: ✅ 1er intento

Nota: el espaciado de la lista varía levemente entre frames (compactación progresiva). Para el video conviene re-alinear las filas en Remotion usando posiciones fijas (la grilla de 10 filas del frame 5 como master).

## Remotion notes

- Frame 1 → 2 → 3 → 4: cada ítem nuevo entra con slide-in desde la derecha (RTL) + fade, 250ms por ítem, stagger 120ms. Checkmark se dibuja (stroke animation 200ms) después de que entra el texto.
- Frame 4 → 5: último ítem entra igual; pausa 400ms y la línea de cierre hace fade-up 500ms.
- Tick sonoro suave por checkmark (opcional), tono percusivo minimal.
- Duración total: ~8s. Loop limpio: hold 1.5s en frame final antes de cortar.
- Audio sugerido: minimal percusivo, un tick por check, sin voz.
