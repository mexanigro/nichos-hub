# Contrato congelado — conexión de precio

Autorización de Liam: catálogo config backend porserviceId, persistir importe autorizado en reserva online; servicio/precio no verificable rechaza antes de escribir. Sin body como autoridad ni histórico retrospectivo. Único archivo: booking-handler.ts compartido.

P0:78casos452comprobaciones RED100 antes de producto. Se reutiliza pipeline middleware/registro/SDK real; fixture agrega sólo config.services id s precio150 unidades mayores. No escribe price en citas creadas. Importes browser1/99999999, full/deposit, override175, ausencia/invalidación de catálogo/precio, duplicados/visibilidad, errorlectura, cash sinprecio e histórico inmutable. 48casos anteriores mantienen expectativas; sólo catálogo cumple el nuevo prerrequisito. Mutante remove-book-price quita asignación real en memoria.
P1: lectura config mismo db; services único y visible, serviceOverrides.price explícito prioridad como consumidor vigente; número finito, cents entero representable entre50y2000000. No inferir precio del preset browser si falta catálogo backend. Reserva noonline conserva ausencia deprice. Error de lectura no escribe.
P2: GREEN contrato, mutante vuelveRED, tipos. P3: conservación y balance original, acta y commit local. Push condicionado a no deploy sigue bloqueado sin nueva garantía.

Refutación antesproducto: fuente config backend no cliente; duplicados no eligen arbitrariamente; override inválido no fallback; cero/negativo/fracción excesiva rechazan. Payload mode/precio no decide requisito; payment config determina online. Límites: SDK/HTTP locales, no disponibilidad/cobro/concurrencia reales. El bloqueo de Cardcom y seña/moneda mantienen handlers sin cambios. No nuevo framework.
