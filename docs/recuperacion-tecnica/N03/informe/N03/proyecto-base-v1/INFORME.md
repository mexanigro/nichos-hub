# Proyecto/base Admin y REST general — preparación para revisión

**Preparación GREEN, P0→P3 4/4. Compatibilidad demostrada sólo bajo condiciones; decisión puntual pendiente antes de una reparación. Producto intacto. No se descuenta ningún pendiente.**

## Evidencia

[Contrato congelado](CONTRATO.md), [matriz de 35 casos](MATRIZ.md), [capturas completas](resultados/RESULTADO.json): 175 filas y 556 comprobaciones. Se ejecutaron las funciones extraídas por AST de las fuentes actuales, no una réplica de sus selectores. Admin SDK instalado y Firestore reales; cert RSA sintético generado en memoria, registro real de aplicaciones aislado en cada caso. Se intercepta getFirestore para observar su resultado real y DocumentReference.get delega a getAll interceptado: proyecto, base y ruta realmente construidos. REST ejecuta sus helpers con fetch interceptado y token sintético presente/ausente; quedan URL y método efectivos.

| Hallazgo | Resultado comprobado |
| --- | --- |
| Nueva app y proyectos coincidentes | Admin server y API seleccionan project-a/default; POST, GET y PATCH REST construyen ese mismo destino. |
| App existente coincidente | Se reutiliza su nombre real y su destino; no se inicializa otra. |
| App existente ajena, o ajena antes que correcta | Admin usa project-b de la primera app; REST sigue project-a. No se deduce de FIREBASE_ADMIN_PROJECT_ID. Invertir el orden cambia el destino Admin. |
| Variables de proyecto contradictorias | Admin nuevo usa FIREBASE_ADMIN_PROJECT_ID; REST el primer valor no vacío tras trim entre FIREBASE, VITE y NEXT_PUBLIC. El resultado puede diferir. |
| Base ausente/vacía/blancos | Ambos usan literal default; VITE es fallback. FIREBASE válida gana a VITE contradictoria. (default) explícita es distinta de default. |
| Proyecto/email Admin ausente/vacío/blancos | null y cero lecturas. Una app existente tampoco evita el retorno si falta el proyecto Admin. |
| Clave Admin ausente/vacía | null, cero lecturas. Clave en blancos con nueva app falla cert; con app existente se reutiliza sin parsear esa clave. |
| REST sin token o sin proyecto | Create retorna sin operación; Get/Patch lanzan errores específicos sin operación. |
| Respuestas interceptadas 404/403 | GET404 retorna null; PATCH404 y GET/PATCH403 fallan; Create registra error y retorna. No se confundieron con configuración ausente. |

Los proyectos y emails son sintéticos; no se conservaron claves ni tokens. `resultados/ejecucion-r2.log` y exit-r2=0 respaldan GREEN. Las tres variantes aisladas de funciones reales modifican sólo el instrumento: server/api evitan reutilización y producen RED atribuible a la app seleccionada; REST cambia el proyecto y produce RED en URL. Se conservan logs y exit=1. Los controles adicionales que alteran capturas son sensibilidad del instrumento, no evidencia de una reparación. No se modificaron expectativas para obtener GREEN.

Primera corrida: comprobaciones alcanzadas, fallo posterior al exportar la versión por package.json no exportado. Se conserva sondeo-r1 y log; la segunda lee el manifiesto instalado directamente. Un intento de edición PowerShell falló al parsear, sin ejecutar escritura; se corrigió el mecanismo. No hubo cambio de producto ni ampliación de alcance.

## Límites

Se prueba selección local de dos accesores Admin y tres helpers REST general del template. El contexto REST se ejecuta dentro de GET/PATCH. No se importa el servidor completo ni se certifica el wiring de cada endpoint, todas las inicializaciones posibles, ADC/identidades reales, OAuth, permisos, existencia de proyecto/base, acceso remoto, aislamiento ni persistencia. Leer una referencia con getAll interceptado NO es una lectura Firestore remota. La matriz usa certificados sintéticos; no cubre todo tipo de credencial o app inválida. Docker --network=none, entorno vacío, sin instalación ni red. Fuentes, dependencias y producto en lectura; únicos archivos nuevos son expediente e instrumentos locales.

[Conservación](CONSERVACION.json): 623 archivos de producto intactos y seis fuentes/dependencias verificadas; contrato y casos sin cambios. Entregas aceptadas no se reabrieron. No corresponde repetir tipos/lint de producto sin cambios.

## Recomendación concreta y decisión necesaria

Las decisiones N01 y el balance no establecen que Admin y REST puedan apuntar a proyectos distintos para este subconjunto, ni fijan una prioridad común. Por eso no corresponde declarar un defecto universal ni imponer unificación. **Recomiendo aprobar esta regla acotada: cuando ambos selectores producen un destino, exigir coincidencia de proyecto/base; contrastar además la app Admin existente con el proyecto Admin configurado y rechazar discrepancias antes de operar, sin escoger silenciosamente otro proyecto ni recrear aplicaciones. Conservar los retornos actuales de configuración incompleta y ausencia de token; no prohibir por inferencia configuraciones Admin-only/REST-only.**

La decisión puntual es si esa compatibilidad es obligatoria para este subconjunto. Si se aprueba, la propuesta mínima siguiente sería preparar el control explícito de compatibilidad y su rechazo conservando las selecciones actuales en casos coherentes; la matriz de app ajena y proyectos contradictorios ya identifica los casos RED pertinentes. No se autoriza ni ejecuta esa reparación aquí. Si la separación es intencional, hace falta identificar el caso permitido y su destino; no ampliar ni escoger política sin Liam.

Podría descontarse posteriormente **sólo selección local de proyecto/base en getAdminDb, loadAdminFirestore y los tres helpers REST general**, tras regla aprobada, evidencia compatible/guardas según corresponda y aceptación local. No toda RE-EXT-02/03, RE-01 o AR-N01: browser, otros accesores, propagación y consumidores quedan según balance. clientId aceptado permanece intacto.

N03 abierta. Techo90% TOTAL compartido, inicio86%, cierre observado87%, último10% reservado N04; sin resets, credenciales reales, instalaciones, efectos externos, push ni deploy. N04/N08/N10 y otras etapas posteriores conservadas, al igual que la condición de prestaciones por tenant antes del despliegue.
