# Aceptación local — proyecto/base Admin–REST

Liam acepta localmente la compatibilidad proyecto/base exclusivamente en getAdminDb (server.ts), loadAdminFirestore (api/index.ts), firestoreRestCreate, firestoreRestGetDocument y firestoreRestPatchDocument, incluido getFirestoreRestContext. Se descuenta sólo esa conexión local; no toda RE-EXT-02/03, RE-01 ni AR-N01.

Se conserva la política aprobada: coincidencia cuando ambos destinos están definidos; rechazo de app Admin cuyo proyecto efectivo sea incompatible; no imponer configuración dual, cambiar fallbacks ni confundir default con (default). Retornos por configuración incompleta/token ausente conservados.

Evidencia aceptada, no repetida: [acta](../implementacion-local/CIERRE-LOCAL.md), [custodia final](../implementacion-local/CUSTODIA-FINAL.json) y [revisión independiente](../implementacion-local/REVISION.md). 44 casos,697 comprobaciones GREEN;200 observaciones conservadas,20 prohibidas sin operaciones,cuatro mutantes RED y tipos/lint0. CAMBIOS.json anterior a tipos es histórico; gobiernan hashes de CUSTODIA-FINAL.

Límite vigente: projectId es getter interno del SDK instalado. La guarda verifica presencia/igualdad y no entrega db utilizable si no puede conocer el destino; no garantiza compatibilidad con futuras versiones. No se certificaron ADC/identidades reales, OAuth, permisos, existencia de bases, persistencia ni recorridos remotos. No se ejecutó servidor completo: funciones extraídas por AST con SDK real y operaciones interceptadas. No extender el descuento a otros accesores, browser, pagos, kill-switch como superficie independiente o propagación.

Gates documentales: P0 custodia vigente/preimágenes; P1 aceptación y balance descontado sólo en alcance; P2 propuesta única y archivo/verificación. No suites ni producto en este turno. N03 abierta; techo90% TOTAL compartido, observado88%,último10% reservado N04; sin resets, instalaciones, efectos externos, push ni deploy. Etapas posteriores y condición de prestaciones por tenant antes del despliegue intactas.
