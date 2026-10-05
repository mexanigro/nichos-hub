import type { ConfigIssue } from "@/lib/config-validator";
import { CLIENT_LANGUAGE_LABELS_ES, type ClientLanguage } from "@/lib/client-language";

const IDIOMAS = ["he", "en", "ru", "ar"] as const;

/**
 * ALTA-IDIOMAS-01 (G1, D-242): la propuesta de Claude por idioma y por campo, para que el dueño acepte lo que se guarda. Sin estado
 * ni hooks: los aceptados («<idioma>:<ruta>») viven en la pestaña y cambian por `onCambio`. Un campo con error no se puede aceptar y
 * muestra su mensaje al lado; los errores de una llamada entera (path «<idioma>:») van arriba de su idioma. `descartados` (PLANTILLA-01,
 * D-258): lo que el dueño aceptó y no se guardó, con su motivo, arriba de todo: nada aceptado se descarta sin decirlo.
 */
export function PropuestaDeTextos({ propuesta, errores, aceptados, onCambio, descartados = [] }: {
  propuesta: Record<string, Record<string, unknown>>;
  errores: ConfigIssue[];
  aceptados: string[];
  onCambio: (aceptados: string[]) => void;
  descartados?: ConfigIssue[];
}) {
  const error = new Map(errores.filter((e) => e.severity === "error").map((e) => [e.path, e.message]));
  const idiomas = IDIOMAS.filter((l) => propuesta[l] || error.has(`${l}:`));
  return (
    <div className="space-y-3">
      {descartados.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="mb-1 text-[11px] font-semibold text-amber-300">No se guardó: {descartados.length}</p>
          {descartados.map((d) => (
            <p key={d.path} role="status" className="text-[11px] text-amber-200">{d.path}: {d.message}</p>
          ))}
        </div>
      )}
      {idiomas.map((l) => (
        <fieldset key={l} className="rounded-lg border border-border bg-bg-elevated p-3">
          <legend className="px-1 text-[11px] font-semibold text-text">{CLIENT_LANGUAGE_LABELS_ES[l as ClientLanguage] ?? l}</legend>
          {error.has(`${l}:`) && <p role="alert" className="mb-2 text-[11px] text-red-400">{error.get(`${l}:`)}</p>}
          <div className="space-y-2">
            {Object.entries(propuesta[l] ?? {}).map(([ruta, texto]) => {
              const campo = `${l}:${ruta}`, mensaje = error.get(campo), id = `propuesta-${campo}`;
              return (
                <div key={campo} className="flex items-start gap-2">
                  <input
                    id={id}
                    type="checkbox"
                    data-campo={campo}
                    checked={!mensaje && aceptados.includes(campo)}
                    disabled={!!mensaje}
                    onChange={(e) => onCambio(e.target.checked ? [...aceptados.filter((x) => x !== campo), campo] : aceptados.filter((x) => x !== campo))}
                    className="mt-0.5 accent-accent"
                  />
                  <label htmlFor={id} className="min-w-0 flex-1">
                    <span className="block text-[10px] text-text-muted">{ruta}</span>
                    <span className="block text-xs text-text" dir="auto">{typeof texto === "string" ? texto : JSON.stringify(texto)}</span>
                    {mensaje && <span role="alert" className="block text-[10px] text-red-400">{mensaje}</span>}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
