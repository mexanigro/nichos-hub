# N03 clientId-v1 — GREEN local, para revisión

## Resultado y alcance

getAgentkitConfig en src/lib/notify-agentkit.ts y api/index.ts ahora resuelve CLIENT_ID→NEXT_PUBLIC_CLIENT_ID→VITE_CLIENT_ID→vacío, recortando cada candidato antes del fallback. Sólo AGENT_ENABLED=true permite notificar; URL/secret/id siguen necesarios. Se corrigen los casos autorizados NEXT solo,CLIENT blanco y N/V contradictorios: el agente usa id del servidor. README/.env.example documentan selección, coherencia entre build/servidor y permiso exacto. No se cambió .env real.

Sólo4 archivos autorizados:2 expresiones y documentación pertinente. Navegador/server.ts, firmas, URL/auth/mensajes/canales/payload salvo id conservados. Ningún módulo nuevo. No proyecto/base,precio,pagos,provisioning,envíos reales ni cambio de entornos. Coherencia de variables reales y condición previa al despliegue por prestaciones de tenant con evidencia/decisión de Liam permanecen pendientes.

[Contrato](CONTRATO-IMPLEMENTACION.md) y [freeze previo a producto](FREEZE.json). P0→P1→P2→P3:4/4; sin BLOCKERS de esta reparación. N03 sigue en curso. Se detiene para revisión; no se declara aceptación del usuario ni cierre de N03 completa.

## Evidencia ejecutada

- [Funciones](FUNCIONES-green-p2.json):142/142. Misma extracción AST actual del sondeo, conservando las18 entradas y referencia MEDICION.json. Ocho fallos RED previos de identidad corregidos;134 controles previos válidos y permisos/config incompleta conservados. Ausencia/false/valores inválidos del permiso y URL/secret/id ausentes/blancos:0intentos.
- [HTTP](resultados/green-p2/RESULTADOS.json):110/110;14 arranques efectivos en ambos runtimes reales (7 escenarios por runtime),contacto y CRM booked/cancelled/rescheduled. NEXT solo,CLIENT blanco y N/V distintos producen tenant-control,igual al servidor. Cada payload completo y path/auth observado coincide con baseline mirrors válido. Permisos denegados: cero agente, respuesta/email por evento coincidente con preimagen. Origen y autenticación conservados por runtime según lo efectivamente medido.
- Baseline antes de freeze: [payloads y resultados actuales](resultados/baseline-r2/OBSERVACIONES.json), [42 controles de permisos](resultados/baseline-permissions/RESULTADOS.json). Los casos antes omitidos se comparan con el mismo recorrido/datos y mirrors válidos, no con un payload previo inexistente. No se reescribió MEDICION.json.
- [Mutación aislada](MUTACION.json), [resultados](resultados/mutation-p3/RESULTADOS.json): selector original restaurado únicamente en copia física,12 fallos esperados (omisión NEXT/blancos e identidad N/V) y50 controles positivos. Los8 arranques del mutante aprobaron; ningún fallo de instrumento sustituye sensibilidad. Producto intacto tras mutación.
- [Tipos](TIPOS.json):exit0, configuración vigente con src/vite-env.d.ts, sin relajaciones. [Paridad](resultados/parity-p3-r2/PARITY.json):19/19,exit0; archivo existente sin cambios ni excepciones nuevas.
- [Conservación](CONSERVACION-FINAL.json):366 comprobaciones;331 de333 fuentes del template intactas y6 fuentes hub lint conservadas. En los dos archivos de código, el diff completo equivale exclusivamente a sustituir la expresión autorizada. Cuatro preimágenes físicas en PREIMAGENES-P1.json; manifiesto final FUENTES-FINALES.json. Servidor/browser/book/support/stock/health/L05 conservados; D05 sólo cambia selector autorizado del agente.

Docker se ejecutó con imagen existente,--pull=never,--network=none,filesystem readonly y env saneado, sin .env/credenciales reales; SDK y destinos controlados. ESTADO.json confirma proceso/exit del contenedor y DISPOSICION.json su eliminación. Docker0 en preflight-r2,baseline-permissions,green-p2,parity-p3-r2; Docker1 esperado en mutación. No confiar sólo en exit del lanzador PowerShell.

## Refutación y observación heredada

[BASELINE-Y-REFUTACION.md](BASELINE-Y-REFUTACION.md). Revisión interna independiente de /root/refutar_soporte (Harvey), sólo lectura de contrato/fuentes/diff y baseline, separada de revisiones externas aceptadas. MATERIAL: baseline comparable ante omisiones y emails por evento, incorporados antes del freeze. Revisión final de las4 preimágenes: sin BLOCKERS ni MATERIAL nuevos; no ejecutó pruebas.

El baseline de autenticación refutó una expectativa del arnés: POST/api/appointment/notify sin token es401/sin envío en server.ts, pero200/con envío en api/index.ts, que carece del requireAdminAuth local. El resultado original se conserva (baseline-r2 Docker1,16 aprobados/2 expectativas fallidas). Antes de freeze se fijó conservación por runtime a partir de esos hechos; no se modificó autenticación ni se afirma que API esté protegida. Es hallazgo heredado de acceso para N04, enlazado en ficha N03; queda pendiente, no se abre su reparación ni se oculta bajo este GREEN acotado.

Claridad: no funciones nuevas, flags nuevos ni usos artificiales. Las dos cadenas explícitas son iguales al selector servidor; docs explican prioridades distintas del navegador sin prometer reconciliación automática. Las diferencias reales de configuración siguen requiriendo revisión antes del despliegue.

## Ciclos y conservación de fallos

STOP-P0.md/ESTADO-STOP.json anteriores quedan históricos. Retoma autorizada creó copia/node_modules e incorporó mkdir al preparador; preimagen guardada. Preflight-r2 Docker0 acreditó la corrección. Baseline inicial10s no arrancó; única corrección a45s de D05 produjo ambos arranques y8payloads, conservando fallo anterior. Su diferencia auth fue resultado medido que corrigió un criterio antes de freeze, no error de imports ni cambio de producto.

P1 produjo142 controles GREEN y tipos0. P2 obtuvo110 HTTP. Paridad inicialmente carecía del archivo test en copia: añadido desde fuente intacta, imports comprobados, única continuación19/19. Preparación de mutación duplicó tsconfig ya presente en manifiesto: EEXIST conservado, única corrección deduplicó rutas y verificó hash de copias parciales; mutación efectiva12fallos. Cada corrección tuvo información concreta y produjo avance verificable. No se repitió indefinidamente la misma estrategia ni se aflojó aislamiento. Todos los resultados/preimágenes previos se conservan.

## Límites y retoma

GREEN exclusivamente local de selección/notificación examinada. No certifica entrega al agente, persistencia/remoto, clientes reales,coherencia build/runtime,auth íntegra ni proyecto/databaseId. N03 conserva obligaciones restantes y destinos ya registrados; N04 acceso/datos, N08 configuración/despliegue, y decisión previa por prestaciones de tenant. No se ejecutaron instalaciones,operaciones remotas,commit,push,deploy o resets.

Consumo: inicio76%, checkpoints/final77%, techo80% TOTAL N03 compartido. No retoma técnica pendiente en clientId-v1; detener para revisión de esta reparación. No iniciar otra.
