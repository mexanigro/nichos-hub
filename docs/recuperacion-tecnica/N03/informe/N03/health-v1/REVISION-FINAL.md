# Revisión final y procedencia

Revisor independiente: /root/refutar_soporte (Harvey), lectura del plan, arnés, producto y diff contra preimágenes durante esta sesión. Principal: integración y ejecución. No se presenta consenso como prueba de funcionamiento.

Tres ángulos: (1) bootstrap y dependencia: señales antes del registro, complete posterior al setup/diagnóstico, fallo bloquea rutas parciales, lectura pendiente compartida con plazo; (2) consumidor y exposición: monitor real conserva 200/status ok, 503 rechaza, cuerpos genéricos y sin tenant; (3) conservación y claridad: loader trasladado sin cambio de cuerpo, Gemini opcional, funciones nuevas usadas y sin ramas/campos muertos demostrados. Veredicto independiente: sin BLOCKERS ni MATERIAL. NON-BLOCKING: título Express sobre loader; se corrigió con preimagen, sin alterar AST ejecutado.

Primera implementación: green-r1 89PASS/10FAIL detectó Gemini todavía requerido por una sustitución textual no aplicada; corrección puntual y green-r2 99PASS/0FAIL. No se cambió el contrato. Revisión de claridad también eliminó diagnóstico duplicado en server y ajustó sangría.

Conservación: el comparador textual de nodos señaló únicamente sangría del fallback SPA. Se conservó esa evidencia como hallazgo del instrumento; la comparación de AST normalizado no cambia el criterio funcional. Primer intento del normalizador tuvo una sustitución demasiado amplia (CONSERVACION-AST, error); se corrigió exactamente ese punto en archivo nuevo (CONSERVACION-AST-r2, exit0). No cambios adicionales de producto. 37/40 otras rutas iguales por AST; loader API igual por AST; 328/330 fuentes previas idénticas en bytes, sólo server/api modificados, nuevo módulo de salud. Contrato congelado exacto. Book/support/stock, consumidores y políticas tenant conservados.

Detector de bucles: cada corrección respondió a evidencia nueva concreta y produjo avance verificable; no quedan ciclos repetidos ni soluciones temporales en producto. Variantes de inicialización incompleta y mutación existen únicamente en copias controladas, nunca en fuentes finales.

Límites: pruebas locales de runtime completo con SDK Admin controlado, no transacciones/persistencia remota ni todas las funciones base. No se certifican paquetes opcionales desinstalados, Vite/HMR, despliegues o recorridos ajenos. Cero intentos observados corresponde al arranque y señales probados, con hooks de fetch/HTTP(S)/socket/DNS/UDP y aislamiento network none.
