# El camino del tester

Revisión local: r2. Reforma autorizada por Liam: suficiencia de la refutación y propuestas de mejora desde el segundo pensamiento. [Validación y transición](../informe/INFORME-METODO-r2.md). La procedencia de r1 está en [ADAPTACION.md](ADAPTACION.md). Las copias de origen son archivo histórico, no instrucciones activas.

## Contrato del método

Este archivo dice **cómo trabajar**. [El plan](../PLAN.md) define la meta y [el índice](../indice/README.md) determina qué sigue. Leer este método completo al abrir una tarea; no reconstruirlo desde memoria ni desde un resumen.

El modelo no es su propia evidencia. Una afirmación necesita una observación identificable y una comprobación adecuada. Otro modelo tampoco es una autoridad: sus hallazgos se reproducen y sus discrepancias se resuelven por evidencia, nunca por votación.

Modificar este método, sus criterios de aceptación o un control que lo protege requiere autorización expresa de Liam para ese cambio. La solicitud de copiarlo y adaptarlo autoriza esta revisión inicial; no autoriza futuras reformas silenciosas. No volver a pedir un permiso ya concedido para el mismo alcance y versión. Una pregunta o una idea no autoriza acciones ajenas a lo pedido.

Aquí viven reglas, no cifras del terreno, resultados de tareas ni citas a números de línea. Para admitir una regla nueva se explica qué fallo previene, cómo se validará y qué regla sustituye o simplifica; si no sustituye ninguna, justificar el costo de agregarla. La evolución sigue [EVOLUCION.md](EVOLUCION.md).

## Parte 0 · Preparar sin contaminar

1. Leer índice, encargo, decisiones aplicables y último traspaso. Comprobar revisión Git, cambios locales y trabajo simultáneo. No tomar archivos ajenos como propios ni borrarlos para lograr un árbol limpio.
2. Identificar qué comandos leen y cuáles escriben, importan módulos con efectos, usan credenciales, red, cuota o dinero. Inspeccionar antes de ejecutar. Una prueba o una consola de IA puede gastar recursos.
3. Registrar alcance, autorizaciones vigentes y frontera de escritura. Durante preparación se pueden guardar planes, evidencias, controles previos y registros de esa tarea. **Eso no habilita cambios en el producto, activación de controles globales ni llamadas con efectos externos.**
4. Hacer el barrido de obligaciones: plan, decisiones, pendientes y tareas consumidoras. Toda promesa pertinente entra en el encargo o queda diferida con motivo y destino. Una búsqueda vacía no prueba ausencia: comprobar población, lectura y límites de la búsqueda.

Este tester tiene su propio repositorio. No hereda las bases, scripts, hooks, límites numéricos ni candados de `vendamos-agente`. La documentación de ML se investiga al abrir su tarea bajo este método. Los contrastes autorizados externos se mantienen separados del ejecutor masivo aislado; nunca usar producción para completar un simulador incompleto.

## Parte 1 · Medir y refutar el encargo

El encargo aporta una dirección; sus hechos se vuelven a verificar sobre el terreno vigente. El código muestra qué ocurre, no demuestra qué debería ocurrir: el contrato y las fuentes verificadas sostienen esa segunda pregunta. Si discrepan, registrar y resolver la discrepancia antes de afirmar cumplimiento.

Cubrir estos cinco ángulos, con evidencia y límites por ángulo:

| Ángulo | Pregunta |
| --- | --- |
| Cumplimiento y deuda | ¿Qué se prometió, qué existe y qué falta realmente? |
| Aritmética | ¿Qué población, unidad, denominador y exclusiones sustentan cada cifra? |
| Referencias | ¿La fuente existe, corresponde a esta versión y sostiene lo afirmado? |
| Consumidor | ¿Puede quien usará esto completar su recorrido y hacerlo fallar? |
| Instrumento | ¿El control detecta el defecto correcto y acepta un caso válido? |

Usar sondeos mínimos del recorrido disponible, sin conexiones no autorizadas. Si todavía no existe un ejecutable, medir lo que sí existe y declarar que no se probó comportamiento. No inventar una corrida para llenar el informe.

La revisión adversarial tiene mandato de **refutar**, no de confirmar. Usar agentes independientes en lectura para ángulos concretos que puedan trabajar en paralelo; no repartir por archivo ni multiplicar revisores del mismo ángulo. Una tarea pequeña necesita contraste independiente de sus puntos críticos, no un ejército. Si no hay revisor disponible, dejar esa comprobación pendiente y explicarlo; no sustituirla por una segunda opinión del mismo autor.

