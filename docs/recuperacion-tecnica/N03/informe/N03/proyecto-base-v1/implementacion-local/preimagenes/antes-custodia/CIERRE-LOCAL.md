# Proyecto/base — reparación local para revisión

**RESULT: GREEN local. GATES: P0→P3, 4/4. No descontado; N03 abierta.**

## Alcance autorizado y resultado

Liam aprobó exigir coincidencia de proyecto/base cuando ambos destinos estén definidos y rechazar una app Admin de proyecto efectivo incompatible. Autorizó exclusivamente los dos accesores Admin y REST general/contexto en server.ts y api/index.ts. El [contrato aprobado congelado](CONTRATO.md) continúa el contrato preparatorio conservado; [FREEZE](FREEZE.json) fija casos y arnés antes de producto. No quedan decisiones de política pendientes en este alcance.

- getAdminDb y loadAdminFirestore conservan la selección de app y base; antes de entregar db verifican proyecto efectivo del SDK contra Admin configurado y REST configurado cuando existe, y base efectiva contra la seleccionada. No se elige otra app/proyecto ni se recrea una app para evitar el rechazo.
- firestoreRestCreate y getFirestoreRestContext conservan sus retornos previos por token/proyecto ausente; si hay proyecto Admin definido distinto del REST seleccionado, rechazan antes de fetch. GET/PATCH usan ese contexto sin cambios propios. Create conserva catch/log y retorno undefined; su rechazo se acredita mediante registro específico y cero solicitudes.
- Los dos consumidores resuelven la base con el mismo selector existente. Se conserva literalmente default frente a (default), sin normalización. Un proyecto Admin definido participa en la comparación REST aunque falten sus credenciales; proyecto Admin ausente no se infiere de una app existente. No se exige configuración dual.

No se modificaron otros consumidores, clientId, dependencias, escritores ni entregas aceptadas. La comprobación por AST y bytes demuestra que todo lo exterior a esas cuatro funciones sigue idéntico.

## Controles y evidencia

| Gate / control | Resultado observable |
| --- | --- |
| P0, RED antes de producto | 44 casos fijos, 697 comprobaciones, 58 fallos pertinentes: lecturas/set Admin y solicitudes REST incompatibles aún posibles. Fuentes y preimágenes preservadas. |
| P1, reparación | Guardas dentro de los dos archivos autorizados; ninguna selección alternativa ni recreación. |
| P2, contrato final | 44 casos, 220 observaciones, 697 comprobaciones GREEN. 20 observaciones prohibidas con cero operaciones. 200 observaciones de conservación idénticas al RED inicial. |
| P2, sensibilidad | Quitar guarda server: 21 fallos y 7 controles con operaciones prohibidas; API:21/7; Create:4/2; contexto:12/4. Cada variante aplica exactamente una eliminación AST sobre función real; exit1 atribuible, no importación ni nombre de app. |
| P2, tipos/lint | tsc --noEmit sobre ambos archivos y dependencias transitivas, exit0. El script lint de este proyecto es tsc --noEmit; no se declara una suite global distinta. |
| P2, conservación | Inventario623: sólo server.ts y api/index.ts cambiaron; otros621 conservados. Fuera de las cuatro funciones, igualdad byte a byte. Contrato/casos/instrumento congelados intactos. |
| P3 | Acta, refutación independiente, registros, preimágenes y archivo local para revisión. Ningún descuento. |

[RED](resultados/red/RESULTADO.json), [final GREEN](resultados/final/RESULTADO.json), [conservación y mutantes](CONSERVACION.json), [tipos/lint](TIPOS-LINT-FINAL.json). Salidas, comandos y exit de cada corrida están en sus carpetas de resultados. Las observaciones incluyen proyecto/base de la instancia SDK, lectura de referencia y set serializado por WriteBatch real antes del commit interceptado; REST conserva URL, método y cuerpo. SDK y registro de apps son reales e instalados; claves RSA y tokens son exclusivamente sintéticos en memoria. Docker sin red, sin entorno anfitrión y con producto/dependencias de sólo lectura.

Se conserva la distinción entre app de igual nombre con projectId efectivo distinto y app cuya credencial difiere pero el proyecto explícito efectivo coincide. Se cubren apps nuevas, existentes y múltiples; ausencia, vacío, blancos, fallbacks y contradicciones; Admin-only/REST-only; retornos incompletos; token ausente; respuestas 404/403. La base distinta inyectada en la frontera SDK utiliza una instancia real de otra base: es un control adverso, no un incidente natural probado.

## Ajustes durante ejecución y límites

El primer editor se detuvo por finales de línea mixtos antes de escribir API, después de escribir server. La corrida parcial RED37 se conserva en resultados/green como intento no final. Se corrigió únicamente el mecanismo de edición API y se obtuvo GREEN. Tipos detectó que projectId existe en el SDK instalado pero no en su declaración pública Firestore; se usa comprobación de propiedad en ejecución, sin any ni aserción que invente el valor. Las preimágenes de antes de ese ajuste y el diagnóstico original se conservan; el contrato no cambió.

**Límite de compatibilidad SDK:** projectId es un getter interno del runtime instalado. El acceso comprueba su presencia y sólo admite igualdad exacta; si falta o el getter no puede resolverlo, el acceso no entrega db utilizable. Esto evita operar con un destino desconocido, pero no garantiza compatibilidad futura de otra versión del SDK. No se modificaron dependencias. No se probaron ADC/credenciales reales ni descubrimiento remoto de proyecto.

Las funciones de producto se extrajeron por AST y ejecutaron con SDK real y fronteras interceptadas; no se levantó todo el servidor ni se certificaron permisos, OAuth, proyectos/bases existentes, escritura persistida o recorridos remotos. Ninguna conclusión descuenta otros accesores, browser, pagos, kill-switch como superficie independiente, propagación o la familia RE-EXT completa. No corresponde repetir entregas aceptadas sin cambios pertinentes.

La siguiente acción es exclusivamente revisión/aceptación local de este subconjunto. No se prepara otra reparación. N03 sigue abierta. Techo90% TOTAL compartido; observado87%, último10% reservado N04. Sin resets, instalaciones, credenciales reales, efectos externos, push ni deploy. Etapas posteriores y condición de prestaciones por tenant antes del despliegue intactas.
