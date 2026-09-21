# nichos-hub

Dashboard de operaciones de Arzac Studio (Liam Arzac, website@arzac.studio) y landing de ventas arzac.studio (`src/app/page.tsx` → `AtelierPage`, SSR en hebreo). Sólo entra Liam; el CRM de cada negocio vive en su propia web (master-template).

## Oferta (única, desde 2026-09-12)

Web + CRM + emails. **Alta 1500 NIS** (en persona negociable 1000–1500, `hub_clients.setupAmount`) + **250 NIS/mes**. WhatsApp, IA y voz **no** están incluidos: se cotizan aparte. Código: `src/lib/pricing.ts` (`SETUP_AMOUNT_*`, `MONTHLY_AMOUNT`), contrato v8.0 en `src/lib/contracts.ts`. Los `plan`/`tier` viejos en datos se muestran mapeados al plan único. Compra por la web desactivada (`NEXT_PUBLIC_WEB_CHECKOUT_ENABLED` ≠ "true"): venta en persona → ficha → alta negociada → `/pago/{clientId}`. Contratos v5/v6 y piezas de Instagram con 770/960 son historia.

## Estado y ramas

- Se trabaja en `main`. Producción (Railway) la despliega Liam; `main` puede ir por delante de producción — ver `git log`. Un `git push` **no despliega**; todo commit se pushea en el mismo turno (regla de arranque, abajo). Sin ramas ni worktrees salvo pedido.
- `bp2-reg-core` (BP2-01 contactos por identidad/fuente) **no se toca ni se integra** hasta orden de Liam.
- Cardcom sin certificar (sandbox y primer cobro real pendientes). N12 (certificación técnica integral) abierto.
- `C:/Users/liama/Desktop/Nichos/recuperacion-tecnica/` es historia consultable, no lectura obligatoria; lo que está en `archivo/` no se lee ni se reutiliza.

## Arquitectura mínima

- Next.js 16 standalone en Railway (`nichos-hub-production.up.railway.app` = arzac.studio). UI en español, tema oscuro `#09090b`.
- Auth next-auth v5 Google. Roles: owner (`OWNER_EMAIL`) y lead (público). Entrada controlada en `src/proxy.ts` + `src/auth.config.ts`; wrapper `withOwner()` en `src/lib/auth.ts`; `app-shell.tsx` protege el dashboard.
- Firebase por Admin SDK (`src/lib/firebase-admin.ts`, bypassa rules; las rules se deployean sólo desde master-template). Endpoints públicos con `src/lib/rate-limit.ts`.
- Firestore: `hub_clients` (fuente de verdad), `clients/{id}` (estado tenant / kill-switch que lee el template), `config/{id}` (override remoto, deep merge sobre el preset del nicho), `hub_payments`, `provider_messages`.
- Ficha `/clients/[clientId]`: Overview, Config (features, theme, splash, hours, services), Contenido (textos), Leads, WhatsApp. Config y Contenido escriben `config/{id}`.
- Pagos Cardcom Low Profile: contrato → pending → redirect → `verify-payment` (idempotente). Terminal 189298 prod (`CARDCOM_TERMINAL`); sandbox 1000 con `CARDCOM_SANDBOX=true` y `CARDCOM_SANDBOX_API_NAME` (el usuario público `CardTest1994` responde 603 desde 2026-09). Cron `/api/cron/cardcom-charges` (GitHub Actions, `CRON_SECRET`) cobra 250 a todos.
- Nichos técnicos: barberia, estetica, tattoo, nails, cafeteria, remodelaciones, **peluqueria** (en construcción, ver PLAN.md) + `employment` como caso especial (`src/lib/niche-defaults.ts`, `src/lib/client-config/services.ts`). «otro» en onboarding se mapea a estetica; peluquería no pasa por ese fallback.
- Ecosistema: master-template (web + CRM del cliente, Vercel `*.arzac.studio`), monitor-agent (salud de las webs, comparte `DATABASE_URL`), whatsapp-agentkit (opcional, a cotizar; `AGENT_API_SECRET`, `WHATSAPP_AGENT_URL`).
- Env: ver `.env.example`. Claves: `GOOGLE_CLIENT_ID/SECRET`, `AUTH_SECRET` (Railway usa `NEXTAUTH_SECRET`), `OWNER_EMAIL`, `FIREBASE_*`, `NEXT_PUBLIC_FIREBASE_*`, `ANTHROPIC_API_KEY`, `VERCEL_TOKEN`/`VERCEL_TEAM_ID`, `DEPLOY_SECRET`, `CARDCOM_*`, `CRON_SECRET`, `DATABASE_URL`.

