/**
 * CRM-04 (D-341): un email de un dominio reservado para ejemplos y pruebas (RFC 2606 y RFC 6761): example.com, example.org,
 * example.net y sus subdominios, y los dominios de primer nivel .example, .test, .invalid y .localhost. El alta no lo registra
 * como dueña ni lo usa para avisos (el `hello@example.com` del preset de PRESET-01, D-86, quedó de dueña en la demo).
 */
export function esEmailReservado(email: unknown): boolean {
  const dominio = String(email ?? "").trim().toLowerCase().split("@").pop() ?? "";
  const partes = dominio.split(".");
  const tld = partes[partes.length - 1];
  if (["example", "test", "invalid", "localhost"].includes(tld)) return true;
  const raiz = partes.slice(-2).join(".");
  return ["example.com", "example.org", "example.net"].includes(raiz);
}
