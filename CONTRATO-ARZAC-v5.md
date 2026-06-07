# Contrato de Servicios — Arzac Studio v5.0
## Sistema de 3 Tiers de Suscripcion

> **Nota para Liam**: Este documento es la version legible del contrato que los clientes firman antes de pagar. El contrato vive en `src/lib/contracts.ts` y se muestra en el flujo de pago. Esta version es para tu revision antes de ponerlo en produccion.

---

## ACUERDO DE SERVICIOS — SITIO WEB, CRM Y AGENTES IA

**Arzac Studio — Suscripcion de 3 Niveles**

Entre: Arzac Studio (en adelante: "el Proveedor")
Y: El Cliente (en adelante: "el Cliente")

Considerando que el Proveedor ha desarrollado una infraestructura tecnologica que incluye hosting de sitios web (SaaS), un sistema CRM, un agente de WhatsApp impulsado por IA, llamadas de voz con IA y herramientas con inteligencia artificial, mantenimiento y almacenamiento (el "Sistema de Plantilla Maestra");

Y considerando que el Cliente desea suscribirse al Servicio para visibilidad en internet, digitalizacion y gestion operativa de su negocio;

**LAS PARTES ACUERDAN LO SIGUIENTE:**

---

### 1. Planes de Servicio

El Proveedor ofrece tres niveles de suscripcion. **Todos los planes incluyen cero costo de setup.**

#### 1.1. Plan Base — ₪770/mes

| Incluye | Detalle |
|---------|---------|
| Sitio web | Personalizado usando el Sistema de Plantilla Maestra |
| Visibilidad online | Presencia en internet, dominio + renovacion anual |
| Micro-CRM + IA | Panel de gestion, asistente virtual IA, email marketing automatizado |
| Agente WhatsApp IA | Bot automatizado 24/7 — responde mensajes, gestiona reservas/cancelaciones |
| Bookings | Hasta **100 reservas/mes** |
| Mantenimiento | Actualizaciones de contenido, bugs, gestion de infra IA |
| Hosting | Infraestructura de terceros |

#### 1.2. Plan Pro — ₪960/mes

Todo lo incluido en el Plan Base, mas:

| Incluye | Detalle |
|---------|---------|
| Llamadas de voz IA | Llamadas entrantes/salientes con voz clonada, integradas al calendario |
| Bookings | Hasta **300 reservas/mes** |

> El Cliente autoriza al Proveedor a generar y utilizar una voz sintetica basada en muestras proporcionadas.

#### 1.3. Plan Enterprise — ₪1.270/mes

Todo lo incluido en el Plan Pro, mas:

| Incluye | Detalle |
|---------|---------|
| Bookings | **Ilimitados** |
| Llamadas de voz IA | **Ilimitadas** |
| Soporte prioritario | Respuesta en 2 horas habiles durante dias laborables |

---

### 2. Upgrade Automatico de Nivel

2.1. Si el Cliente **alcanza el limite de reservas** del plan actual durante un ciclo de facturacion, el sistema upgradeara **automaticamente** al siguiente nivel desde el proximo ciclo de facturacion.

2.2. El Cliente sera **notificado** del upgrade via WhatsApp y/o email dentro de las 24 horas.

2.3. El precio del nuevo nivel aplica desde la proxima fecha de facturacion.

2.4. **Al firmar este acuerdo, el Cliente consiente expresamente a los upgrades automaticos de nivel y los ajustes de precio correspondientes.**

2.5. Para **volver a un nivel inferior**, el Cliente puede solicitar un downgrade con 30 dias de aviso por escrito, efectivo en el proximo ciclo, siempre que su uso se encuentre dentro de los limites del nivel inferior.

---

### 3. Precio y Pago

| Concepto | Monto |
|----------|-------|
| Plan Base | ₪770/mes |
| Plan Pro | ₪960/mes |
| Plan Enterprise | ₪1.270/mes |
| Setup | **₪0 (cero)** |

3.3. Los pagos se procesan mensualmente via **Cardcom**. El Proveedor nunca almacena los datos de tarjeta del Cliente.

3.4. **Hosting anual**: monto variable. Puede cambiar segun costos de terceros. Pagadero dentro de 7 dias.

