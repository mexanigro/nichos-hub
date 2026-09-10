# N04 — primera lectura real y publicación pendiente

Fecha: 2026-09-10. N03 aceptada por Liam exclusivamente en su alcance técnico local. No se repiten sus suites ni se certifica producción con mocks. Fuente: orden vigente de aceptación, publicación condicionada y comienzo N04; ficha N04 y método vigente leídos. Sin cambios de producto, hosting, datos, claims o reglas.

## Publicación Git: DETENIDA

HEAD hub 577e540a3c6c1c6f4ee0f8a5f8c152de53f44cb5; template 0670e71bb86746e534cfacb66bf3ed47757f4714. Consulta real ls-remote: main hub 60736c003b1e948ab45572f26c37e3b5aa286165; template 6c07d7afea45ca4d068420a6089363881a6074ef. No coinciden. No se ejecutó push ni force-push. La autorización existe: falta acreditar que no despliegue.

Vercel: consulta real del equipo team_QyyrNVIrwJlpImuv54OKf3pG encuentra 15 proyectos vinculados a mexanigro/Barber-shop-template (nombres e IDs completos en vercel-proyectos.json). Incluye barber-shop-template, barber-shop-template-en y 13 demos. get_project no proyecta el estado de autodeploy; live:false NO acredita su desactivación.

Railway: list_projects y get_service_config para 459ec443-bb91-4ead-b866-853938b3617b fallaron Unauthorized, solicitando railway login. Proyecto luminous-surprise, servicio nichos-hub, production identificados desde el registro existente; su configuración Git actual NO fue acreditada. Alternativa navegador: selección de pestaña falló por timeout y luego CDP Emulation.setFocusEmulationEnabled; se detuvo esa vía sin cambiar nada.

Intervención concreta: restablecer la sesión OAuth de Railway para consultar Settings del servicio nichos-hub. Si autodeploy está activo, ajuste sometido a decisión de Liam: Disable en GitHub Autodeploys. En Vercel, para los 15 proyectos inventariados, comprobar Settings > Git; si no hay desactivación acreditable, propuesta sometida a decisión: Disconnect del repositorio conectado en cada proyecto. Ambas propuestas interrumpen futuros despliegues automáticos por Git; no se ejecutaron. No usar skip-ci ni Wait for CI como garantía. Tras la intervención, volver a consultar estado, revisar selección de commits propios y verificar refs después de push autorizado.

Fuentes oficiales de los ajustes: https://docs.railway.com/deployments/github-autodeploys y https://vercel.com/docs/project-configuration/git-settings . No atribuir un estado del proyecto a documentación general.

## Recorrido N04 seleccionado y contrato de este tramo

Obligación D06/R04: identificar destino real y reglas publicadas de la base antes de pruebas de permisos. Recorrido limitado: sesión Firebase real → proyecto barbertemplate-madre → base literal default → índices y fuente de reglas. No es todavía reserva ni acceso de un usuario del CRM.

P0: autorización, ficha, balance y destino identificados — alcanzado. P1: metadatos reales de base e índices capturados — alcanzado. P2: cadena base → release → ruleset → fuente atribuida — pendiente. P3: contrato ejecutable de acceso válido/cruzado en entorno aislado con restauración y autorización — pendiente. Estos gates son del primer tramo; no sustituyen las condiciones completas de N04.

Contrato fijo: respuesta de bases debe identificar explícitamente projects/barbertemplate-madre/databases/default; índices deben pertenecer a ese mismo prefijo. Rules sólo se atribuyen cuando la respuesta acredita base/release/ruleset. Un texto sin esos identificadores no supera P2. No hay código de producción ni test de reparación que requiera RED artificial.

Resultados reales conservados sin secretos ni documentos de clientes:
- Sesión Firebase disponible; no se reprodujo el 403 del entorno temporal.
- Dos bases devueltas: default (Enterprise, me-west1) y nichos-us-prod (Standard, nam5). No aparece (default) en esa respuesta. nichos-us-prod permanece intacta.
- default: 12 índices devueltos READY, sin nextPageToken; dos sobre appointments. Esto acredita inventario/estado, no suficiencia de índices para todos los consumidores ni consultas ejecutadas.
- firebase_get_security_rules devolvió texto. La herramienta no permite seleccionar database y su salida no incluye release/ruleset/base: fuente conservada SIN atribución suficiente. No se eligió ni publicó una versión de reglas.

Refutación del tramo: (1) sesión de control administrativo no prueba acceso SDK de un tenant; (2) READY no prueba consultas ni aislamiento; (3) reglas genéricas y default literal no equivalen a (default). Estos límites impiden cerrar P2/P3; no invalidan el inventario real. Sin reconstruir herramientas ni repetir diagnósticos del Firebase temporal.

## Siguiente acción necesaria y efectos aún no autorizados

Obtener de Firebase la cadena publicada de la base literal default: proyecto barbertemplate-madre, Firestore Database, seleccionar default, Rules; conservar identificador de release, ruleset y fuente mediante consulta/exportación de sólo lectura. El conector actual no proyecta esa cadena. Puede intervenir Liam o habilitar acceso de lectura que la exponga; no se deduce falta general de permisos.

Antes de pruebas con escritura falta fijar un proyecto/base aislados concretos, por elección/habilitación de Liam. No se sustituye por producción. Propuesta pendiente: tenants sintéticos n04-a y n04-b, identidades separadas, crear fixtures mínimos de config/clients/appointments y claims exclusivos de prueba; probar lectura/acción propia permitida y cruzada denegada, sin notificaciones ni pagos. Restauración: inventario/preimagen previa, eliminación sólo de IDs creados y restitución exacta de claims de prueba; nunca tocar usuarios o históricos reales. No ejecutar hasta identificar entorno, operaciones exactas y autorización. Esto no es un contrato congelado de toda N04.

Desapareció la incertidumbre sobre disponibilidad actual de lectura administrativa Firebase y existencia/índices de default. Siguen NO_VERIFICADOS: cadena publicada por base, acceso SDK efectivo, roles/claims/revocación, aislamiento y permisos reales; los demás receptores de N04 permanecen en su ficha. N06 conserva runtime alojado y N10 certificación integral. Cardcom bloqueado y prestaciones por tenant antes de desplegar intactos.

No nuevos commits de producto. Evidencia y preimágenes locales en este directorio. N03 aceptada localmente; N04 abierta, no certificada. El bloqueo de publicación es distinto del pendiente de certificación.
