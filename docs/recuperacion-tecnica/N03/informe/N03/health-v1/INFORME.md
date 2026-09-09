# N03 health-v1 — cierre exclusivamente local


**Estado vigente: health-v1 cerrada localmente con SP-H01 resuelto — GREEN, 4/4.** Límite original restaurado antes de readiness; exceso429 sin nuevas cargas/lecturas; live sin cuota ni DB.207controles GREEN, tipos0, paridad3/3 y mutación4fallos esperados. La revisión previa omitió la pérdida del limitador por el cambio de orden; queda documentada y corregida. [Contrato actualizado, evidencia y límites](SP-H01/INFORME.md). N03 sigue en curso; book/support/stock conservadas. Los cierres anteriores que siguen son evidencia histórica, subordinada a esta adenda.

RESULT: GREEN. Gates P0–P3: 4/4. N03 completa sigue en curso. Orden vigente: arranque y salud del producto base sin configuración IA/agente, máximo total74%, sin resets; consumo consultado al inicio69%, checkpoints70% y cierre70%.

## Resultado

server.ts se ejecutó como entrada CLI real en modo producción. api/index.ts se importó completo y atendió HTTP a través de su exportación real. Ambos arrancan sin claves LLM ni configuración de agente. Gemini es opcional en el diagnóstico API. Las señales se registran antes del bootstrap funcional y un fallo temprano/tardío impide que rutas parcialmente registradas parezcan utilizables.

- GET /api/live: 200/status ok indica proceso atendiendo; no consulta la base.
- GET /api/health: 200/status ok exige bootstrap completo y lectura Admin SDK del documento clients/{tenant} existente, activo/trial/maintenance. Ausencia, fallo, documento no operativo o inicialización pendiente/fallida producen503/status unavailable. Sin identificador tenant, credenciales o detalles de error en respuesta. Plazo1500ms cubre carga y lectura, sin prometer cancelar SDK; una sonda colgada permanece compartida, sin multiplicarse. No hay caché positivo obsoleto.
- Consumidor real monitor-agent/src/checks/apiCheck.ts comprobado con transporte/registro controlados: acepta éxito y rechaza503. Su fuente y los consumidores de las entregas anteriores permanecen intactos.

Esta disponibilidad es la capacidad acotada de bootstrap + lectura del tenant por Admin SDK. No certifica escrituras, REST, reservas, UI completa, transacciones, reglas ni disponibilidad remota. No se unificaron selectores o políticas de tenant.

## Siete fases y evidencia

1. Reconocimiento: imports/configuración de arranque, salud y consumidor real; health constante, requisito Gemini y catch posterior al registro explicaban falsos positivos. Fuentes iniciales330 y preimágenes conservadas.
2. Plan finito: [PLAN.md](PLAN.md), tres archivos de producto, cuatro gates.
3. Acceptance RED: [red-contrato](resultados/red-contrato/RESULTADOS.json), 15PASS/38FAIL, arranque real de ambos. Corridas anteriores conservadas como diagnóstico del instrumento.
4. Refutación: [procedencia](FREEZE.md) y [revisión final](REVISION-FINAL.md); materiales integrados antes de producto.
5. Freeze: [huellas](CONTRATO-HUELLAS.json), verificadas sin cambios al cierre.
6. Implementación: módulo compartido runtime-health, integración bootstrap en server/api, Gemini opcional y errores públicos genéricos. P1 tipos0; P2 [99/99](resultados/green-r2/RESULTADOS.json), [incompleta13/13](resultados/incompleta/RESULTADOS.json); [mutación](resultados/mutacion/RESULTADOS.json)11PASS/2FAIL esperados al desarmar sólo la condición de bootstrap en copia: ambos falsos200 detectados. Los controles positivos siguen pasando.
7. P3/cierre: [tipos exit0](resultados/TIPOS-final-ESTADO.json), paridad pertinente [2/2](resultados/PARIDAD-r1.txt) + [1/1 imports](resultados/PARIDAD-imports.txt), [conservación rutas](RUTAS-CONSERVADAS-AST-r2.json), [auditoría final](AUDITORIA-CIERRE.json), [sello](SELLO-CIERRE.json). Las tres entregas aceptadas no se rehacen: sus handlers/consumidores y registros conservan evidencia vigente; otras rutas37/40 y loader API se compararon por AST.

El arnés incluye src/vite-env.d.ts desde el inicio y hereda opciones originales, sin relajarlas. Cada corrida guarda stdout/stderr, exit, timeout y disposición del contenedor. Configuración sintética, sin .env ni credenciales reales; red externa bloqueada, imagen local fija, sin instalaciones. Cero intentos externos observados en los escenarios del producto; control del observador bloqueó y contó una URL sintética externa. Contenedores propios eliminados; sin operaciones remotas, commit, push, deploy ni reset.

## Custodia y continuidad

[Preimágenes](CUSTODIA-CIERRE.json), [fuentes finales](FUENTES-CIERRE.json), HEAD46345f4505756599d69ae6cbc9d588271aba6b65 sin cambio; status conserva trabajo previo y añade únicamente runtime-health.ts. La copia ejecutada equivale por AST a producto final; diferencia posterior exclusiva de comentarios documentada. Ningún bloqueo o pendiente en health-v1. Book-v1, support-v1 y stock-v1 conservadas. Resto de N03 y verificaciones remotas permanecen pendientes en sus etapas; no se inicia otra reparación.