3.5. **Dominio**: monto variable. Pagadero dentro de 7 dias.

3.6. La **falta de pago** resultara en la suspension del sitio web y todos los agentes IA. Eliminacion permanente 7 dias despues del impago y rescision del acuerdo.

3.7. No se emiten reembolsos por tarifas anuales de hosting o dominio.

---

### 4. Plazos de Entrega

- **Sitio web**: 48 horas tras recibir materiales de diseno.
- **Agente WhatsApp**: 5 dias habiles tras recibir info del negocio + acceso WhatsApp.
- **Llamadas de voz IA** (Pro/Enterprise): 5 dias habiles tras recibir muestras de voz y config del calendario.

---

### 5. Propiedad Intelectual y Licencias

- Licencia no exclusiva por la duracion del acuerdo.
- Codigo fuente y diseno = propiedad del Proveedor.
- Logo, marca y contenido del Cliente = propiedad del Cliente.
- Dominio = propiedad del Cliente.
- Config del agente WhatsApp = propiedad del Cliente (entregable al terminar).
- Muestras de voz = propiedad del Cliente. El Proveedor retiene modelos sinteticos solo durante la vigencia.

---

### 6. Politica de Uso Aceptable

- Prohibido spam, material ilegal, contenido ofensivo o enganoso.
- Prohibido usar llamadas de voz IA para cold calling no solicitado, acoso o practicas enganosas.
- Violacion = rescision inmediata y unilateral.

---

### 7. Limitacion de Responsabilidad

- El Cliente es responsable de todo su contenido y datos.
- El Proveedor no garantiza resultados comerciales.
- No responsable por fallas de terceros (WhatsApp/Meta) ni fuerza mayor.
- Responsabilidad maxima = monto total pagado bajo el acuerdo.

---

### 8. Rescision

- Cliente: 30 dias de aviso por escrito.
- Proveedor: inmediata por violacion de uso, o por falta de pago (7 dias de aviso).
- Al rescindir: sitio + agentes se dan de baja.
- A solicitud se entrega: codigo fuente, datos CRM, config del agente, registros de llamadas.

---

### 9. Ley Aplicable y Jurisdiccion

Este acuerdo se rige por la ley israeli. Jurisdiccion exclusiva: tribunales competentes del distrito de Tel Aviv.

---

## Resumen de Cambios v4.0 → v5.0

| Cambio | Antes (v4) | Ahora (v5) |
|--------|-----------|------------|
| Planes | Un solo plan (₪770) | 3 tiers: Base/Pro/Enterprise |
| Precios | ₪770/mes fijo | ₪770 / ₪960 / ₪1.270 |
| Bookings | Sin limite especificado | 100 / 300 / ilimitados |
| Voz IA | No mencionado | Pro y Enterprise |
| Upgrade automatico | No existia | Seccion 2 completa |
| Soporte prioritario | No existia | Enterprise only |
| Idiomas del contrato | 4 (EN, ES, HE, RU) | 5 (+ AR) |
| Clausula de voz | No existia | IP de samples + modelos sinteticos |
| AUP voz | No existia | Prohibicion de cold calling |

---

## Idiomas Disponibles

El contrato completo esta disponible en los 5 idiomas del sistema:

1. **Espanol** (ES) — version principal
2. **Ingles** (EN) — version internacional
3. **Hebreo** (HE) — mercado local
4. **Ruso** (RU) — comunidad rusoparlante en Israel
5. **Arabe** (AR) — comunidad araboparlante en Israel

---

## Archivos Modificados

```
src/lib/contracts.ts          — Contrato completo en 5 idiomas (v5.0)
src/app/terms/page.tsx         — Pagina publica /terms actualizada
src/lib/i18n/locales/es.ts     — contractBody actualizado
src/lib/i18n/locales/en.ts     — contractBody actualizado
src/lib/i18n/locales/he.ts     — contractBody actualizado
src/lib/i18n/locales/ru.ts     — contractBody actualizado
src/lib/i18n/locales/ar.ts     — contractBody actualizado
src/app/pago/[clientId]/pago-client.tsx — Features por tier
```