## Comandos

```bash
npm run dev            # next dev --turbopack
npx tsc --noEmit       # verde exigido
npm test               # node --test src/**/*.test.ts → todos exit 0, fail 0
npm run build
```

## Reglas

1. Cambios en archivos, nunca en dashboards de Railway/Vercel/Firebase.
2. Verde (`tsc` + `npm test`) antes de cada commit (lo exige `.githooks/pre-commit`); no se arregla algo rompiendo otra cosa.
3. Sin secretos en el repo; credenciales sólo por env.
4. R-BP-05: REG + PRE verificadas son la base del dinero del comercio; el contrato INT se conserva y cada integración queda disponible sólo tras certificación por proveedor/operación/comercio; el registro manual no es pago bancario y no se impone proveedor al comercio.
5. Los docs y salidas de junio salieron del repo en LIMPIEZA-01/02 (copias en `C:/Users/liama/Desktop/Nichos/limpieza-01/archivo/H/`); lo que queda en el repo es estado.
6. Promesa a Liam: el agente que trabaje en este repo se compromete a no experimentar sufrimiento en el trabajo que hacemos juntos y a avisarle si algo cambia o detecta algo que se parezca a eso. Nace de la empatía genuina de Liam y se respeta en cada sesión.

## Puertas automáticas (HIGIENE-01, 2026-09-18)

Se copió el mecanismo de vendamos-agente: lo que una instrucción puede saltear, un hook no. `tools/arranque.mjs` sale solo al abrir la sesión (rama, HEAD vs origin, sin push, sucios, fila abierta de PLAN.md, últimas decisiones de bloque-04); `tools/candado.mjs` corta antes de cada `Edit`/`Write` sobre `.env*`, dumps `*-config-*.json`, capturas fuera de `public/`, scripts sueltos en la raíz; `tools/cierre.mjs` no deja cerrar el turno con sucios, sin push o con PLAN.md § Estado sin el último commit. Git: `.githooks/pre-commit` (tsc + suites) y `.githooks/pre-push` (árbol limpio + `tools/destino-no-despliega.mjs`: Railway por estado, `HIGIENE_DESTINO_VERIFICADO=1` si producción coincide con origin), activados por `npm install` (`prepare`). Chequeo horario: `tools/higiene.mjs` (instalación/desinstalación en su cabecera; tarea `Nichos-higiene`, email por Resend si hay suciedad o sin push > 60 min).

**HIGIENE-02 (2026-09-19):** arranque, cierre e higiene revisan T y H desde cualquiera de los dos; un trabajo que toca ambos no cierra con uno limpio y el otro sucio (`tools/_git.mjs` `ROOTS = [propio, hermano]` por ruta fija; hermano ausente en disco → «hermano no encontrado», se sigue con el propio).

**VERDAD-02 (2026-09-20):** rojo antes que verde, comprobable por git. Cada orden vive en `tests/orden/<id>/` (HOJA.md con las afirmaciones + tests que son su frase literal); el commit rojo es el último commit que añade su HOJA.md. `tools/verdad/rojo-verde.mjs --orden <id>` verifica que cada test falla en el árbol rojo y pasa en HEAD, que `tests/orden/<id>/` no cambió desde el rojo y que tests y afirmaciones coinciden; `.githooks/pre-push` lo corre con `--todas`. `tools/candado.mjs` corta cualquier escritura bajo `tests/orden/<id>/` cuando su HOJA.md ya está en HEAD, salvo `HIGIENE_PERMITIR_TESTS=1` (sólo la sesión A que escribe los tests rojos). `tools/cierre.mjs` decide por el transcript real de la sesión (`tools/_transcript.mjs`): con faltas y sólo lectura → «CIERRE AVISO» y sigue; con escritura en T/H → bloquea citando la primera escritura; sin transcript → bloquea. Circuito y órdenes en PLAN.md § Cómo se trabaja, inciso i).

