import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const clientId = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !clientId) {
    const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    return NextResponse.redirect(`${base}/clients/${clientId ?? ""}?calendarError=auth_failed`);
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!googleClientId || !googleSecret || !redirectUri) {
    return NextResponse.json({ error: "Google Calendar not configured on server" }, { status: 503 });
  }

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[calendar/callback] Token exchange failed:", err);
      const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
      return NextResponse.redirect(`${base}/clients/${clientId}?calendarError=token_failed`);
    }

    const tokens = await tokenRes.json();

    await db.collection("calendar_config").doc(clientId).set({
      clientId,
      enabled: true,
      calendarId: "primary",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: Date.now() + (tokens.expires_in ?? 3600) * 1000,
      connectedAt: new Date().toISOString(),
    });

    console.log(`[calendar/callback] Calendar connected for ${clientId}`);
    const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    return NextResponse.redirect(`${base}/clients/${clientId}?tab=whatsapp&calendarConnected=true`);
  } catch (err) {
    console.error("[calendar/callback] Error:", err);
    const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    return NextResponse.redirect(`${base}/clients/${clientId}?calendarError=server_error`);
  }
}
