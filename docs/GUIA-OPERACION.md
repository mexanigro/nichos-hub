# Guía de operación de Arzac Studio — para Liam, sin ninguna sesión abierta

> Copia de `recuperacion-tecnica/informe/CAPA-A/P06-guia-v1/GUIA-OPERACION.md` (fuente canónica en el expediente; los enlaces del expediente son rutas absolutas de la máquina de Liam). Se actualiza con cada tramo que cambie un procedimiento.

Versión `p06-guia-v1` · 2026-09-13 · vale para **hub `d1ca50f`** (Railway, `arzac.studio`), **template `65507e0`** en los cinco sitios del lunes, **monitor-agent `952c3b7`**. Cada paso cita su fuente: `archivo:línea` (ruta relativa al repo indicado) o el informe del expediente donde se ejecutó. Si algo de aquí no coincide con lo que ves, **no improvises**: anotá qué viste y en qué paso, y se revisa en el siguiente tramo.

Convenciones: **hub** = `https://arzac.studio` con tu Google (`OWNER_EMAIL`); **ficha** = `/clients/{docId}` de un cliente; **Railway** = proyecto luminous-surprise, servicios `nichos-hub` y `monitor-agent`; **Vercel** = team mexanigros-projects; **GitHub** = `mexanigro/nichos-hub`, `mexanigro/Barber-shop-template`, `mexanigro/monitor-agent`; **Firebase** = proyecto `barbertemplate-madre`, base **`default`** (nombrada, no `(default)`).