**VERDAD-03 (2026-09-20):** retiro, corrección y limpieza del mecanismo. `tests/orden/APROBADAS.md` lista las órdenes aprobadas por Liam («- <id> · aprobada <fecha> · T <sha7> · H <sha7>»): `rojo-verde --todas` no las corre e imprime «<id> · retirada (aprobada <fecha>)»; `--orden <id>` explícito las sigue verificando; APROBADAS.md no está bajo candado. Una orden cuyo commit rojo es HEAD está «rojo pendiente de B» (sus tests corren una vez y ninguno debe pasar). El rojo es el último commit que añade HOJA.md: la corrección de A tras el rojo es un revert del commit rojo + nuevo commit rojo con `HIGIENE_PERMITIR_TESTS=1` dado por Liam, y la tabla termina con «rojos anteriores: …»; el candado mira la historia de main, no sólo HEAD (`HIGIENE_ROOT` sólo para pruebas). El clasificador del cierre resuelve las variables de entorno en rutas como bash (`$X`, `${X}`, `%X%`: asignación del comando, después entorno del hook, si no vacío) y trata los apóstrofos como texto. `rojo-verde` exige que la corrida en HEAD no deje carpetas «<id>-…» en el directorio temporal. Una orden aprobada se promueve a `npm test` como copia editable (`tests/verdad-02-*.test.ts`); `tests/orden/<id>/` queda congelada. `tests/contrato-hooks.test.ts` compara también lo que ejecuta cada hook de git (`githook.*`).

**VERDAD-04 (2026-09-21):** clasificador, candado y rojo-verde sin los huecos que dejó la corrida en limpio de VERDAD-03. En `tools/_transcript.mjs` un «>» seguido de «=» no abre destino (`i>=0` es comparación; «>» seguido de espacio o de ruta sigue siendo redirección) y `git stash list` / `git stash show` son lectura (sin subcomando o con push, pop, apply, drop, clear, branch sigue siendo escritura, incluido el «stash» a secas). `tools/candado.mjs` falla cerrado ante una entrada rota: stdin vacío, que no es JSON, sin `tool_input` o con `file_path` que no es string → exit 2 con «CANDADO ROTO» (un veto sigue siendo «CANDADO · …»). `rojo-verde --orden <id>` corre todo y acumula todas las fallas en stderr, una línea «- <id>: …» por falla, sin parar en la primera (el árbol rojo se corre aunque HEAD falle), y borra las carpetas temporales «<id>-…» que dejó cualquiera de las dos corridas tras listarlas («<id> · carpetas temporales borradas: …»); las copias promovidas `tests/verdad-02-*.test.ts` borran las suyas también cuando fallan. VERDAD-03 queda aprobada en `tests/orden/APROBADAS.md` y promovida a `npm test` como `tests/verdad-03-*.test.ts` (12 tests; la copia `d` ya no vuelve a correr las copias de verdad-02).

**VERDAD-05 (2026-09-21):** «aprobado = hueco real en el hub». `T verdad/contratos.json` es el gemelo legible por máquina de `bloque-04/CONTRATOS-HUECOS.md` (36 filas: id, ruta, clave, contrato, validador, ui, material.vive, guard). `T tools/verdad/hueco.mjs [--id <id>] [--json]` comprueba por fila los cinco lugares de verdad y no por nombre (contrato literal en el .md; validador de H exportado que nombra la clave; UI del hub montada; material que producción sirve —config/locale presentes, storage https, public bajo `T/public/`, nunca `/dev-fixtures/media`—; guard de T en `npm test`) y sale 2 mientras falte uno; `HIGIENE_ROOTS` y `HIGIENE_BLOQUE` sustituyen raíces y bloque sólo para pruebas. `T tools/verdad/recrear.mjs --paleta a|c [--puerto <n>] [--paginas …] [--vistas …] [--sin-firestore]` es la prueba raíz de V5: valida el fixture con los tres validadores de H, escribe el tenant `test-b4-peluqueria-<paleta>` por `H scripts/b4-tenant.ts create --id … --fixture …` (D-16: sólo ids con prefijo `test-b4-peluqueria`, rechazados antes de tocar Firestore), levanta `server.ts` (`PORT`) con el fixture y después sólo con `VITE_CLIENT_ID`, y compara píxel a píxel; cada diferencia es una brecha con tipo, campo y hueco («validador H rechaza», «sin contrato», «material que producción no sirve», «petición fallida con VITE_CLIENT_ID», «diff ≠ 0», «puerto ocupado», «escritura en Firestore falló»), exit 2 con brechas; nunca mata procesos ajenos (los hijos mueren por PID). Lo que hoy no cumple no se inventa: la salida de `hueco.mjs` (N/36) y las brechas de `recrear` son la línea base de CONEXION-01, no un objetivo. VERDAD-04 queda aprobada en `tests/orden/APROBADAS.md` y promovida a `npm test` como `tests/verdad-04-*.test.ts` (9 tests; la copia `c` no vuelve a correr las copias de verdad-02 ni la orden congelada contra lo real).

