# L02 — preparación autorizada, no reparación

Orden de Liam: preparar únicamente POST /api/onboarding/client-info según SIGUIENTE-ACCION de W-NEXT/aceptacion-local. N03 abierta. Techo 85% TOTAL compartido, inicio observado 82%, sin resets. No instalaciones, DB/notificaciones reales, red externa, push ni deploy.

P0: verificar fuentes ya identificadas, conservar preimágenes y censo del producto. Resultado: insumos vigentes y aislamiento disponible.
P1: ejecutar el handler y consumidor reales en copia con SDK instalado; capturar write protobuf, máscara y transforms. Matriz alta/reedición con config/hub ausentes/existentes y guardias. Resultado: RED por valores anidados ausentes o antiguos, no por error del instrumento.
P2: contrastar literal/anidado mediante sondas de SDK (sin alterar handler), comprobar conservación y sensibilidad y refutar el plan. Resultado: instrumento distingue ambas representaciones y mantiene límites explícitos.
P3: entregar solución mínima concreta de un archivo, controles exigibles para reparación futura y registrar preparación sin descontar L02. Resultado: expediente revisable y producto/evidencia previa conservados.

Acceptance Contract de preparación: GREEN sólo si P0-P3 completos, ejecución RED semántica con exit diferenciado, fuentes y producto intactos, sin BLOCKERS no resueltos. El contrato de producto permanece RED y no se modifica para favorecer el código actual.

Oracle futuro: campos emitidos por el patch deben actualizar mapas anidados; hojas y hermanos fuera del patch se preservan. Defaults business.type=estetica, mode=team, name vacío y brandingInput.colors vacío siguen emitiéndose en omisión. Arrays son hojas, no rutas por índice. serverTimestamp/increment/delete se contrastan con SDK real sin clonación JSON del parche. Lector real sólo acredita campos que hidrata; imágenes y hub_clients se verifican aparte.

Aislamiento: imagen Node ya instalada, network none, env sintético, fuentes/dependencias read-only. DB reemplazada únicamente en frontera; cada set usa WriteBatch.set real sin commit. Materialización local usa segmentos de máscaras del SDK, nunca split de strings punteados. Transforms contrastados en proto y modelados sólo para estos casos sintéticos. No acredita persistencia, reglas, atomicidad, latencia, concurrencia ni entrega real.

Refutación prevista: 1) deuda y defaults; 2) fidelidad SDK/lector y rutas ausentes; 3) adversarial conservación/guardias/sentinelas. Sin migraciones, sin otros escritores L02, sin L01 ni L12. N04/N08/N10 y condición previa al despliegue sobre prestaciones por tenant intactas. Alcance de preparación congelado antes del arnés; detalles del instrumento pueden corregirse sin redefinir expectativas.