Quien integra verifica las cifras y citas que va a publicar, incluidas las favorables. Dos resultados distintos obligan a comparar criterios y entradas. Una sospecha no demostrada queda como hipótesis; una condición de aceptación incierta queda **no verificada**, nunca aprobada por falta de prueba en contra.

## Parte 2 · Conservar una unidad de trabajo manejable

**La intención inicial es completar una entrega coherente. Dividir es un recurso necesario, no el resultado esperado del método.** Una entrega puede requerir código, pruebas, documentación y registros: esas piezas no son automáticamente tareas distintas.

Antes de decidir, escribir en el encargo:

- Resultado verificable y obligaciones que deben quedar juntas.
- Dependencias y decisiones que faltan; cuáles pueden resolverse antes de ejecutar.
- Superficie que habrá que comprender y revisar, incertidumbres y comprobaciones del cierre.
- Capacidad de terminar y verificar con el contexto disponible, reservando espacio para registrar y entregar. Si no puede estimarse, declararlo; no inventar porcentaje de contexto.
- Tarea madre, particiones anteriores y por qué cada corte anterior no alcanzó, si las hay.

**Sólo dividir cuando se demuestra al menos una necesidad:**

1. Hay resultados independientes que pueden aceptarse por separado y mantenerlos juntos impide revisar o cerrar con rigor.
2. Una decisión o dependencia externa imprescindible bloquea una parte, y existe otra entrega útil que puede cerrarse sin anticipar esa decisión.
3. La superficie o incertidumbre excede lo que se puede comprender, ejecutar y validar responsablemente en una sesión, y un corte concreto reduce esa carga sin romper el recorrido.

Tener varios pasos, archivos o la frase «y también» no basta. Tampoco basta una aprobación intermedia que este mismo método exige: primero decidir si se resuelve dentro de la tarea. **Si basta una pausa y un traspaso, se retoma el mismo ID.** Una sesión nueva no necesita una tarea nueva.

Cada partición debe comparar continuar, simplificar el enfoque, pausar y dividir. Registrar causa observada, carga que se reduce y costo de integración. Si no mejora la posibilidad real de terminar, no se hace. En una repartición se vuelve a la obligación de la madre; nunca añadir sufijos por inercia ni ocultar que el problema sigue sin entenderse.

Antes de aplicar el corte, presentar a Liam el motivo y el mapa de obligaciones. Su autorización específica vigente vale; si no existe, obtenerla. Para cada obligación de la madre registrar destino exacto: hija, conservada, diferida o descartada con razón y aprobación cuando cambie el alcance. No dar la madre por completada al crear hijas. No renumerar IDs existentes.

Todas las hijas reciben desde el corte una ficha persistente con resultado, obligaciones heredadas, dependencias y aceptación prevista. **Sólo la que se abre necesita el plan de ejecución completo y vigente.** Así ninguna obligación desaparece y tampoco se inventa detalle para un terreno aún desconocido.

Hallazgos: si bloquean, incorporarlos al mismo trabajo cuando sean parte de su solución; dividir sólo con el criterio anterior. Si otro trabajo los consume, escribirlos en su ficha y enlazarla. Si aún no hay ficha, crear una ficha mínima, no un nuevo proyecto. Sin consumidor, registrarlos en [PENDIENTES.md](../indice/PENDIENTES.md). Nunca dejar la única instrucción dentro de un informe.

## Partes 3 y 4 · Plan y aceptación antes del trabajo

Guardar el encargo en `indice/tareas/`, usando [la plantilla](../indice/tareas/PLANTILLA.md). Incluir estado real medido, límites, pasos ordenados, dependencias, archivos o superficies autorizadas, reversa, evidencias y criterios de aceptación identificados. No partir el plan sólo por haberlo terminado.

Antes de modificar producto, cada criterio tendrá **VERDE** (qué demuestra cumplimiento), **ROJO** (qué defecto conocido debe detectar) y resultado **NO VERIFICADO** (instrumento o entorno insuficiente). Elegir entradas y referencia antes de ver la salida que se quiere aprobar.

