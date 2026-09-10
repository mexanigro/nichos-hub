# N03 — integración final, acta RED y retoma

**N03 continúa abierta por una decisión funcional pendiente, no por presupuesto.** La autoridad backend aprobada y la coherencia de proveedor/interfaz están reparadas y verificadas localmente. Reserva → lectura y acción de la misma cita por agenda funciona con los middleware aplicables y destinos separados. El recorrido reserva → checkout sigue RED: book no escribe un precio autorizado, checkout lo exige y rechaza con400. Liam eligió expresamente **mantener pendiente** la propuesta de resolver serviceId/precio del catálogo backend al reservar. No se modificó booking-handler ni se asignaron precios a históricos.

## Decisiones, alcance y gates

Se registran las dos aprobaciones de Liam: clients/config/credenciales de esta API tienen autoridad backend de citas, sin fallback browser ni excepción a compatibilidad; payment.mode gobierna, datos acceptCash/depositRequired se conservan sin interruptores, manual/none no cobran, valor explícito inválido y lectura fallida no habilitan legacy, Cardcom bloqueado y sin2000 visual. También se conserva la confianza Auth navegador explícitamente configurada, firma/emisor/audiencia/vigencia y membresía/rol backend ya aprobadas; no se amplían permisos.

P0: controles fijos y RED antes de editar cada alcance. Pipeline48casos256checks RED54; UI/proveedor53checks RED35; selector manualRED; consumidores getter8casos67checks RED9. Refutación detectó y retiró del instrumento la inserción artificial de precio antes del cierre de P0 ampliado. Freeze-r3, FREEZE-UI y CONSUMIDORES-FREEZE conservados. No se bajó checkout esperado200 a400 para hacer pasar el producto.

P1: cinco archivos modificados en este tramo: template server.ts, api/index.ts, src/lib/api/payment-gateways.ts, src/components/booking/BookingWizard.tsx; hub src/components/config-editors/payment-provider-editor.tsx. Preimágenes físicas conservadas antes de cada escritura repetida. Sólo tres consumidores afectados del getter reciben503controlado; no se rehízo el CRM ni el booking.

P2: verificación local y mutación de correcciones autorizadas alcanzadas; **P2 global incompleto** por el precio pendiente. P3: revisión integrada y acta RED/retoma registrada, no acta de cierre exitoso. DONE no alcanzado. En el plan global P0/P1 completos, P2 parcial; esta acta no acredita P3 de cierre GREEN.

## Qué cambió y qué garantiza

- API tenant guard lee clients por loadAdminFirestore, mismo acceso que book/agenda. Guard tenant-access y accesores/compatibilidad sin cambios: no se salta la guarda ni se recrean apps. Server conserva su fuente Admin. Estado ausente, inválido, error o timeout no habilita; suspensión/archivo bloquean.
- Ambos getClientRuntimeState leen clients y config del backend. No retornan active ante lectura fallida. Provider explícito es autoritativo: manual se trata como none, inválidos rechazan; sólo propiedad ausente permite cadena legacy vigente. Errores no se convierten en ausencia.
- Credenciales de ambos runtimes por el mismo backend y resolver anidado vigente; error/noDB propaga sin fallback positivo. Carga/caché y precedencia sin mezcla se conservan. Documento ausente conserva compatibilidad existente; una lectura fallida no.
- Webhook ambos runtimes y tenant/status API convierten rechazo del getter en503sin detalles internos ni gateway. Status server conservado: no usa ese getter.
- Editor retira los dos controles sin borrar tipos/datos/payload; mantiene editor de seña segúnmodo y explica autoridad. Cardcom indica bloqueo. Wizard no inventa2000 ni envía importe estimado; manual no abre paso online. El rechazo real de cita sinprecio se mantiene visible; no se finge cobro completado.

## Resultados pertinentes

| Control | Resultado y evidencia |
|---|---|
| Pipeline final48casos/264checks | RED16, todos vinculados al checkout de cuatro viajes book→checkout sinprecio (2runtimes×igual/separado). Reserva/listado/PATCH y política independiente con cita prepreciada pasan. resultados/parcial-final/PIPELINE.json, exit1. |
| Guarda tenant desarmada | RED40 frente a16basal:24fallos adicionales. Detecta accesos ante suspended/archived/ausente/inválido/error/timeout. resultados/mutante-bypass-final. |
| Rechazar recorrido válido | RED52 frente a16basal, población alcanza232checks por corte temprano. Detecta bloqueo de casos válidos; no sólo ausencia de excepciones. resultados/mutante-reject-final. |
| Consumidores de getter | GREEN8casos67checks, exit0. Rechazo controlado y positivos preservados. resultados/consumidores-green. |
| UI/proveedor | GREEN53; restaurar editor previo RED28. Selector manual finalGREEN4casos. SSR real y lógica real, sin navegador completo. UI-PROVIDER-FINAL/ UI-MUTANTE-RESTAURAR/WIZARD-SELECTOR-FINAL. |
| Credenciales | GREEN37checks/22recorridos editor→writer→SDK→loaders. Reutilizado instrumento, sólo binding técnico loadAdminFirestore añadido con preimagen, mismas expectativas. ../credencial/reparacion/resultados/integracion-final. |
| Tipos/lint | Hub tsc0, template tsc0 final (lint del template es tsc). Lint editor comparativo idéntico: un react-hooks/set-state-in-effect previo; no nuevo. Intento ESLint CLI sinconfig falló y se conserva; se usó después el instrumento existente. |
| Conservación |337fuentes del corte previo:329idénticas,8existentes autorizadas modificadas y2nuevas de agenda ya previstas; hub1archivo autorizado. En este tramo5archivos. Booking-handler y tenant-access idénticos, saveCredentials/handleProviderChange/ToggleRow idénticos. CONSERVACION-FINAL.json. |

