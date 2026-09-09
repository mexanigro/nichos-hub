# N03 — preparación de autenticación appointment/notify

**Cierre local aceptado por Liam.** [Aceptación y revisión externa del segundo pensamiento, separada de Harvey](ACEPTACION-Y-REVISION-EXTERNA.md). Dos instrucciones/332fuentes conservadas,HTTP270,mutación90;tipos y9casos reejecutados por revisión externa. Reparación descontada de N03. N04 identidad/entorno reales y condición de prestaciones por tenant vigentes; N03 sigue abierta.

**Reparación ahora GREEN local4/4, para revisión.** [Cierre y evidencia](CIERRE-LOCAL.md):270HTTP,tipos0,paridad19,mutación90fallos esperados sin error de instrumento. Sólo dos instrucciones en api/index.ts; revisión externa de preparación separada de Harvey. N03 abierta,N04 identidad/entorno reales y prestaciones por tenant antes de deploy pendientes. Consumo78%/80%TOTAL,sin resets. Preparación inferior histórica, conservada.

Preparación terminada para decisión. Reparación todavía RED y sin implementar. N03 abierta. [Propuesta única, plan P0→P3 y aceptación](PROPUESTA.md). Sólo falta autorizar la conexión del guard existente; no falta decidir una política de roles nueva. No hay freeze de implementación ni edición de producto.

## Medición y resultado

Reutilizado el montaje y dependencias comprobadas de clientId-v1, sin reconstruirlos. [Preflight](../clientId-v1/resultados/auth-preflight-v1/PREFLIGHT.json): sintaxis de todos los .mjs/.cjs del directorio, dependencias TSX/Express/TypeScript, lectura/escritura básica del fixture y compilación del consumidor. Docker exit0 comprobado por inspect, no sólo por PowerShell.

[Baseline](../clientId-v1/resultados/auth-baseline-v1/RESULTADOS.json): 84 solicitudes de la ruta, 198 controles, 138 aprobados y 60 fallos funcionales esperados. Cuatro arranques reales: server y API, cada uno con agente true/false. Cero fallos de instrumento. En API, cinco casos adversos × tres acciones × dos modos = 30 peticiones aceptadas indebidamente; cada una falla status esperado y ausencia de efectos. Server rechaza las mismas 30; origen ajeno rechaza en ambos. Casos adversos: token ausente, inválido, JWT válido de tenant ajeno, usuario sin registro y correo no verificado. Los resultados completos conservan cuerpos y efectos observados.

Con agente habilitado, el defecto permite notificar al destino agente simulado; con agente deshabilitado permite email y registro de notificación. No se confunde cero agente con cero efectos. Los 12 positivos de reserva, cancelación y reprogramación tuvieron éxito. Se ejecutan los exports reales del consumidor, obteniendo sus cuerpos y Bearer, y se pasan a la ruta HTTP registrada. No se afirma haber montado toda la UI CRM ni probado sus escrituras Firestore directas.

Tras refutación se amplió exclusivamente la captura email y la comparación de conservación. [Referencia nueva](../clientId-v1/resultados/auth-reference-v1/OBSERVACIONES.json): sólo los 12 positivos afectados, 54/54 controles, cuatro arranques y Docker0. [Comparación con referencia previa](CONSERVACION-REFERENCIA.json): 12/12 conservan respuesta y eventos ya observables; se agrega el cuerpo email completo. No se inventó esa expectativa ni se descartó el baseline RED. El runner final verifica método POST, cuerpos exactos 401/403 y, en selección full futura, igualdad de request/respuesta/eventos contra esta referencia por runtime, acción y permiso de agente.

Ambas corridas usaron imagen existente, --pull=never, --network=none, filesystem readonly, configuración sintética, claves efímeras en /tmp del contenedor, sin .env real. Los destinos de notificación fueron interceptados; observador positivo registró agente/email y no hubo intentos externos no controlados. ESTADO.json: baseline exit1 esperado, referencia exit0; timeout=false y contenedores eliminados según DISPOSICION.json. Los mocks no certifican entrega remota ni persistencia real. La ventana de observación local es150ms después de cada respuesta, con dependencias simuladas inmediatas; no se generaliza a proveedores reales.