- Para comportamiento o controles ejecutables, guardar el archivo de comprobación y ejecutar los controles preparatorios realizables. Si el producto aún no existe, comprobar la viabilidad y sensibilidad del instrumento con casos preparados cuando sea posible, y registrar como NO VERIFICADAS las propiedades que requieren el producto. Esos casos no prueban su comportamiento real: antes de cerrar su aceptación se ejecuta el control contra la implementación. No diferir una condición necesaria para realizar con seguridad la siguiente operación. Si el rojo inicial perturba otras tareas, vive junto al encargo y se ejecuta explícitamente, o en un entorno aislado.
- Para documentación, medir propiedades comprobables —enlaces, cobertura de obligaciones, consistencia del calendario— y contrastar significado con las fuentes y un lector independiente. Un test de palabras presentes no certifica que una regla sea correcta.
- Para investigación, fijar preguntas, cobertura, procedencia y condiciones de refutación. Un comando no convierte una fuente dudosa en cierta.
- Para un guard, fijar caso válido, defecto específico y el guard desarmado; ejecutar los controles preparatorios disponibles y, antes de confiar en la protección, los tres contra el guard implementado. Verificar que la mutación ocurrió y que el fallo corresponde a ese defecto; un error de importación no es el rojo buscado. Incluir consumidores y extensiones previstas en el plan, no sólo archivos actuales.

No ajustar el oráculo y la implementación a la vez para comprar un verde. Cambiar qué se acepta requiere razón, evidencia, nueva versión y autorización de Liam. Una corrección puramente técnica del arnés se registra y obliga a repetir la medición afectada; no se presenta como mejora del producto.

**Primera aprobación, vía completa:** presentar hallazgos relevantes, decisión de conservar o dividir, enlaces a las fichas y planes, y VERDE/ROJO del trabajo que se abrirá. Hasta la autorización correspondiente no ejecutar cambios del producto.

## Parte 5 · Refutar el plan y elegir la vía

El contraste independiente ataca el plan resultante, sus límites y sus comprobaciones, no sólo el encargo original. Reconciliar cada hallazgo: corregido con evidencia, refutado con evidencia o pendiente con efecto sobre la aceptación. No cerrar la etapa mientras exista una condición necesaria para ese avance no verificada. Las propiedades del producto aún no construido conservan su estado y freno de uso según el criterio siguiente.

### Cuándo alcanza la refutación para avanzar

El visto bueno de un revisor, el consenso y la ausencia de nuevos hallazgos no bastan. Tampoco existe un número de rondas limpias que certifique ausencia de errores. Justificar la suficiencia **para un objeto, versión, alcance y etapa**, mediante un registro breve integrado en la aceptación y los informes existentes; no duplicar tablas ni crear una tarea por cada riesgo.

1. Identificar obligaciones y riesgos relevantes antes de revisar. Contrastar también esa selección con fuentes, decisiones, consumidores y sus recorridos: comprobar sólo la lista del autor puede ocultar omisiones. Explicar exclusiones y límites; una obligación nueva se incorpora o adjudica con motivo y autorización cuando cambie alcance.
2. Para cada obligación/riesgo, enlazar la condición que no puede fallar, perspectiva de revisión, caso adverso pertinente, comprobación, evidencia y límites. Conservar los cinco ángulos y el contraste independiente; perspectivas distintas no exigen un agente por perspectiva. El integrador comprueba hallazgos y evidencia, incluidos resultados favorables.
3. Distinguir defecto demostrado que invalida aceptación, condición necesaria no verificada, hipótesis y mejora opcional. Un hallazgo declara condición afectada, evidencia o caso por comprobar y consecuencia. Una hipótesis sobre una condición necesaria obliga a resolver esa incertidumbre, sin presentarla como defecto demostrado. Una preferencia o mejora opcional no bloquea por existir.
4. **Para autorizar construcción:** exigir plan coherente, comprobaciones viables y evidencia preparatoria pertinente. Una propiedad que sólo pueda medirse tras construir queda NO VERIFICADA, con comprobación prevista, responsable, etapa y freno que impida usarla o cerrar su aceptación antes de medirla. Esta asignación no permite diferir requisitos necesarios para construir con seguridad. **Para aceptar uso o cierre:** exigir resultados reales de las comprobaciones pertinentes sobre la versión final; ejemplos sintéticos o instrumentos aprobados no certifican por sí solos el producto.
5. Resolver los defectos y desconocidos que impidan el avance examinado. Registrar los restantes con efecto, responsable y destino. Reutilizar evidencia vigente; cada revisión adicional necesita una duda concreta, perspectiva faltante, cambio que invalide evidencia o insuficiencia del instrumento. No cerrar por cansancio, cuota o cantidad de rondas, ni repetir revisiones sin propósito para aparentar rigor. Si no puede obtenerse evidencia necesaria, pausar el alcance afectado y entregar un replanteo.