## Índice
1. [Venta en persona (mañana)](#1-venta-en-persona-mañana)
2. [Alta de un cliente nuevo desde el hub](#2-alta-de-un-cliente-nuevo-desde-el-hub)
3. [Personalización](#3-personalización)
4. [Suspender, apagar y borrar](#4-suspender-apagar-y-borrar)
5. [Cobros y mora](#5-cobros-y-mora)
6. [Monitor](#6-monitor)
7. [Despliegues](#7-despliegues)
8. [Recuperación](#8-recuperación)
9. [Lo NO soportado hoy](#9-lo-no-soportado-hoy)

---

## 1. Venta en persona (mañana)

**Antes de salir** (guion de N10, corregido): abrí los cinco sitios un minuto antes y `GET /api/health` en cada uno; **si la primera reserva o página da 503 una vez, reintentá** (arranque en frío de instancia, N10 H-N10-1 / NC-11: `template src/lib/api/tenant-access.ts:53`); mostrá el CRM sólo en madre y demo-n08 (los otros tres demos no tienen dueño: N10 H-1); no abras «Clientes» esperando ver al visitante (H-N10-2: la reserva crea el cliente pero la lista no lo muestra); la madre está en inglés (H-3). Fuente: [N10 T4 TRANSFERENCIAS](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N10/apertura-v1/T4/TRANSFERENCIAS.md), guion del lunes.

**Pasos del cobro** (`/pago/{clientId}` es dinero real: terminal 189298, `hub src/lib/cardcom.ts:11` con `CARDCOM_SANDBOX` ausente en Railway — [N11 PRECONDICIONES](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/PRECONDICIONES.txt)):
1. Entrá al hub con Google (`/login` → «Continuar con Google», `hub src/app/login/page.tsx:19-28`) y abrí la **ficha** del cliente.
2. Bajá a la sección **Pagos** (`hub src/app/clients/[clientId]/page.tsx:988-1007`). En el panel **«Venta en persona»** escribí el importe negociado en «Alta negociada (₪1000–1500)» y apretá **Guardar** (`hub src/components/setup-amount-panel.tsx:62-90`; guarda `hub_clients.setupAmount` por `PATCH /api/clients/{docId}`, validado 1000–1500 entero: `hub src/app/api/clients/[clientId]/route.ts:215-228`; fuera de rango → 400). Debajo aparece el enlace **`/pago/{clientId}`** con botón **Copiar**. Si no guardás nada, el alta vale **1500** (`hub src/lib/pricing.ts:12-14`).
3. Abrí `https://arzac.studio/pago/{clientId}` en tu teléfono o el del cliente (sin sesión: la página es pública). El cliente ve **un plan**: alta (tu importe) + **₪250/mes** y el **contrato v8.0** en su idioma (`hub src/lib/contracts.ts:11`, renderizado con el importe: [N10 precios G2](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N10/precios-v1/G2/CONTRATOS-INDEX.txt)). Marca **«Leí y acepto los términos del acuerdo»** y apreta **«Continuar al pago»** (`hub src/app/pago/[clientId]/pago-client.tsx:70-71,148-158`).
4. Eso crea un `hub_payments` **pendiente** con `type: initial` y el importe (`hub src/app/api/payments/contract/route.ts:72-90`) y lo lleva a **Cardcom** (Low Profile, `Operation: "1"` = cobro + token: `hub src/lib/cardcom.ts:130`). Paga con su tarjeta.
5. Cardcom lo devuelve a `/pago/success` y el hub verifica el pago (`hub src/app/pago/success/page.tsx:28-35` → `POST /api/cardcom/verify-payment`). **Qué escribe el sistema** (P-01, `hub src/lib/payment-credit.ts:36-54,76-90`): el `hub_payments` pasa a **`paid`**; en `hub_clients`: `paymentStatus: active`, **`cardcomToken`** + vigencia, `cardLastFour`, `lastChargedAt`, **`nextChargeAt` = un mes después a la misma hora**, y **`status: active`** si el cliente estaba en `demo` (+ `activatedAt`). Verificación: la ficha muestra el pago en **Pagos** como pagado y el estado del cliente cambia a **Activo** (recargá la página).
6. Si Cardcom rechaza o el cliente cierra la ventana: el pendiente queda `pending`; se puede volver a abrir el mismo enlace y pagar de nuevo (la verificación es idempotente por `lowProfileCode`: `hub src/lib/payment-credit.ts:62-63,81`; `verify-payment/route.ts` re-chequea antes de llamar a Cardcom).

**Qué pasa el mes siguiente** (P-01 + P-02): el workflow **cardcom-charges** de GitHub Actions corre a diario ≈ 06:00 UTC (09:00 Israel en verano) y llama a `/api/cron/cardcom-charges` (`hub .github/workflows/cardcom-charges.yml`); el cron cobra **₪250** con el token a todo cliente con `paymentStatus` `active` o `past_due` y `nextChargeAt` vencido (`hub src/app/api/cron/cardcom-charges/route.ts:71-77`, `src/lib/recurring-charge.ts:33-39,41-88`). Éxito → `nextChargeAt` +1 mes. **Fallo → `paymentStatus: past_due`, reintento en 24 h, para siempre; NO suspende ni avisa al cliente** (`recurring-charge.ts:57-59,86-88`; la política de mora es P-03, aún no construida). El resultado se ve en GitHub → Actions (capítulo 5).

**Qué hacer a mano mientras Cardcom no esté certificado** (freno vigente de P-01/P-14: «no prometer cobro automático hasta ver el primer 250 cobrado»; el sandbox responde 603: [P-01 G3](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/CAPA-A/P01-recurrente-v1/G3/SANDBOX.txt)):
- No prometas al cliente que «se cobra solo». Decile que la cuota se cobra el mismo día del mes siguiente.
- El día siguiente al primer `nextChargeAt`, mirá GitHub → Actions → cardcom-charges: si está verde con `charged=1`, el 250 se cobró; si no, cobrá a mano: mandale de nuevo `/pago/{clientId}` (con el alta ya `paid` el enlace cobra **250**: `hub src/lib/charges.ts:15-23`) o cobrá desde la consola de Cardcom.
- Anotá en la ficha (Notas) la fecha del primer cobro y del próximo.

**Si algo falla mañana:** un 503 se reintenta; si `/pago` no carga, `https://arzac.studio/api/cron/cardcom-charges` sin secreto debe dar 401 (el hub está vivo) — si da 5xx, Railway → nichos-hub → Deployments para ver el estado; el cobro puede hacerse desde la consola de Cardcom y registrarse después (N10 precios TRANSFERENCIAS #4).

## 2. Alta de un cliente nuevo desde el hub

1. Hub → **Clientes** → **Nuevo cliente** (`hub src/app/clients/new/page.tsx`) → nombre, nicho (barbería, estética, tattoo, nails, cafetería, remodelaciones — **no uses `employment`**, no tiene catálogo: `hub src/lib/client-config/niche-presets.ts:16-20`), modo solo/equipo, teléfono, email, dirección, Instagram, idioma (**he/en/ru/ar**; español no existe en la web: `hub src/lib/deploy.ts:57`), y el **email del dueño** (`adminEmail`).
2. Al enviar, el hub hace todo (`hub src/app/api/clients/provision/route.ts:60-112`): crea `hub_clients` (estado `demo`), `clients/{slug}` y `config/{slug}` **con el catálogo del nicho** (servicios, personal, reglas: `src/lib/provisioning.ts:38-87`), da de alta al dueño en `admin_users` + claims (`src/lib/admin-bootstrap.ts:33-54`), crea el proyecto en Vercel, sube las variables (incluida la credencial Admin y `BUSINESS_OWNER_EMAIL`), añade el dominio **`{slug}.arzac.studio`** y dispara el deployment, fallando cerrado si Vercel rechaza algo (`src/lib/deploy-flow.ts:42-92`).
3. **Tiempos medidos** (n = 1, N08): alta → READY en Vercel ≈ **1,5 min**; alta → primera reserva ≈ **8 min** con un 503 y un reintento ([N08 NC-5](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N08/apertura-v1/T4/TRANSFERENCIAS.md)). No prometas menos.
4. La ficha muestra `deployStatus` `building` y sondea cada 15 s hasta `ready` o `error` (`hub src/app/clients/[clientId]/page.tsx:205-216`).
5. **Fila anónima** (comprobación del sitio nuevo, procedimiento de N07 T3 / N08): abrí `https://{slug}.arzac.studio/` (200), `/api/health` (200 `{"status":"ok"}`), `/api/tenant/status` (200 `active`), y el wizard de reservas hasta ver horarios sin errores en consola ([N07 T3 TABLA](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N07/apertura-v1/T3/TABLA.md)). Si `/api/services` devuelve `[]`, falta catálogo (N10 H-2): el alta desde el hub lo siembra; si el cliente es anterior a N08, sembralo desde Config → Servicios (capítulo 3).
6. **Dueño y su primer inicio de sesión**: el dueño entra en `https://{slug}.arzac.studio/admin` con **Google** (`template src/components/admin/AdminLoginPanel.tsx:30,258`). Si su email **no existía en Firebase Auth** al dar de alta, la ficha lo dice (`ownerBootstrap.claimsReason: user_not_found`, `hub src/lib/admin-bootstrap.ts:53`): pedile que entre una vez con Google y después, en la ficha, apretá **admin-bootstrap** de nuevo (`page.tsx:331`, `POST /api/clients/{clientId}/admin-bootstrap`). Un email sólo puede ser dueño de **un** negocio (D-21).
7. **Si Vercel falla a mitad**: la ficha muestra `error` con el motivo (`env:` / `domain:` / `deployment:`). Botón **Reprovision** (`page.tsx:302`) vuelve a subir las variables y redespliega (`hub src/lib/client-env.ts:211-240`). **No repone el dominio**: si el error fue en `domain`, añadí `{slug}.arzac.studio` a mano en Vercel → proyecto → Settings → Domains (N11 H-N11-7). Si el proyecto ni se creó (sin `vercelProjectId`), repetí el alta: el slug nuevo lleva otro sufijo y el `hub_clients` viejo queda huérfano → borralo con **Eliminar** (capítulo 4).
8. Después del alta, el sitio aparece en el monitor en ≤ 5 min (capítulo 6) porque está en `demo`.

## 3. Personalización

**Regla:** todo lo que vive en `config/{clientId}` se cambia desde la ficha (Config y Contenido → `PUT /api/config/{clientId}`, `hub src/app/api/config/[clientId]/route.ts:163`); la web lo lee sin redeploy. Lo que no es dato exige código y deploy del template (capítulo 7). Fuente: [N11 INVENTARIO B-01/B-07](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/INVENTARIO.md).

- **Pestaña Config** (`hub src/components/client-config-tab.tsx`, editores en `src/components/config-editors/`): Negocio (nombre, razón social, dirección legal, modo), Branding (tagline, colores, tema, **logo**), Media (imagen principal, OG, **galería**), Hero (layout, fondo, 3D, partículas, splash), **Servicios** (`services-editor.tsx`), **Personal y su horario semanal** (`staff-editor.tsx`, `schedule-editor.tsx`), Operaciones (buffer, reserva máxima anticipada, anticipación mínima, confirmar automáticamente, política de cancelación), pagos, chatbot, redes, SEO. **No cambies «Nicho de la build»** sin redesplegar (`client-config-tab.tsx:931`).
- **Pestaña Contenido** (`hub src/components/client-content-tab.tsx`): textos de `hero, services, whyChooseUs, gallery, team, testimonials, booking, contact, faq, location, philosophy, process, portfolio, ambience`; botón de generar texto con IA (`:272`). Cada guardado queda en `config_history/{clientId}` (`config/[clientId]/route.ts:210-221`; se ve en la ficha, **no hay «revertir»**: se reescribe a mano el valor anterior).
- **Fotos y logo**: los subís **vos** desde la ficha (`POST /api/upload/{clientId}` → Storage `clients/{clientId}/images/…`, `hub src/app/api/upload/[clientId]/route.ts:69-92`; logo por `upload-logo`). El dueño **no** puede subir fotos desde su CRM.
- **Lo que el dueño sí cambia desde su CRM** (`https://{slug}.arzac.studio/admin`): reglas de reserva (buffer, días, horas, autoconfirmar: `template src/services/db.ts:397-402`), **horarios, pausas y días libres por profesional** (`staff_overrides`, `db.ts:382-392`), citas, clientes (etapa, etiquetas), tareas, su equipo (Usuarios: owner/manager/staff, `template api/index.ts:4403`), stock, conocimiento. **Ojo:** las vacaciones que cargue el dueño **no bloquean la reserva web** todavía (B-9/B-10, N11 H-N11-8): si un profesional no trabaja un día, quitá ese día también en Config → Personal.
- **Idioma de la web**: en la ficha, cambiar idioma (`PATCH language`) **y después Redeploy** (`page.tsx:279`), porque `VITE_UI_LANGUAGE` se fija al construir (`hub src/lib/deploy.ts:82-98`; N10 H-3: madre en inglés por eso).
- **Exige código + deploy del template**: cualquier layout no cubierto por las variantes, textos de la interfaz del CRM, emails (hoy salen en inglés: `template src/lib/api/notify-booking-handler.ts:71,177,186`), reglas del servidor.

## 4. Suspender, apagar y borrar

Tres botones en la ficha; ninguno avisa al cliente (0 emails en esas rutas). Fuente: [N11 INVENTARIO D-01…D-05](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/INVENTARIO.md).

| Botón | Qué hace | Qué ve el visitante | Qué ve el dueño | Reversa |
|---|---|---|---|---|
| **Suspender** (`page.tsx:219-229`) | `hub_clients.status` y `clients/{id}.status` = `suspended` (`PUT /api/clients`, `hub src/app/api/clients/route.ts:116-148`) | **la landing y el contacto siguen en línea**; sólo reservas y pagos responden 423 (`template src/lib/api/tenant-access.ts:56-57`; el anónimo no puede leer `clients/{id}` y lo trata como activo: `template src/services/tenant.ts:142`). En sitios viejos sin credenciales (velvet, `6c07d7a`) **no bloquea nada** (N11 D-06) | pantalla «suspendido» al entrar al CRM (`template src/main.tsx:63+`) | mismo botón → **Activar** |
| **Kill Switch** (`page.tsx:233-256`, `hub src/app/api/clients/kill/route.ts:44-75`) | pausa el **proyecto en Vercel** (`/v1/projects/{id}/pause`) y marca `suspended` | el sitio **no carga** (página de Vercel) | nada | mismo botón → **Reactivar sitio en Vercel** (`unpause`) |
| **Eliminar** (`page.tsx:1113-1144`, `hub src/app/api/clients/[clientId]/route.ts:125-198`) | borra el **proyecto Vercel** (con su dominio), `hub_clients`, `clients`, `config`, `whatsapp_config`, y hasta 450 docs de `contact_inbox`/`provider_messages`/`hub_payments` | el dominio deja de existir | — | **no hay**: es permanente |

**Eliminar NO borra** las citas, los clientes del CRM, los dueños (`admin_users`), los manifiestos, los horarios ni las fotos de Storage (N11 H-N11-6). Antes de eliminar un cliente real: exportá desde su CRM (Clientes → CSV, Dashboard → CSV: `template src/components/admin/CustomersTab.tsx:301`, `DashboardTab.tsx:358`) — desde el hub **no hay exportación**. El contrato promete borrado a los 7 días de impago y entrega de datos: hoy ambos son manuales (P-12/P-16).

**Archivar** (estado `archived` por `PUT /api/clients`) no toca Vercel: el proyecto sigue vivo y cuesta lo mismo (NC-10).

## 5. Cobros y mora

- **Quién pagó**: hub → **Pagos** (`/payments`, `hub src/app/payments/page.tsx`): lista de `hub_payments` con estado (`paid`, `pending`, `failed`), filtros y totales; y en la **ficha** → sección Pagos (`page.tsx:988`). Un alta pagada = fila `initial` / `paid` con `cardLastFour`. Hoy (censo N11): 0 altas pagadas, 3 pendientes de prueba.
- **Estado del cliente**: `paymentStatus` en la ficha: `active` (al día), `past_due` (un cobro falló; el cron reintenta cada 24 h), vacío (nunca pagó por el hub).
- **El cron en GitHub**: `https://github.com/mexanigro/nichos-hub/actions/workflows/cardcom-charges.yml`. Cada día ≈ 06:00 UTC aparece una corrida: **verde** = respondió 200 y ningún cobro falló; **rojo** = HTTP ≠ 200 o `failed > 0` (`hub .github/scripts/check-cron.mjs`). El log del paso «Cobrar cuotas vencidas» dice `processed=N charged=… failed=… skipped=… reasons=[clientId:motivo]` (`hub src/lib/cron-report.ts`). `skipped` = clientes vencidos **sin token** (pagaron antes de P-01 o fuera del hub): hay que cobrarles a mano y, si quieren automático, que vuelvan a pagar por `/pago/{clientId}` (guarda el token). **No hay email al ponerse rojo**: activá las notificaciones de Actions de tu cuenta de GitHub (Settings → Notifications → Actions) o mirá el workflow los días de cobro.
- **Ante rojo**: abrí la corrida, leé `reasons`. `declined`/error de Cardcom → el cliente queda `past_due` y se reintenta mañana; avisale vos (no hay aviso automático: P-03). HTTP 401 → el secreto `CRON_SECRET` de GitHub no coincide con Railway (recargalo en Settings → Secrets → Actions). HTTP 5xx → el hub está caído: capítulo 7/8.
- **Corrida a mano**: Actions → cardcom-charges → **Run workflow** (P-02 lo ejercitó: run 34758822854, [P-02 G2](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/CAPA-A/P02-cron-v1/G2/CORRIDA.txt)).
- **Aviso conocido (H-P06-1):** la página `/payments` cuenta como «recurrentes pagados» las filas `type: recurring` + `status: paid` (`hub src/app/payments/page.tsx:60-69`), pero el cron escribe `type: subscription_recurring` + `status: success` (`hub src/lib/recurring-charge.ts:54,76`): **los cobros del cron aparecen en la lista pero no en ese contador**. Mirá la fila, no el total, hasta que se alinee (Capa B).

## 6. Monitor

- **Qué vigila** (`monitor-agent src/targets.ts`): todos los clientes con `status` **active o demo** y `deployUrl` (hoy **13**) + `https://arzac.studio` (hub, sólo landing) = **14** objetivos. `suspended`/`archived` no. Log de arranque: `loaded 14 target(s): …` ([P-04 G1-RUNTIME](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/CAPA-A/P04-monitor-v1/G1/G1-RUNTIME.txt)).
- **Cada cuánto** (`monitor-agent src/scheduler.ts:11-12`): cada **5 min** landing + `/api/health`; cada **30 min** `/api/tenant/status` + `/api/services` + disponibilidad. Cada petición reintenta 1/2/4 s ante 5xx (`src/checks/retry.ts`): eso absorbe el 503 de arranque en frío y mantiene los sitios calientes.
- **Cuándo llega un email** (a `liam.arzac@gmail.com`, desde `Nichos Monitor <noreply@arzac.studio>`): «🚨 CRITICAL: {clientId} — http|api» cuando un sitio falla **dos rondas seguidas** (≈ 5–10 min de caída real; `src/anomalies.ts`); «✅ RESUELTO» tras 3 rondas sanas; máximo 5 emails/hora, sin repetir el mismo incidente en 1 h. Un fallo aislado **no** avisa. La latencia sólo avisa con dos muestras >3× el p95 de los últimos 7 días (P-04 desvío 1: #97/#98 fueron falsos positivos y ya no pueden repetirse). **No hay WhatsApp** (decisión de Liam 2026-09-13) ni redeploys automáticos (agente IA apagado).
- **Dónde ver incidentes**: hub → **Monitor** (`/monitor`, incidentes abiertos: `hub src/lib/repos/health.ts:99-103`) y en cada ficha (últimas 50 métricas, 20 incidentes, tasas 24 h / 7 d: `health.ts:63-81`); la lista de clientes muestra `healthy / degraded / down` (`health.ts:14-52`). Logs crudos: Railway → monitor-agent → Logs.
- **Probar la alerta**: Railway → monitor-agent → Variables → `MONITOR_PROBE_URL = https://no-existe-p04.arzac.studio` → el servicio se redespliega solo → a los ≈ 10 min llega «CRITICAL: monitor-probe — http» → **borrá la variable** (se redespliega). El incidente de la sonda queda abierto en la lista (no habrá rondas sanas que lo cierren): es un artefacto de prueba (P-04 #99). Fuente: [P-04 G3-RUNTIME](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/CAPA-A/P04-monitor-v1/G3/G3-RUNTIME.txt).
- **Si el monitor mismo cae**: nadie avisa (Capa B). Señal: Railway → monitor-agent → Deployments en rojo o Logs sin `round completed` en 10 min.

## 7. Despliegues

- **Hub (Railway):** un `git push` a `main` **no despliega** ([régimen de deploy](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/../../PLAN-RECUPERACION-TECNICA.md), sección «Frontera técnica/estética»; comprobado en N10/P-01: Railway siguió en el commit anterior hasta tu clic). Cuando una sesión te pasa un hash: Railway → nichos-hub → **Deployments → «Deploy Latest Commit»**; esperá `SUCCESS` + `RUNNING`; verificación mínima: `https://arzac.studio/` 200, `/pago/{clientId}` 200, `POST /api/cardcom/create-onboarding-payment` 403 (compra web apagada), `/api/cron/cardcom-charges` sin secreto 401 ([P-02 PRECONDICIONES](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/CAPA-A/P02-cron-v1/PRECONDICIONES.txt)). **Reversa**: Deployments → deployment anterior → **Redeploy**.
- **monitor-agent (Railway):** igual («Deploy Latest Commit»); cambiar una variable **también redespliega**. Verificación: Logs con `database connected`, `loaded N target(s)`, `round completed` y 0 «credentials missing».
- **Template (Vercel, un proyecto por cliente):** `vercel.json` tiene `deploymentEnabled: main = false` (`template vercel.json`): un push **no despliega**. Procedimiento vigente (N07 T3, [TABLA](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N07/apertura-v1/T3/TABLA.md)): (1) anotá el id del deployment actual de cada proyecto (reversa); (2) **piloto** en un sitio: Vercel → proyecto → Settings → Git → **Deploy Hooks** → crear hook sobre `main` → disparar (POST a la URL, nunca la publiques) → **revocar el hook**; (3) **fila anónima** en el piloto: landing 200, `/api/health`, `/api/tenant/status`, wizard hasta horarios sin `permission-denied` en consola; (4) repetí en los demás, uno a uno; (5) **reversa** = Vercel → proyecto → Deployments → deployment anterior → **Promote to Production**. Alternativa desde la ficha: **Redeploy** (`hub src/app/api/clients/redeploy/route.ts:192-205`) redespliega `main` en ese proyecto (sin piloto automático). Regla: **ningún cambio estético se despliega sin la regresión técnica** (frontera técnica/estética).
- **Rules e índices de Firestore**: sólo desde el repo del template con `firebase deploy`, con procedimiento aislado y reversa por huella (N05 D-11, [PLAN-DESPLIEGUE-N05](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N05/PLAN-DESPLIEGUE-N05.md)). **Nunca** desde la consola a mano.
- **Qué nunca hacer**: `vercel env pull` (saca secretos a un archivo); tocar la variable `VITE_UI_LANGUAGE` de un proyecto sin redesplegar; borrar el proyecto Vercel de la madre (`prj_WPbUEbo…`, protegido en el hub: `hub src/lib/client-env.ts:155`); rotar la clave Admin sin reprovisionar los N proyectos (capítulo 8).

## 8. Recuperación

- **Firestore `default`**: backup **diario automático**, protección contra borrado activa (`DELETE_PROTECTION_ENABLED`, [N11 PRECONDICIONES](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/PRECONDICIONES.txt)); PITR deshabilitado (retención 1 h). **Restaurar** (ensayado una vez, N09: ≈ 15 min + 3 min de verificación; pérdida máxima 24 h): consola Firebase → Firestore → «Recuperación ante desastres» / Backups → fila del día → ⋮ → Restaurar → **ID de base nuevo** (nunca sobre `default`) → esperar `ACTIVE` → verificar documentos → **la base restaurada no sirve tráfico**: para volver a servir hay que copiar los datos a `default` o cambiar `FIREBASE_DATABASE_ID` en Railway y en cada proyecto Vercel (reprovision) — **no ensayado** (ND-2). Procedimiento literal: [N09 T1](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N09/apertura-v1/T1/PROCEDIMIENTO-RESTAURACION.md). Después borrá la base restaurada (cada base nombrada se factura sin cuota gratuita).
- **Postgres del monitor (Railway)**: sin copia ni ensayo (ND-6). Si se pierde, el monitor recrea el esquema al arrancar (`monitor-agent src/index.ts:16`); se pierden métricas e incidentes históricos, nada del producto.
- **Storage (fotos)**: sin copia (ND-6). Las fotos viven en `clients/{clientId}/images/`; guardá los originales que te mande cada cliente.
- **Variables**: hub en Railway (45 nombres, [N11 PRECONDICIONES](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/PRECONDICIONES.txt)); monitor en Railway (7 + `DATABASE_URL`, `RESEND_API_KEY`); cada proyecto Vercel recibe las suyas en el alta (`hub src/lib/deploy.ts:94-120`). No hay inventario exportado: si Railway se pierde, se reconstruyen desde `.env.example` del hub y CLAUDE.md del monitor.
- **Rotar la clave Admin** (si se filtra): nueva clave en Firebase → Railway nichos-hub (`FIREBASE_PRIVATE_KEY`) → **Reprovision en cada ficha** (sube la clave a cada proyecto Vercel: `hub src/lib/client-env.ts:177-194`) → Railway monitor-agent → `.env.local` de tu máquina y los arneses → revocar la vieja. Orden y alcance: [N11 INVENTARIO G-04](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/INVENTARIO.md). Sin ensayo.
- **A quién escribir**: Cardcom (soporte: usuario API del terminal 1000 pendiente; 603 hoy), Vercel (soporte del team Pro), Railway (soporte del proyecto), Resend (dominio `arzac.studio` verificado). Guardá el número de deployment/incidente antes de escribir.

## 9. Lo NO soportado hoy

Tomado de [N10 T3](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N10/apertura-v1/T3/NO-VERIFICADO-PRIMERA-SEMANA.md), [N11 INVENTARIO](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/INVENTARIO.md) y [PLAN-ESCALA](C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/informe/N11/estudio-v1/PLAN-ESCALA.md). El freno es lo que **no hay que prometer**.

| Qué | Estado | Freno / qué decir | Tramo |
|---|---|---|---|
| Cobro automático de la cuota | código listo (P-01+P-02) pero **sin cobro real ni sandbox certificado** (603) | «se cobra el mismo día del mes siguiente; si falla, te aviso» | P-14 |
| Aviso y suspensión por mora | no: reintento diario sin fin, sin email, sin suspender | no afirmar que la mora suspende | P-03 |
| Suspensión visible al visitante | no: landing y contacto siguen en línea; sólo 423 en reservas/pagos | «apagar» = Kill Switch | P-07 |
| Cliente creado por reserva web visible en «Clientes» | no (existe, no se lista) | no abrir Clientes esperando verlo | P-09 |
| Emails en el idioma del cliente | no: inglés fijo | «los avisos llegan en inglés por ahora» | P-10 |
| Primera reserva sin 503 | puede dar 503 una vez | «si falla, probá de nuevo» | P-11 |
| Dueño en gooli / estética / u-as-de-mar | sin dueño en `admin_users` | no mostrar el CRM allí | P-08 |
| Vacaciones/feriados del dueño bloquean la reserva | no (sólo en su CRM) | quitar el día también en Config → Personal | P-17 |
| Cancelación por el visitante | falla por reglas (B-8) | el dueño cancela desde el CRM | N10-B |
| Horario validado en el servidor | no (B-10); hueco tomado puede ofrecerse hasta el 409 (NC-14) | — | P-17 |
| Dominio propio del cliente | no desde el hub (siempre `*.arzac.studio`) | no prometer «tu dominio» sin hacerlo a mano en Vercel | P-18 |
| Español en la web del cliente | no (he/en/ru/ar); la landing lo promete | corregir copy | P-13 |
| Exportación completa y borrado total al dar de baja | sólo CSV desde el CRM; Eliminar deja datos | exportar antes de eliminar | P-16 |
| Cambio de tarjeta / reembolsos / factura del alta | sin ruta (pagar de nuevo reemplaza el token; reembolso manual en Cardcom; el Low Profile del alta no lleva líneas de factura) | — | Capa B / P-20 |
| Revocación inmediata de un empleado | el token sigue válido hasta 60 min (L-1b) | — | P-23 |
| Alerta si el monitor cae / alerta por WhatsApp | no | — | Capa B |
| Contador «recurrentes pagados» en `/payments` con los cobros del cron | no coincide (H-P06-1) | mirar filas | Capa B |
| Compra web desde la landing | apagada (403 → WhatsApp) | venta en persona | P-29 |
| Contrato revisado por abogado | no | no afirmarlo | P-12 |
