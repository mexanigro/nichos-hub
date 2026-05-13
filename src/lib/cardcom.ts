const TERMINAL = process.env.CARDCOM_TERMINAL!;
const API_NAME = process.env.CARDCOM_API_NAME!;

const BASE_URL = process.env.NEXTAUTH_URL || "https://arzac.studio";

interface CreatePaymentParams {
  amount: number;
  clientId: string;
  productName: string;
  language: "he" | "en";
}

interface CreatePaymentResult {
  success: boolean;
  url?: string;
  lowProfileCode?: string;
  error?: string;
}

export async function createLowProfilePayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
  const body = new URLSearchParams({
    TerminalNumber: TERMINAL,
    UserName: API_NAME,
    APIName: API_NAME,
    SumToBill: params.amount.toString(),
    CoinID: "1",
    Language: params.language,
    Operation: "1",
    CodePage: "65001",
    SuccessRedirectUrl: `${BASE_URL}/pago/success`,
    ErrorRedirectUrl: `${BASE_URL}/pago/error`,
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

  console.error("[cardcom] create failed:", parsed);
  return { success: false, error: parsed.Description || "Cardcom error" };
}

interface VerifyPaymentResult {
  success: boolean;
  transactionId?: string;
  cardLastFour?: string;
  error?: string;
}

export async function verifyPayment(lowProfileCode: string): Promise<VerifyPaymentResult> {
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

  const dealResponse = parsed.DealResponse ?? parsed.DealRespone;
  if (parsed.OperationResponse === "0" && dealResponse === "0") {
    return {
      success: true,
      transactionId: parsed.InternalDealNumber || undefined,
      cardLastFour: parsed.CardNumber?.slice(-4) || parsed.CardNumber5?.slice(-4) || undefined,
    };
  }

  console.error("[cardcom] verify failed:", parsed);
  return { success: false, error: parsed.OperationResponseText || "Verification failed" };
}
