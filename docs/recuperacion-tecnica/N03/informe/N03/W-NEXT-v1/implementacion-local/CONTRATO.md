# W-NEXT — implementación autorizada del renombrado único

Liam acepta la preparación comparativa y autoriza exclusivamente src/middleware.ts → src/proxy.ts del hub, conservando exactamente sus bytes. No modificar auth.config,matcher,permisos,dependencias ni otro producto. Preparación aceptada: ../comparacion-local/INFORME-COMPARATIVO.md; comparación129 por variante y mutante14 rechazos reutilizados, no reejecutados. Consumo inicial81%, techo85% TOTAL N03 compartido,sin resets. No push,deploy,instalaciones,credenciales reales,red externa ni otros efectos externos. No abrir otra reparación. N03 sigue abierta; etapas posteriores y condición sobre prestaciones por tenant antes de despliegue conservadas.

## Plan finito y gates

- P0: verificar fuentes actuales contra preparación aceptada, custodiar preimagen física, inventario src/configs y estado Git; RED porque aún existe middleware y no proxy; fijar este alcance y freeze antes del movimiento.
- P1: renombrar sólo el archivo dentro de src. Observable: ausencia de middleware.ts, presencia de proxy.ts,bytes idénticos y resto del producto conservado.
- P2: copiar proxy FINAL y auth.config real a copia mínima fresca; ejecutar runner.cjs y ejecutar.ps1 aceptados sin cambios. Nuevo build Next,registro Node,matcher y129 casos HTTP. Tipos con tsconfig real del hub y población proxy/auth.config/next-env; lint recomendaciones instaladas Next/core-web-vitals y TypeScript sobre proxy/auth.config, sin config de producto modificada. Cero errores y advertencias.
- P3/DONE: comparar salida HTTP con referencia aceptada y reutilizar mutación comprobada por huellas; verificar conservación,nombre único,registro,aislamiento,custodia,claridad y registros; entregar W-NEXT para revisión. No iniciar otra reparación.

## Acceptance Contract

GREEN requiere P0–P3 y: renombrado exacto; fuentes/config/dependencias vigentes; no delta adicional de src; arnés y expectativas idénticos a preparación; build/HTTP129 sin fallos y equivalente a referencia; Node registrado,matcher idéntico e inclusión/exclusión efectiva; ausencia de advertencia de convención; tipos/lint pertinentes exit0; mutación aceptada intacta con14rechazos perdidos; sin efectos externos. RED si falta una condición. Antes del movimiento, check de nombre da RED1 por ausencia de proxy/presencia de middleware; el caso correcto ya está acreditado en copia aceptada. No cambiar expectativas para obtener GREEN.

Refutación reutilizada y ampliada sólo para el nuevo movimiento: revisor refutacion_wnext,solo lectura. MATERIAL: no confundir tipos del arnés ES2022 con tsconfig hub ES2017; se resuelve extendiendo la configuración vigente en un tsconfig del expediente con include acotado e incremental false. Lint es acotado con recomendaciones existentes,no npm run lint del hub. Vigencia,identidad de copia final y hash del runner se verifican. Sin BLOCKER nuevo antes del movimiento; la evidencia final se exige antes de cierre.

Límites conservados: HTTP usa aplicación mínima/Linux/webpack/NextAuth real con sesiones sintéticas. No certifica app completa,Google OAuth,auth.ts de login,entorno real,otros métodos HTTP o RSC completos ni despliegue. Se conserva el texto interno del archivo incluso donde dice middleware para cumplir igualdad de bytes. Preimagen permite reversa por renombrado inverso si se ordenara; no se restaura automáticamente sobre trabajo simultáneo.

Freeze: este contrato,huellas de fuentes,instrumentos y aceptación fijados antes de P1. La orden actual cubre implementación y comprobaciones descritas; no requiere nueva aprobación para el mismo alcance. STOP ante ampliación necesaria,techo85% o freno de dos ciclos sin avance; conservar causa/evidencias. No cerrar N03.
