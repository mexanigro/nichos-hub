# L05 — decisión aprobada y autorización de implementación

2026-09-09. Liam autoriza implementar exclusivamente server.ts, api/index.ts y el nuevo src/lib/api/tenant-access.ts. Techo80% TOTAL N03, sin resets, sustituye77%. La propuesta histórica no se sobrescribe.

Política explícita: active/trial/maintenance comprobados permiten; suspended/archived comprobados423 existente; ausente/inválido/imposible de verificar503 genérico. Caché30s desde inicio de lectura. Verificación completa1500ms incluyendo token y carga SDK. Concurrencia comparte lectura y plazo; caché vencida no autoriza ante fallo; respuesta tardía no habilita ni renueva caché.

Separación de pagos: getter y cache legacy de proveedores intactos. Nuevo guard con resultado verificado en res.locals para tenant/status; no volver a decidir acceso desde el status legacy. El plazo limita toda la verificación de acceso; no establece un plazo nuevo para la consulta posterior de proveedor que preserva el endpoint API. No modificar selectores, autenticación/origen/límites, excepciones, señales de salud, browser o documentos reales.

P0 continúa pendiente: instrumentos escritos, preimágenes preservadas, pero arranque del control nuevo bloqueado por sintaxis del fixture. No hay freeze ni producto implementado. La decisión comercial/temporal ya está aprobada: no volver a solicitarla ni el presupuesto.

Refutación /root/refutar_soporte (Harvey), mismo turno, sólo lectura: diseño viable sin BLOCKER. Material incorporado al instrumento de unidad: plazo compartido con segunda solicitud cerca del vencimiento; comprobación de tiempo incluso si la resolución tardía precede al callback del timer; conservar flight503 hasta asentarse, no iniciar otro ni cachear resultado tardío; expiración desde inicio; cache de estados bloqueados; status público desde res.locals. El control de integración aún no demuestra esas propiedades; requiere resolver el fallo del arnés y luego revisión/freeze antes de producto.

La aceptación de PROPUESTA.md A1–A6 se conserva. aceptacion-unidad.cjs agrega casos deterministas de frontera y concurrencia; runner.mjs ejercita CLI server.ts y export API real en la infraestructura Docker existente, con fixture/preload local. Son instrumentos preparados, no evidencia GREEN. El sondeo previo43 observaciones/25 divergencias se conserva sin repetirlo.