## Causa de la omisión y límite recuperado

Los contratos anteriores extraían registros de handlers y los montaban en Express sin reproducir app.use anteriores. Por eso acreditaban identidad/acciones de los handlers, pero no que una petición pudiera alcanzarlos bajo el middleware de Vercel. El contrato actual extrae seis middleware aplicables en orden AST real de cada runtime: securityHeaders, express.json32kb, requireTrustedOrigin, rateLimit, attachTenantContext y enforceClientActive. /api/ai no aplica a estas rutas. Luego ejecuta registros reales book, CRM GET/PATCH y checkout. Conserva positivos, origin, auth/membresía, body/rate, estado y namespaces efectivos SDK; detecta bypass y sobrerrechazo.

La primera preparación integrada además añadía priceCents a la cita creada antes de checkout. Era un prerrequisito artificial y no una escritura de book. La refutación lo detectó, conservó instrumento anterior, retiró sólo esa inserción y mantuvo el objetivo200: la conexión quedó correctamente RED. Citas prepreciadas se identifican separadamente para verificar política de cobro; no acreditan el recorrido de una reserva nueva.

No se arranca todo el proceso ni se usan proyectos, DB, tokens, proveedor o notificaciones reales. RSA y documentos sintéticos; SDK/accessors y middleware locales efectivos, operaciones interceptadas, Docker sinred para pipeline. No certifica métricas completas, entrega, IAM/rules remotos, histórico universal, concurrencia, cobro real o deploy.

## Revisión de las siete obligaciones del balance vigente

1. Destinos/agenda: desapareció el bloqueo503 de middleware API con proyectos separados. Evidencia previa de históricos, acciones pororigen, identidad cruzada/roles y mutaciones se conserva, sin repetirla. Pipeline actual cierra la alcanzabilidad local de reserva→lectura/acción. Resultado local para revisión, sin inventar aceptación de Liam.
2. L02/L12: aceptación L02 y evidencia L12/SAFE/merge/consumidores vigente, sin drift adicional ni reparación nueva. No se reabre.
3. H01/ES-A: aviso/fallback e instrumentos vigentes, conservados.
4. D13/NOT-A: D05/L03 aceptados, E-NOT01 y delimitación digest vigentes. Compromisos/comercialización y entrega en etapas previamente adjudicadas, sin nueva transferencia.
5. L04/L08/COB-A: autoridad, provider, seña config y credenciales verificadas en su población; Cardcom bloqueado según decisión. **Impedimento local original pendiente:** precio autorizado de book→checkout. No se descuenta esta familia ni se manda aN07 para simular cierre.
6. Paridad: evidencia adjudicada vigente, nueva cadena comprueba ambosruntimes; diferencias posteriores reales siguen su etapa.
7. H07: recepción documental adjudicada, sinheredar readyglobal ni nueva auditoría.

Los cambios recientes de agenda/autorización y cobro se incluyen en esta revisión; las entregas aceptadas no se reabren. El examen independiente se conserva en el acta del revisor de este directorio.

## STOP acotado y retoma necesaria

Gate global actual P2. Bloqueo exacto: cita creada por book carece de priceCents/price; checkout responde400antesdelproveedor. Hipótesis descartadas: fallo del selector, mera desaparición de warning, y prueba suficiente con precio insertado porfixture. Información nueva: la integración alcanza la misma cita, pero falta autoridad/escritura del precio. Decisión requerida ya presentada: catálogo backend porserviceId y rechazo previo si no verificable; Liam la dejó pendiente. No se repite la consulta ni se modifica producto para suplirla.

Siguiente acción única: resolver esa decisión de autoridad de precio; si se autoriza, completar el mismo contrato sin fixture artificial y revisar entonces cierre. Ninguna implementación de booking está autorizada ahora. No hace falta reconstruir herramientas ni repetir suites aceptadas.

Consumo verificado96% TOTAL; techo100%, sin resets. Trabajo técnico termina antes del98 y reserva98–100intacta. No se cierra por presupuesto. Etapas N04–N10 conservan sus responsabilidades originales; prestaciones por tenant, evidencia y decisión antes de despliegue siguen obligatorias. Sin instalaciones, ramas/worktrees, efectos externos, push ni deploy.

RESULT: RED
TASK: completar condiciones originales de N03
GATES: 2/4 globales completos; P2 parcial, acta RED registrada; DONE no
TESTS: correcciones autorizadas verificadas; contrato integrado conserva RED16 porprecio pendiente
BLOCKERS: autoridad y escritura de precio de reserva nueva pendientes de decisión
CHANGES: autoridad backend, coherencia proveedor/interfaz y manejo de rechazo; evidencia/custodia
REMAINING: resolver precio autorizado book→checkout, verificar ese recorrido y acta GREEN posterior si corresponde
