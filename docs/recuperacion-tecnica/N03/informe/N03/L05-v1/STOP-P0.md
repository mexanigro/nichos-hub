# STOP en P0 — arnés, no producto

RESULT: RED. Gates alcanzados0/4; P0 requiere controles viables y freeze. P1/P2/P3 no iniciados. Consumo observado74%, techo80% TOTAL N03; sin resets. No se agotó presupuesto: se aplica el detector de bucles ordenado por Liam.

Primer intento: resultados/l05-red/ESTADO.json registra Docker125 antes de ejecutar proceso. Faltaba /app/node_modules como punto de montaje dentro de la copia readonly. Se creó sólo el directorio vacío de la copia; no instalación ni cambio de producto.

Única continuación: resultados/l05-red-r2/ESTADO.json registra Docker1; el contenedor sí ejecutó el runner, pero ambos procesos fallaron con «Parse error /control/fixture.mjs:1:1». RESULTADOS.json contiene0 controles de arranque válidos y2 fallidos. stdout/stderr separados de ambos runtimes y disposición del contenedor preservados. No llegó a ejecutar el guard: este fallo NO reproduce el defecto de producto ni invalida el rojo previo del sondeo.

Hipótesis descartada: no falta el node_modules existente ni fue necesario instalar dependencias; el error inicial era el punto de montaje en copia readonly. Información nueva: el segundo intento falla al parsear el fixture del instrumento. La comprobación node --check inicial cubrió aceptacion-unidad.cjs, preload-l05.mjs y runner.mjs, pero omitió fixture.mjs. Es una omisión propia del control de sintaxis. No se probó aún la corrección exacta; no atribuirlo a producto, credenciales ni red.

No hubo avance material de la aceptación P0 en dos intentos. Se detiene sin tercera corrida ni corrección adicional. Las preimágenes físicas de server.ts/api/index.ts están en preimagenes-producto, la copia aislada reproduce332 fuentes del template y el producto sigue sin cambios. No se escribió tenant-access.ts. No freeze, tipos/paridad/mutación pendientes; no declarar preparación del arnés GREEN.

Retoma exacta del mismo ID, tras orden de continuar: preservar preimagen de fixture.mjs; corregir su sintaxis y ejecutar node --check sobre TODOS los .mjs/.cjs del arnés nuevo antes de Docker. Si pasan, una corrida nueva mediante ejecutar.ps1 -Nombre l05-red-r3 -Runner runner.mjs, conservando los dos resultados anteriores. Comprobar arranque real de ambos y el fallo funcional esperado del guard original; completar refutación/freeze de P0. Después implementar exclusivamente los tres archivos aprobados y continuar P1→P2→P3, con política ya aprobada y sin reiniciar reconocimiento ni repetir el sondeo.

Si esa continuación no produce avance, registrar el nuevo bloqueo y detenerse, sin ampliar diagnóstico. N03 sigue en curso; navegador y certificación remota permanecen pendientes. Las entregas aceptadas y condición previa al despliegue por prestaciones de tenant se conservan. Sin remoto, instalaciones, commit, push, deploy ni resets.