Si después de una revisión favorable aparece un defecto que invalida la aceptación, revisar también **por qué escapó**: formular y contrastar la causa de omisión, identificar otras propiedades expuestas al mismo mecanismo y comprobarlas. Corregir el control con caso válido y adverso pertinente, y registrar qué conclusiones pierden sustento. No basta parchear el ejemplo; tampoco corresponde invalidar evidencia ajena al defecto. Si la causa sigue incierta, conservar esa incertidumbre y su efecto sobre la aceptación, sin inventar una explicación. Aplicar el freno de convergencia de parte 6 cuando corresponda.

Este criterio habilita una recomendación fundada; no concede permisos ni sustituye las aprobaciones de la vía elegida. La justificación de suficiencia se actualiza también durante parte 6 y al cerrar parte 7 cuando cambien objeto, evidencia o hallazgos.

### Aprobaciones y elección de vía

**Vía completa:** después de la primera aprobación, refutar el plan y presentar qué cayó y qué cambió. La segunda aprobación habilita su ejecución. Aprobar el plan no equivale a autorizar su ejecución, aunque la refutación no cambie la versión; sólo una autorización que cubra expresamente ambas instancias permite no repetir el pedido. Un sí sobre una versión no cubre una alteración material de alcance, riesgo o aceptación.

**Vía compacta:** se pueden presentar juntas las partes 3, 4 y 5 y usar una única aprobación cuando la medición demuestre una entrega coherente, dependencias y decisiones resueltas, superficie manejable y validación realizable. Registrar por qué se cumple cada condición. Conserva los cinco ángulos, la refutación independiente y el VERDE/ROJO previos. No se habilita por cantidad de líneas ni por conveniencia del modelo.

Si aparece una nueva dependencia, un cambio material o pérdida de capacidad de revisar, detener la parte afectada, guardar el estado y revisar el alcance con Liam. No convertir automáticamente ese freno en una partición ni ejecutar una desviación en silencio.

## Parte 6 · Ejecutar y revisar desde métodos distintos

Trabajar contra el plan autorizado y registrar cualquier contradicción del terreno. No aflojar un control ni ampliar permisos para hacer pasar una tarea. Para entregas en las que se confiará —código, mediciones, reglas, registros o auditorías— conservar las cinco pasadas del método de origen:

1. **Hacer:** completar el trabajo previsto; distinguir esta pasada de la revisión.
2. **Medir:** ejecutar el consumidor y sus controles, casos válidos y defectuosos; mutar también el punto donde se decide, no sólo helpers. Medir aislamiento y efectos donde corresponda.
3. **Leer completo:** revisar los archivos relevantes enteros, no sólo coincidencias de búsquedas. Buscar omisiones, errores silenciados, estados desconocidos convertidos en éxito y afirmaciones sin prueba.
4. **Auditar lo propio:** comprobar que los cambios de las pasadas anteriores resolvieron toda la propiedad y no generaron incoherencias en consumidores, registros o controles.
5. **Revisar lo que vive sólo en prosa:** localizar garantías sin mecanismo y definiciones duplicadas. Implementar la protección dentro del alcance autorizado, o registrar que falta y qué cierre impide. No declarar instalado un guard escrito como intención.

Una corrección editorial de bajo impacto puede tener revisión proporcional registrada; no es excepción para cambiar semántica del método, permisos, aceptación ni cifras de las que dependa una decisión.

Registrar hallazgos por pasada, severidad, causa y evidencia. Tras un arreglo repetir la pasada afectada y las comprobaciones cuyo resultado pudo invalidar; las cinco deben quedar cubiertas sobre la versión final. No repetir pruebas aprobadas sin cambios ni incertidumbre nueva que lo justifique.

Si quedan defectos o condiciones no verificadas que impiden el avance o la aceptación examinada y dos rondas consecutivas comparables no los reducen, **detener el trabajo afectado y avisar a Liam con la evidencia**. También detenerse si reaparece una causa que se dio por resuelta o aumenta la gravedad de esos hallazgos. Las mejoras opcionales no activan este freno. Registrar población y criterio de cada ronda para no comparar conteos distintos; cada nueva ronda necesita el propósito definido en parte 5 y dos rondas limpias no constituyen estancamiento. Buscar la causa y contraste independiente; presentar un replanteo concreto y continuar sólo bajo la decisión o autorización correspondiente de Liam. No continuar vueltas idénticas ni cerrar por cansancio. Un resultado limpio sólo vale para lo que se examinó; no demuestra ausencia universal de defectos. Si falta contexto para terminar con rigor, usar el traspaso del mismo ID.

