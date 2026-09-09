# clientId-v1 — contrato autorizado de reparación mínima

Objetivo y decisión de Liam: getAgentkitConfig de src/lib/notify-agentkit.ts y api/index.ts resuelve CLIENT_ID.trim()→NEXT_PUBLIC_CLIENT_ID.trim()→VITE_CLIENT_ID.trim()→vacío. Permiso exacto AGENT_ENABLED=true sigue obligatorio. Sin identidad/URL/secret, no notificar. Se aprueban los nuevos intentos sintéticos para NEXT solamente y CLIENT blanco; N/V contradictorios eligen N como servidor. No se activan servicios ni envíos reales.

Alcance cerrado: esas dos expresiones y documentación pertinente en README.md/.env.example. Conservar firmas, navegador/servidor, URLs/auth/mensajes/canales y todo payload salvo id corregido. No nuevo módulo, proyecto/base/coherencia real/pagos/provisioning, .env real, instalación/remoto/commit/push/deploy/reset. Techo80% TOTAL N03; reservar cierre. N03 continúa abierta y prestaciones/coherencia por tenant antes de despliegue pendientes.

## Plan y gates

- P0: corregir punto de montaje, preflight completo y baseline sobre preimagen; resolver MATERIAL y freeze mediante huellas antes de producto. Observable: preflight Docker exit0/estado0 y arranque HTTP de ambos runtimes con payloads previos disponibles; códigos del baseline conservados explícitamente; funciones actuales reproducen RED esperado, no error de instrumento.
- P1: dos expresiones y documentación con preimágenes verificadas. Observable: diff exclusivamente autorizado, sin código accesorio.
- P2: funciones/matriz HTTP en ambos runtimes realmente arrancados/registrados. Observable: mismo id que servidor para todos los candidatos válidos, conservación previa y destinos simulados correctos.
- P3: mutación aislada restaura selector original y hace fallar NEXT/blancos/conflicto; tipos/paridad pertinentes, claridad, conservación y registros. Cierre local sólo con aceptación GREEN y detener revisión.

## Aceptación objetiva

1. control-funciones.cjs reutiliza la extracción AST existente sin ejecutar/sobrescribir sondeo; las18 entradas de MEDICION.json conservan id navegador/servidor y headers. Agent elegido debe igualar servidor o ser null si vacío. Los casos sin cambio previsto comparan objeto previo completo, no expectativas inventadas. RED previo: FUNCIONES-red-p0.json,134 pass/8 fallos de identidad esperados.
2. En ambas funciones, permiso ausente,false,TRUE," true ",1,vacío y URL/secret ausentes/blancos o ids ausentes/blancos devuelven null,false y0intentos; fixtures sólo sintéticos. Se conservan las24 comprobaciones aprobadas mientras no cambie su dependencia; al cambiar selector se repite control afectado.
3. runner-http.mjs arranca server.ts y api/index.ts completos en Docker local --network=none, con /app readonly, env -i, sin .env, SDK/destinos controlados. Comprueba Docker ESTADO.json y disposición, no sólo exit del lanzador. POST/api/contact y POST/api/appointment/notify booked/cancelled/rescheduled realmente registrados generan cuatro payloads esperados con mirrors válidos. Origen ajeno rechaza sin enviar; autenticación conserva la respuesta y efecto de cada runtime medidos en la preimagen. Permisos denegados conservan respuesta base/email por evento y cero agente. Cualquier fallo de arranque/instrumento impide usar la corrida como RED del producto.
4. Baseline de mirrors previo a producto y freeze conserva payloads completos, destino/path y autenticación sintética observada. Donde no había payload previo (NEXT/blancos), se compara mismo evento/datos contra ese baseline válido. Escenarios de reparación: NEXT solo,CLIENT blanco,N/V contradictorios; mirrors positivo y permisos ausente/false/inválido. No se deduce que un evento omitido tuviera un payload para comparar.
5. Mutación sólo copia aislada: restaurar selector previo en ambos puntos, ejecutar los casos afectados y verificar fallos de identidad/conteo/payload sin fallos de arranque. Producto no mutado. Tipos con configuración existente y vite-env.d.ts, paridad pertinente; no repetir suites book/stock/support/browser completas cuyo contrato no cambia.
6. Conservación de fuentes aceptadas por huella, preimágenes de los4 archivos antes de modificar; AST/diff confirma única expresión por función y documentación de selección. Revisar claridad y afirmaciones. Registrar resultados nuevos sin sobrescribir previos.

## Refutación incorporada y frontera de evidencia

Revisión interna Harvey previa, sólo lectura: MATERIAL baseline comparable cuando antes no había intento y permisos/config incompleta. Cubiertos explícitamente arriba y por controles preparados. No debe confundirse notificar simulado con persistencia/entrega remota ni permisos reales. Fuente aprobada sigue PROPUESTA.md; MEDICION.json/preimágenes preservadas.

Preparación anterior STOP-P0.md se conserva como historia. Esta retoma crea el punto vacío node_modules en la copia y lo incorpora al preparador. Docker preflight-r2 pasa; baseline inicial con10s no acreditó arranque y se conservó. Se permite una única corrección de plazo a45s, igual al D05 reutilizado. El freeze sólo puede registrarse después de baseline válido, no por esta prosa. Un nuevo fallo sin avance exige STOP; RED esperado del selector permite implementar.
