# SP-H01 — revisión y causa de omisión

Procedencia: hallazgo SP-H01 recibido del usuario, con autorización expresa de reapertura y adenda dentro de health-v1. Revisor independiente /root/refutar_soporte, lectura en esta sesión. Principal integra y ejecuta. Método r2 F090F5F8E5429BC7FCB74D187E105A14E3D1153D37D40B9036436B0E885B0C7D.

La revisión anterior no cubrió la pérdida de protecciones por el cambio de orden: comparó cuerpos de rutas, disponibilidad y exposición, pero no los middleware atravesados. El revisor confirmó esa omisión. Single-flight protege solicitudes concurrentes pendientes; no evita una lectura nueva por cada solicitud sucesiva. La reproducción actual muestra200 tras superar3 solicitudes y nuevos eventos loader/read en ambos runtimes, incluido HEAD. Queda invalidada la conclusión anterior de suficiencia del cierre para esta protección, no las pruebas de reservas/soporte/stock ni la semántica de bootstrap ya comprobada.

Refutación preparatoria: dos MATERIAL integrados antes de freeze: sondear arranque por live (sin consumir cuota de la población) y cubrir HEAD automático de Express. Sin BLOCKERS. Alcance de la reparación finito: reutilizar la función real de cada runtime bajo el mismo montaje /api, antes de la sonda. El prefijo /API comparte bucket; no normalizar case/trailing de ruta ni cambiar confianza de cabeceras IP.

Segunda revisión, tres ángulos: orden efectivo y efectos (headers→limitador→readiness, respuesta429 termina antes de DB); compatibilidad (ventanas/config/IP y live disponibles durante fallo); conservación y claridad (sólo argumento adicional en cada bootstrap, Router en módulo común, otros handlers y constantes intactos). Veredicto de lectura: sin BLOCKERS ni MATERIAL demostrables. No sustituye las corridas finales.

Política de live revisada explícitamente: señal pública constante sin cuota, no carga/consulta DB ni consume cuota de health, tampoco atraviesa bootstrap funcional o tenant. Se conserva la capacidad de observar el proceso bajo exceso de health. No se interpreta como capacidad operativa.

Límite heredado: memoria por instancia/proceso, no cuota distribuida, con identificación IP preexistente. No se certifica resistencia general a abuso, otros endpoints ni operación remota. Configuraciones inválidas y políticas de confianza IP no se reescriben en este hallazgo. Aislamiento y configuración saneada del arnés anterior conservados.

Detector de bucles: RED específico→corrección→GREEN específico, sin intentos fallidos repetidos ni ampliación. Variantes de desarme/inicialización viven sólo en copias. Regresión de health se repite porque cambió su middleware; book/support/stock y controles de estado interno sin cambios se conservan mediante huellas y AST.
