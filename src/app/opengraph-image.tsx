import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Arzac Studio — Websites for Local Businesses in Israel";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#09090b",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "rgba(255,255,255,0.5)",
              fontSize: "16px",
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
            }}
          >
            Studio · Web + CRM + WhatsApp AI
          </div>

          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-2px",
              display: "flex",
            }}
          >
            Arzac Studio
          </div>

          <div
            style={{
              fontSize: "26px",
              color: "rgba(255,255,255,0.6)",
              maxWidth: "700px",
              textAlign: "center",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            Professional websites for local businesses in Israel
          </div>

          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "24px",
              color: "rgba(255,255,255,0.35)",
              fontSize: "15px",
              letterSpacing: "1px",
            }}
          >
            <span style={{ display: "flex" }}>Zero setup</span>
            <span style={{ display: "flex" }}>·</span>
            <span style={{ display: "flex" }}>From ₪790/mo</span>
            <span style={{ display: "flex" }}>·</span>
            <span style={{ display: "flex" }}>Live in 48h</span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "28px",
            display: "flex",
            color: "rgba(255,255,255,0.25)",
            fontSize: "14px",
            letterSpacing: "1px",
          }}
        >
          arzac.studio
        </div>
      </div>
    ),
    { ...size }
  );
}
