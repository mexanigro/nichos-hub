export const SANDBOX = process.env.CARDCOM_SANDBOX === "true";
const SANDBOX_TERMINAL = "1000";
const SANDBOX_API_NAME = "CardTest1994";

const TERMINAL = SANDBOX ? SANDBOX_TERMINAL : (process.env.CARDCOM_TERMINAL ?? "");
const API_NAME = SANDBOX ? SANDBOX_API_NAME : (process.env.CARDCOM_API_NAME ?? "");

if (SANDBOX) {
  console.warn("[cardcom] ⚠ SANDBOX MODE — terminal 1000, no real charges");
}

const SENSITIVE_KEYS = new Set([
  "Token", "TokenResponse", "CardNumber", "CardNumber5",
  "CardValidityMonth", "CardValidityYear", "TokenExDate",
  "CVV", "cvv", "Id", "IdentityNumber",
]);

function redactSensitive(obj: Record<string, string>): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    safe[k] = SENSITIVE_KEYS.has(k) ? "[REDACTED]" : v;
  }
  return safe;
}

const BASE_URL = process.env.NEXTAUTH_URL || "https://arzac.studio";

interface CreatePaymentParams {
  amount: number;
  clientId: string;
  productName: string;
  language: "he" | "en";
  /** Override ruta de exito (default: /pago/success) */
  successPath?: string;
  /** Override ruta de error (default: /pago/error) */
  errorPath?: string;
  /** Path absoluto al endpoint que Cardcom llamara server-to-server (default: /api/cardcom/webhook) */
  indicatorPath?: string;
}

interface CreatePaymentResult {
  success: boolean;
  url?: string;
  lowProfileCode?: string;
  error?: string;
}

/**
 * Crea una sesion Low Profile con Operation=1 (cobro + creacion de token).
 * El token devuelto en el verify se usa luego para cobros recurrentes via
 * ChargeToken. Tambien envia IndicatorUrl para que Cardcom dispare el webhook
 * server-to-server cuando el pago se completa (cubre el caso donde el usuario
 * cierra el browser antes del verify client-side).
 */
export async function createLowProfilePayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  if (!TERMINAL || !API_NAME) {
    return { success: false, error: "Cardcom not configured" };
  }

  const body = new URLSearchParams({
    TerminalNumber: TERMINAL,
    UserName: API_NAME,
    APIName: API_NAME,
    SumToBill: params.amount.toString(),
    CoinID: "1",
    Language: params.language,
    Operation: "1", // charge + create token (Cardcom: "Billing and creating a token")
    CodePage: "65001",
    SuccessRedirectUrl: `${BASE_URL}${params.successPath || "/pago/success"}`,
    ErrorRedirectUrl: `${BASE_URL}${params.errorPath || "/pago/error"}`,
    IndicatorUrl: `${BASE_URL}${params.indicatorPath || "/api/cardcom/webhook"}`,
    ReturnValue: params.clientId,
    ProductName: params.productName,
  });

  let res: Response;
  try {
    res = await fetch("https://secure.cardcom.solutions/Interface/LowProfile.aspx", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    console.error("[cardcom] network error creating payment:", e);
    return { success: false, error: "Could not reach Cardcom" };
  }

  const text = await res.text();
  const parsed = Object.fromEntries(new URLSearchParams(text));

  const profileUrl = parsed.url || parsed.Url;
  if (parsed.ResponseCode === "0" && profileUrl) {
    return { success: true, url: profileUrl, lowProfileCode: parsed.LowProfileCode };
  }

  console.error("[cardcom] create failed:", redactSensitive(parsed));
  return { success: false, error: parsed.Description || "Cardcom error" };
}

export interface VerifyPaymentResult {
  success: boolean;
  transactionId?: string;
  cardLastFour?: string;
  /** GUID del token de cobro recurrente (solo presente si Operation=1). */
  token?: string;
  /** Vigencia del token. Formato MM/YY desde Cardcom (CardValidityMonth + CardValidityYear). */
  cardValidityMonth?: string;
  cardValidityYear?: string;
  /** Codigo de aprobacion del shva — util para reconciliacion. */
  approvalNumber?: string;
  /** ReturnValue que se envio en el create (nuestro leadId). */
  returnValue?: string;
  /**
   * Monto efectivamente cobrado en NIS. Verificado contra sandbox real:
   * Cardcom lo devuelve en `ExtShvaParams.Sum36` en agorot (7.7 NIS → "770").
   * undefined si el campo no vino o no es numerico.
   */
  amount?: number;
  /** Raw response — guardado en Firestore para auditoria. */
  raw?: Record<string, string>;
  error?: string;
}

