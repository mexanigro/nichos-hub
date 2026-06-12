# El agente respondiendo en vivo (WhatsApp demo)

**Formato:** video
**Idioma:** HE
**BG:** dark
**Slot en grilla:** #7
**Pinned:** no
**Estado:** ✅ COMPLETO (frames 1-3 sesión 1, frames 4-5 sesión 2)

## Copy por slide

### Frame 1 ✅
```
Header: Arzac Studio · מחובר · תגובה אוטומטית · badge 24/7

היי! יש זמינות מחר לתספורת?
(timestamp 03:12)
```

### Frame 2 ⚠ NEEDS_REVIEW
```
בטח 👋 יש 11:00, 14:30 ו-17:00 מחר. מה מתאים?
```

### Frame 3 ✅
```
14:30 בבקשה. עם יוסי אם אפשר.
```

### Frame 4 ✅
```
הוזמן עם יוסי ב-14:30 ✓ אשלח תזכורת שעתיים לפני. עוד משהו?
```
+ chip "✓ תור נקבע" sobre el chat.

### Frame 5 ✅
```
3 בלילה, שבת, חגים —
התורים ממשיכים.
```
+ badge 24/7 + CTA `להתחיל בוואטסאפ ←` (chat de fondo atenuado/blur).

## Composición

Phone mockup dark centrado con UI de chat estilo WhatsApp dark mode. Header con nombre, status hebreo y badge 24/7 terracota. Burbujas: cliente gris a la izquierda, agente verde suave a la derecha con ✓✓. La conversación crece frame a frame, layout idéntico.

## Notas verificación

- Frame 1: ✅ 1er intento — header, burbuja y timestamp 03:12 exactos
- Frame 2: ❌ NEEDS_REVIEW — 3 intentos. Intento 1: "14:00" en vez de "11:00". Intento 2: "14:30, 14:30" duplicado. Intento 3 (guardado): horarios correctos 11:00/14:30/17:00 pero la conjunción "ו" antes de 17:00 quedó posiblemente omitida. Revisar manual.
- Frame 3: ✅ 1er intento — hereda la burbuja del frame 2 (consistente para animación)
- Frame 4: ✅ 1er intento — burbuja final verbatim ("הוזמן עם יוסי ב-14:30 ✓ אשלח תזכורת שעתיים לפני. עוד משהו?"), chip "✓ תור נקבע" con borde terracota visible sobre el header, burbujas 1-3 y header heredados pixel-consistentes (incluye la burbuja del frame 2 con su issue conocido de la conjunción "ו" — consistencia frame a frame OK).
- Frame 5: ✅ 1er intento — chat atenuado/blur de fondo, titular crema verbatim "3 בלילה, שבת, חגים — התורים ממשיכים.", badge 24/7 terracota, CTA pill "להתחיל בוואטסאפ ←" con flecha a la izquierda (RTL), logo y pills del template nítidos.

## Remotion notes

- Ritmo de chat real: burbuja cliente entra (slide-up 300ms) → pausa 600ms → typing dots 1.1s → burbuja agente entra 300ms → pausa 900ms. Igual al timing del componente AnimatedChat del sitio (700ms inicial, 1100ms typing, 900-1200ms entre mensajes).
- Frame 4 → 5: blur + dim del chat 500ms, titular fade-up 500ms.
- Duración total: ~10s.
- Audio sugerido: tono de notificación WhatsApp sutil por mensaje (2 veces máx).