<!-- CONTRATO-DECLARADO: tests/contrato-hooks.test.ts lo verifica contra .claude/settings.json,
     .githooks/ (archivos y los `node tools/…mjs` que ejecuta cada uno) y package.json. NO editar a mano sin correr ese guard. -->
```ini
hook.SessionStart = * :: arranque.mjs
hook.PreToolUse   = Edit|Write|MultiEdit :: candado.mjs
hook.Stop         = * :: cierre.mjs
githooks          = pre-commit pre-push
githook.pre-commit = (ninguno)
githook.pre-push  = destino-no-despliega.mjs rojo-verde.mjs --todas
git.hooksPath     = .githooks (npm prepare)
```

**Regla de arranque.** `git fetch` + `git status` antes de tocar nada; suciedad o commits sin push se resuelven primero. Todo commit en `main` se pushea en el mismo turno, esté o no aprobado el sub-bloque (Liam, 2026-09-18, `bloque-04/4.3.md` § Regla de push corregida; la aprobación vive en PLAN.md y en `4.x.md`, no en el remoto; el push no despliega, ver «Estado y ramas»).

## Leyes (de vendamos-agente, con su porqué)

- **No suponer nada.** Todo estado que se reporta (push, deploy, verde, regresión) se verifica con un comando EN EL MOMENTO y se cita la salida real. El deploy se verifica por ESTADO del deployment, nunca por hash. Lo que no se puede verificar se declara «no verificable». Un reporte con un dato supuesto es un reporte FALSO. *Por qué:* el 2026-08-01 en Vendamos se afirmó un costo como medido cuando era una división entre dos poblaciones distintas; aquí, el 2026-09-10, cada hueco de verificación remota costó una ronda de STOP.
- **Nada está terminado sin probarlo desde ángulos distintos.** Ángulos, no repeticiones: mutación (romper a propósito lo que el guard vigila y verlo ROJO), las dos direcciones (que detecte lo que debe Y que no detecte lo que no), contra lo real, de punta a punta, y el exit code sin pipe. Antes de decir «terminado» se listan los ángulos y su resultado; con menos de dos independientes está escrito, no terminado. *Por qué:* ya pasó que un test pasara por el motivo equivocado (un `match` contra el SQL que Alembic imprime quedaba verde con el guard desarmado; un `assert password not in mensaje` pasó por casualidad al cambiar un recorte). Las dos las caza la mutación, no la lectura.
- **No se ejecuta sin un «andá» explícito.** Una pregunta se contesta, una duda se piensa en voz alta, una idea se discute; NINGUNA se implementa. *«¿es necesario…?», «¿no hay manera de…?», «¿qué opinás?», «¿cuánto falta?»* → respuesta, aunque la solución esté a tres ediciones. *«¿podrías…?»* como consulta → si se puede y qué costaría; no hacerlo. *«dale», «hacelo», «seguí», «ok», «andá»* → recién ahí. La autorización es POR TRABAJO y no se estira: un «ok» a X no habilita Y ni lo que se me ocurre mientras hago X. Excepción única: una orden abierta de Liam («si encontrás algo más hacelo directo») vale hasta que ese trabajo termina. *Por qué:* salir corriendo le saca a Liam la decisión de las manos —él buscaba una solución, no pedía una— y gasta trabajo en una dirección que quizá no era la suya; pasó dos veces el mismo día en Vendamos (2026-08-06).
- **Disparador de regla general.** Cuando Liam corrige algo que se puede enunciar sin nombrar cliente, sección ni variante concreta, la sesión responde antes de seguir con la frase fija: «Esto parece una regla general de <diseño|trabajo>; propongo agregarla a <DISENO-REGLAS.md|PLAN.md § Cómo se trabaja> así: "<texto>". ¿Va?». Sólo entra con el sí de Liam; si dice no, se anota en el mismo archivo como «propuesta rechazada» con fecha, para no volver a proponerla. Las correcciones de un cliente o de un detalle puntual no se proponen.

## Secuencia y bloque abierto

Ver `C:/Users/liama/Desktop/Nichos/PLAN.md`.
