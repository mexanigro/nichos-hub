# N03 W-NEXT-v1 — migrar la convención middleware a proxy

**W-NEXT: preparación comparativa GREEN local4/4; implementación pendiente y NO ejecutada.** Next/NextAuth/auth.config reales:middleware y proxy conservan129 resultados HTTP;mutación de proxy rompe exactamente14 rechazos,registro/matcher y demás resultados intactos. Recomendar únicamente renombrado futuro con bytes idénticos,tras autorización específica. Copia mínima/Linux/webpack,no OAuth real/app completa/deploy. N03 sigue en curso;entregas aceptadas y obligaciones restantes intactas. Consumo80%/techo85% TOTAL,sin resets. Esta adenda sustituye el pendiente de comparación de los cortes inferiores, no autoriza migración. [Resultado,evidencia y límites](comparacion-local/INFORME-COMPARATIVO.md).

**Orden posterior de Liam: sólo preparación pendiente.** W-NEXT NO está autorizado para implementación. La compatibilidad real middleware/proxy con Next/NextAuth/authConfig y sesiones sintéticas debe compararse en copia aislada antes de proponer cualquier cambio de producto. Esta sesión se cierra sin renombrar ni continuar esa validación. [Retoma vigente](../cierre-sesion-v1/RETOMA.md). Techo85% TOTAL N03, sin resets; las invitaciones inferiores a autorizar movimiento directo no sustituyen esta secuencia.


Preparación exclusivamente; producto sin modificar. N03 abierta, consumo79%/techo80%TOTAL, sin resets.

## Pendiente original y defecto comprobado

El balance vigente conserva W-NEXT como deuda local heredada de N02. El diagnóstico era una advertencia de convención obsoleta, no un fallo funcional de autenticación. Se reutiliza el build histórico N02/docker-p1-p2-v2/resultados/build-hub/stderr.txt; no se repite el build completo.

Vigencia: src/middleware.ts todavía existe y no hay proxy hermano; package declara Next^16.2.5 y la dependencia instalada es16.2.9. Su detector de build reconoce middleware y emite la advertencia; reconoce proxy como sustituto y rechaza coexistencia. [Medición](MEDICION.json): fragmento exacto del detector instalado ejecutado aisladamente sobre inventario local, advertencia reproducida; diez casos del callback actual caracterizados sin red. [Fuentes/preimágenes](FUENTES.json). No se presenta este sondeo como build o registro HTTP real.

Consumidor pertinente: Next descubre el archivo especial y ejecuta su export default, que es auth(callback) de NextAuth con authConfig. El callback permite rutas públicas y prefijo de agente con header, exige email owner para las restantes, devuelve401 en API y redirige páginas a/login. config.matcher excluye assets. Se conserva todo esto, incluidas excepciones existentes; no se rediseña autorización ni se certifican como seguros todos los prefijos actuales.

## Única reparación propuesta

Renombrar **src/middleware.ts → src/proxy.ts del hub**, conservando exactamente los bytes del archivo: default export ya es admitido por el analizador instalado de Next. No cambiar auth.config.ts, matcher, listas de rutas, permisos, variables, paquetes ni endpoints. No dejar ambos archivos. Guardar preimagen antes de mover y verificar destino.

Cambio material observable: Next registra el mismo control desde la convención proxy y deja de emitir W-NEXT; las decisiones de acceso siguen coincidiendo con la preimagen. No basta ausencia de advertencia si el control dejó de ejecutarse.

Riesgo explícito: el Next instalado establece que Proxy siempre corre en Node.js. La migración cambia la convención/runtime de ejecución; por eso el cierre exige probar registro y wrapper reales en Next local con sesión sintética, no sólo renombrar o invocar el callback aislado. Si requiere cambiar autenticador/permisos u otros archivos de producto, STOP por alcance, no ajustar esas piezas automáticamente.

## Plan finito y aceptación

| Gate | Cambio y propósito | Resultado observable |
|---|---|---|
| P0 | Usar estas preimágenes; completar control Next aislado con dependencias existentes, casos de conservación, refutación afectada y freeze tras autorización | Instrumento viable antes de producto, RED de convención vigente y referencias de acceso |
| P1 | Preimagen y movimiento único middleware→proxy | Un solo archivo descubierto; bytes idénticos |
| P2 | Ejecutar registro Next y wrapper NextAuth reales con config/sesiones sintéticas, más tipos/lint pertinentes | Sin advertencia W-NEXT; positivos y rechazos conservados |
| P3 | Desarmar sólo el callback en copia aislada y verificar sensibilidad; revisar alcance y registros | Pruebas de acceso fallan por permitir indebido, registro sigue activo; cierre local para revisión |

Contrato propuesto:

1. Descubrimiento efectivo de proxy en instancia Next local aislada y ausencia de middleware/coexistencia/advertencia específica. No ejecutar app productiva ni .env real. Usar dependencias ya instaladas y aislamiento/montajes N02 disponibles, sin instalaciones ni red exterior. Viabilidad del montaje/compilación debe comprobarse antes de editar producto.
2. En HTTP del Next registrado, sesión sintética owner permite página y API privadas; visitante sin sesión o con email ajeno recibe redirección /login o401 JSON según ruta. Se requiere token/cookie válido producido con librería real y secreto sintético; inyectar req.auth al callback no certifica el wrapper. Usar wrapper y authConfig reales del hub, sólo variables/secretos sintéticos; no sustituir authConfig por un doble que oculte incompatibilidades.
3. Rutas públicas exactas/prefijos conservan acceso; el caso de agente conserva comportamiento actual con/sin header; matcher conserva inclusión/exclusión de rutas/estáticos. Cubrir cada clase definida por las tablas actuales y los diez casos medidos; ampliar antesfreeze sólo lo necesario para cubrir esas clases. Capturar status, Location, body y prueba de ejecución del control. No cambiar semántica de prefijos por preferencia.
4. Comparación de bytes con preimagen y diff consistente sólo en movimiento. Tipos/lint con configuración vigente. No repetir suites aceptadas de template/otras reparaciones.
5. Mutación únicamente en copia: callback permite siempre; los rechazos privados deben fallar mientras arranque, descubrimiento y positivos públicos siguen válidos. Además, restaurar nombre antiguo en copia reproduce W-NEXT sin usar un error del instrumento como RED.

GREEN exige todos los criterios en versión final. Hoy sólo están medidos detector y callback simulado; arranque/registro real, wrapper/sesión, tipos y mutación de la migración siguen pendientes y bloquean su cierre. La preparación no certifica esos resultados futuros.

Refutación interna: Harvey, lectura independiente de propuesta y medición, sin pruebas ni modificaciones. Sin BLOCKER para preparación; compatibilidad Node aún no acreditada. Dos MATERIAL para P0/P2: wrapper/authConfig reales y prueba de ejecución/registro/matcher (un200 público no demuestra ejecución). Incluidos arriba, con mutación que mantiene arranque/registro y falla en rechazos privados. No se declaran resueltos por el sondeo del callback; se exige verificarlos antes de cierre. [Informe](INFORME.md).

No decisión comercial pendiente. Única acción solicitada: autorizar esta migración y P0→P3 con preservación de comportamiento y límite de un movimiento. Si el arnés de Next no resulta viable dentro del presupuesto, detener en P0 con retoma precisa, sin tocar producto ni ampliar diagnóstico.

N03 seguirá abierta; N04 identidad/entorno/reglas reales yN10 regresión integral permanecen. Condición previa al despliegue sobre prestaciones por tenant intacta. Sin cambios remotos, instalaciones, ramas/worktrees, commit,push/deploy ni resets.