export async function verifyPayment(lowProfileCode: string): Promise<VerifyPaymentResult> {
  if (!TERMINAL || !API_NAME) {
    return { success: false, error: "Cardcom not configured" };
  }

  const url = new URL("https://secure.cardcom.solutions/Interface/BillGoldGetLowProfileIndicator.aspx");
  url.searchParams.set("terminalnumber", TERMINAL);
  url.searchParams.set("username", API_NAME);
  url.searchParams.set("lowprofilecode", lowProfileCode);

  let res: Response;
  try {
    res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
  } catch (e) {
    console.error("[cardcom] network error verifying payment:", e);
    return { success: false, error: "Could not reach Cardcom" };
  }

  const text = await res.text();
  const parsed = Object.fromEntries(new URLSearchParams(text));

  // Cardcom returns "DealResponse" in some versions, "DealRespone" (typo) in others
  const dealResponse = parsed.DealResponse ?? parsed.DealRespone;
  if (parsed.OperationResponse === "0" && dealResponse === "0") {
    // Monto cobrado: SHVA field 36, en agorot (verificado contra sandbox).
    const sum36 = parsed["ExtShvaParams.Sum36"] ?? parsed.Sum36;
    const amount =
      sum36 !== undefined && sum36 !== "" && Number.isFinite(Number(sum36))
        ? Number(sum36) / 100
        : undefined;
    return {
      success: true,
      amount,
      transactionId: parsed.InternalDealNumber || undefined,
      cardLastFour: parsed.CardNumber?.slice(-4) || parsed.CardNumber5?.slice(-4) || parsed["ExtShvaParams.CardNumber5"]?.slice(-4) || undefined,
      token: parsed.Token || parsed.TokenResponse || parsed["ExtShvaParams.CardToken"] || undefined,
      cardValidityMonth: parsed.CardValidityMonth || parsed.TokenExDate?.slice(0, 2) || undefined,
      cardValidityYear: parsed.CardValidityYear || parsed.TokenExDate?.slice(2, 4) || undefined,
      approvalNumber: parsed.ApprovalNumber || parsed["ExtShvaParams.ApprovalNumber"] || parsed["ExtShvaParams.ApprovalNumber71"] || undefined,
      returnValue: parsed.ReturnValue || undefined,
      raw: parsed,
    };
  }

  console.error("[cardcom] verify failed:", redactSensitive(parsed));
  return { success: false, error: parsed.OperationResponseText || "Verification failed", raw: parsed };
}

interface ChargeTokenParams {
  /** GUID del token guardado de un cobro anterior. */
  token: string;
  /** MM (01-12). */
  cardValidityMonth: string;
  /** YY (24-99). */
  cardValidityYear: string;
  amount: number;
  productName: string;
  /** Email del cliente — Cardcom puede mandar la factura/recibo. */
  customerEmail?: string;
  customerName?: string;
  language?: "he" | "en";
  /** Identificador del cobro de nuestro lado — viaja como ReturnValue. */
  externalId?: string;
}

export interface ChargeTokenResult {
  success: boolean;
  transactionId?: string;
  approvalNumber?: string;
  raw?: Record<string, string>;
  error?: string;
}

/**
 * Cobra un token existente. Se usa desde el cron mensual para hacer los cobros
 * recurrentes de la suscripcion. Idempotencia: pasar el mismo `externalId`
 * NO previene dobles cobros del lado Cardcom — la idempotencia se controla
 * desde nuestro Firestore (no llamar a chargeToken dos veces para el mismo
 * mes facturado).
 */
export async function chargeToken(params: ChargeTokenParams): Promise<ChargeTokenResult> {
  if (!TERMINAL || !API_NAME) {
    return { success: false, error: "Cardcom not configured" };
  }

  const body = new URLSearchParams({
    terminalnumber: TERMINAL,
    username: API_NAME,
    codepage: "65001",
    "TokenToCharge.Token": params.token,
    "TokenToCharge.CardValidityMonth": params.cardValidityMonth,
    "TokenToCharge.CardValidityYear": params.cardValidityYear,
    "TokenToCharge.SumToBill": params.amount.toString(),
    "TokenToCharge.CoinID": "1",
    "TokenToCharge.UniqAsmachta": params.externalId || "",
    "TokenToCharge.IdentityNumber": "",
    "TokenToCharge.APILevel": "10",
    "InvoiceHead.CustName": params.customerName || "",
    "InvoiceHead.SendByEmail": params.customerEmail ? "true" : "false",
    "InvoiceHead.Email": params.customerEmail || "",
    "InvoiceHead.Language": params.language || "he",
    "InvoiceHead.CoinID": "1",
    "InvoiceLines.Description": params.productName,
    "InvoiceLines.Price": params.amount.toString(),
    "InvoiceLines.Quantity": "1",
  });

  let res: Response;
  try {
    res = await fetch("https://secure.cardcom.solutions/Interface/ChargeToken.aspx", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    console.error("[cardcom] network error charging token:", e);
    return { success: false, error: "Could not reach Cardcom" };
  }

  const text = await res.text();
  const parsed = Object.fromEntries(new URLSearchParams(text));

  if (parsed.ResponseCode === "0") {
    return {
      success: true,
      transactionId: parsed.InternalDealNumber || undefined,
      approvalNumber: parsed.ApprovalNumber || undefined,
      raw: parsed,
    };
  }

  console.error("[cardcom] charge token failed:", redactSensitive(parsed));
  return {
    success: false,
    error: parsed.Description || parsed.ResponseDescription || "Charge failed",
    raw: parsed,
  };
}