## Refutación y suficiencia para construir

Procedencia interna: Harvey, /root/refutar_soporte, revisión independiente sólo lectura de propuesta, guard/lookups, consumidor, handler y resultados en esta conversación. No ejecutó pruebas ni modificó fuentes. Separada de la revisión externa de clientId trasladada por Liam.

- BLOCKER del parche: ninguno encontrado. Las dos instrucciones reutilizan la autorización existente y preceden el consumidor. No habilitan roles nuevos ni alteran REST/SDK.
- MATERIAL: positivos sin comparación completa, email sólo destinatario/asunto, método y cuerpos genéricos sin control exacto. Resuelto en runner/preload-auth; positivos ampliados54/54 y referencia previa12/12. Cuerpos exactos server también constan en baseline; la futura corrida final los exigirá en ambos. Comparación final sobre API reparada permanece pendiente de implementación.
- MATERIAL: mutador normalizaba saltos mixtos de API (10CRLF y5296LF), invalidando la conservación. Resuelto con retirada del segmento exacto; [comprobación ejecutada](MUTACION-PREPARADA.json) exit0 inserta y retira en memoria sobre API original y recupera igualdad exacta de bytes. Preimágenes del mutador conservadas. La mutación HTTP sobre la reparación final sigue pendiente en P3, no se simula como cumplida.
- NON-BLOCKING: prosa heredada sobre fallback admin difiere del guard efectivo; roles/status heredados, entrega remota, identidad real y aislamiento Firestore directo no son cambios de esta ruta. No justifican ampliar alcance. El contraste se basa en código y consumidor, no en esos comentarios.

Suficiencia para autorizar construcción: obligación y consumidor identificados; población finita de tres acciones y dos runtimes; RED específico con positivos y arranque efectivo; referencias medidas antes de cambiar producto; instrumentos viables y mutación preparada; riesgos materiales de conservación resueltos. Lo que sólo puede demostrarse tras el parche queda exigido en P2/P3 y bloquea el cierre de reparación. Vía compacta propuesta: única autorización de ejecución para el cambio acotado y contrato; no equivale a aprobación ya otorgada.

## Conservación, ciclos y continuidad

[FUENTES-P0.json](FUENTES-P0.json): 333 fuentes del producto y copia coinciden con el manifiesto aceptado clientId-v1. Preimágenes físicas de API/server/guard/consumidor guardadas. No se editaron selectores ni entregas aceptadas; no se repitieron sus suites. Tipos y paridad pertinentes quedan para P2, con arnés existente que incluye src/vite-env.d.ts. Paridad estructural sola no detecta este defecto de auth.

Ciclo1: preflight válido y RED funcional nuevo de las tres acciones; avance medible. Ciclo2: referencia email completa,54 positivos y mutador comprobado por bytes; resolvió hallazgos materiales. No hubo fallo de instrumento en las corridas; no se encadenó una estrategia fallida. Fallos históricos de clientId y baseline198 siguen intactos. Un parche editorial rechazado por ancla incorrecta no escribió archivos y se corrigió con lectura exacta; no se presentó como evidencia funcional.

[Aceptación externa de clientId-v1](../clientId-v1/ACEPTACION-Y-REVISION-EXTERNA.md) integrada separada de Harvey. Corrección explícita de destino: esta reparación LOCAL pendiente es N03; N04 conserva certificación de identidad/entorno reales. No se cierra N03 ni se modifican obligaciones ajenas. Prestaciones por tenant antes del despliegue siguen requiriendo evidencia y decisión de Liam. Registros actualizados con preimágenes en CUSTODIA-REGISTROS.json e historial nuevo, conservando entradas anteriores.

Consumo observado inicial/checkpoints77%, techo80% TOTAL N03; sin resets. Sin instalaciones, operaciones remotas, cambios de entornos reales, commit, push o deploy.

Retoma única: autorizar PROPUESTA.md; confirmar huellas y presupuesto, freeze de contrato, preimagen de API y copia-auth-green nueva, insertar sólo guard existente, ejecutar runner full y comparación de baseline, tipos/paridad, mutación aislada y revisión final. Detenido para esa revisión; preparación completa, reparación0/4.
