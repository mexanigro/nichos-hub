# L03 — propuesta mínima de interfaz, para revisión

**Ocultar los tres ToggleField de notifications.enabled, bookingAlerts y contactInquiries en src/components/client-config-tab.tsx y sustituirlos por una nota informativa. No implementado.**

Texto propuesto: «Sin agente, los avisos base de contacto y reservas usan email. Con agente, usan los canales configurados.» Describe la selección de canal, no garantiza entrega. Los cinco avisos examinados son confirmación/cancelación/reprogramación al cliente, nuevo contacto y nueva reserva al dueño.

Se elige ocultar en lugar de mantener controles deshabilitados: no hay una acción efectiva que ofrecer para esos avisos. No agregar comportamiento para conservarlos. Mantener adminEmail y todos los demás campos de la sección. Preservar los valores ya almacenados, defaults, tipos, carga y payload de guardado: no limpiar flags ni migrar documentos, cambiar canales, permisos o backend. Única superficie futura: esos tres nodos JSX y la nota del mismo componente.

La evidencia demuestra falta de efecto en la selección de los cinco avisos incluidos, no ausencia universal de cualquier uso externo. El censo local de referencias encontró sólo UI/tipos/defaults para esos flags en las áreas incluidas. No se amplía a reminders, staff, scheduler u otros eventos/herramientas. D05 se conserva expresamente por decisión de Liam: no se suprimen emails base con el agente deshabilitado.

Para autorizar implementación futura: verificar vigencia y preimagen; comprobar que desaparecen únicamente los tres controles operables y aparece una explicación fiel; conservar los valores de notifications/channels y el resto del payload al guardar, sin insertar/eliminar flags como efecto de la corrección visual. Tipo/lint pertinente y contraste del render/consumidor del componente; backend/D05 por huella, sin repetir entregas aceptadas. Un mutante que restaure los controles debe volver a detectar la promesa interactiva no respaldada. No se ejecutó esta modificación ni sus pruebas de implementación.

L03 permanece sin descontar. La preparación puede revisarse; el descuento exige luego la corrección de interfaz autorizada y su GREEN local. N03 abierta; etapas posteriores y condición por tenant antes del despliegue conservadas. Techo85% TOTAL,sin resets,instalaciones,externos,push/deploy.
