"use client";

import { useState, useCallback } from "react";

/**
 * Inline field-level error. Solo se muestra DESPUES del primer blur del
 * usuario — no asusta apenas empieza a tipear.
 *
 * Uso:
 *   const { error, onBlur } = useFieldValidation(data.email, (v) => {
 *     if (!v.includes("@")) return "Falta el @ en tu email";
 *     return null;
 *   });
 *   <input value={data.email} onChange={...} onBlur={onBlur} />
 *   <FieldError message={error} />
 */
export function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="wiz-field-error">{message}</p>;
}

export function useFieldValidation(
  value: string,
  validator: (v: string) => string | null,
) {
  const [touched, setTouched] = useState(false);
  const onBlur = useCallback(() => setTouched(true), []);
  const error = touched && value ? validator(value) : null;
  return { error, onBlur, setTouched };
}