## Parte 7 · Cerrar con evidencia y continuidad

1. Congelar la superficie durante las verificaciones. Registrar revisión, cambios locales, entorno, comandos, salidas y códigos de salida. Comprobar que el instrumento pudo observar su población. Si el árbol cambió durante la corrida, reconciliar y repetir lo afectado.
2. Ejecutar el VERDE y ROJO pertinentes y la certificación aplicable definida en el plan. No usar la suite de Vendamos como certificación de este repo ni afirmar que existe una suite aún no construida. Un caso aislado no cierra una propiedad de toda la población.
3. Revisar cumplimiento, consumidor y sensibilidad del instrumento como ángulos distintos. Completar la revisión de claridad: nombres, texto, código sin uso y afirmaciones que ya no coinciden con su contenido.
4. Guardar mediciones útiles en `informe/` con fuente, versión, comando o procedimiento, resultados crudos y **qué no probó**. Diferenciar fallo del agente, simulador, conector, proveedor, evaluador e instrumento; conservar lo indeterminado.
5. Añadir una entrada breve a `historial/`: qué se prometió, qué se hizo, comprobaciones, qué se difirió y adónde, estado final y próximo paso. No reescribir entradas pasadas; corregirlas mediante otra entrada enlazada.
6. Actualizar `indice/`: estado, calendario, dependencias, tarea siguiente y decisiones pendientes. Mover lo envejecido al historial o su consumidor antes de quitarlo. El índice orienta la sesión; no almacena la crónica ni duplica cifras de informes.
7. Comprobar referencias y coherencia de registros. Hacer commit sólo de los archivos propios y push al remoto autorizado. Verificar estado después; si falla la publicación, distinguir entrega local de entrega sincronizada.

Un cierre de fase exige acta con alcance, versión revisada, evidencia, hallazgos y resolución, limitaciones, evolución de lo existente y veredicto. El acta identifica el árbol comprobado mediante commit previo y/o manifiesto de huellas; no exige adivinar el hash del commit que contendrá la propia acta. Un cambio posterior en el alcance invalida su revisión hasta comprobarlo.

**PARCIAL, BLOQUEADA y NO VERIFICADA no significan COMPLETA.** Una tarea dividida queda como contenedora hasta cubrir sus obligaciones. Al terminar una sesión sin cerrar la tarea, registrar pasos hechos, evidencia vigente, archivos modificados, incertidumbres y comando o acción exacta para retomar. Es continuidad, no otra partición.

### Trabajo simultáneo

Los revisores leen; un solo responsable integra y cierra. Si se autoriza trabajo paralelo de escritura, declarar responsables, superficies, árbol de trabajo y ventana en el índice. Cada participante entrega diff y controles ejecutables donde corresponda. Nadie edita la superficie mientras se certifica. Un resultado parcial que excluye dependencias no se presenta como certificación completa.

## Lo que el sandbox obliga a distinguir

- Regla de ML verificada, observación con condiciones, política del agente e hipótesis de estrés.
- Mundo real simulado, información visible al agente y oráculo reservado.
- Calidad de la respuesta y fidelidad del simulador: T21 tiene validación propia.
- Reproducción de una respuesta guardada y nueva generación de un modelo.
- Cobertura, cantidad de casos, exclusiones y no evaluados; ningún denominador oculta fallos.
- Versiones de agente, entorno, reglas, escenarios y evaluadores; cambiar el examen no demuestra entrenamiento.

## Dónde se guarda lo que sobrevive

| Lugar | Responsabilidad |
| --- | --- |
| `indice/README.md` y `indice/CALENDARIO.md` | Próximo paso y calendario de dependencias y estados; fechas sólo si fueron acordadas. |
| `indice/tareas/` | Encargos, planes, obligaciones heredadas y controles previos de cada trabajo abierto. |
| `indice/PENDIENTES.md` | Hallazgos sin consumidor y decisiones por resolver. No es otra cola automática de tareas. |
| `informe/` | Mediciones fechadas y sus límites; un dato tiene una fuente canónica y se enlaza desde otros lugares. |
| `historial/` | Entradas breves que se agregan sin borrar las anteriores; enlaces al detalle. |
| `metodo/EVOLUCION.md` | Propuestas de reforma y decisiones de Liam, con evidencia y reversa; ninguna se activa sola. |

No amontonar toda la evidencia en el contexto: leer índice, método y tarea completos; consultar informes por la pregunta que hace falta resolver. Lo relevante debe poder encontrarse sin depender de que el modelo recuerde esta conversación.
