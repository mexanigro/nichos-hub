"use client";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";

const LOGOS: { name: string; icon: JSX.Element }[] = [
  {
    name: "Google",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09A6.68 6.68 0 0 1 5.5 12c0-.72.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    name: "Calendar",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M19 4h-1V3a1 1 0 0 0-2 0v1H8V3a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm1 15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9h16v9zm0-11H4V7a1 1 0 0 1 1-1h1v1a1 1 0 0 0 2 0V6h8v1a1 1 0 0 0 2 0V6h1a1 1 0 0 1 1 1v1z" />
        <rect x="7" y="12" width="3" height="2.5" rx="0.5" />
        <rect x="12" y="12" width="3" height="2.5" rx="0.5" />
        <rect x="7" y="16" width="3" height="2.5" rx="0.5" />
      </svg>
    ),
  },
  {
    name: "Sheets",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8 13h3v2H8v-2zm0 3h3v2H8v-2zm5-3h3v2h-3v-2zm0 3h3v2h-3v-2zm-5-6h8v2H8v-2z" />
      </svg>
    ),
  },
  {
    name: "Gemini",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3.5L14.5 12 12 18.5 9.5 12 12 5.5z" />
        <path d="M12 2v7.5L14.5 12 12 18.5V22c5.52 0 10-4.48 10-10S17.52 2 12 2z" opacity="0.6" />
      </svg>
    ),
  },
  {
    name: "OpenAI",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M22.28 9.37a5.93 5.93 0 0 0-.51-4.89 6.01 6.01 0 0 0-6.47-2.87A5.96 5.96 0 0 0 10.82 0a6.02 6.02 0 0 0-5.74 4.16 5.96 5.96 0 0 0-3.98 2.89 6.01 6.01 0 0 0 .74 7.05 5.93 5.93 0 0 0 .51 4.89A6.01 6.01 0 0 0 8.82 21.86 5.96 5.96 0 0 0 13.3 24a6.02 6.02 0 0 0 5.74-4.16 5.96 5.96 0 0 0 3.98-2.89 6.01 6.01 0 0 0-.74-7.58zm-8.98 13.15a4.5 4.5 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .39-.67v-6.74l2.02 1.17a.07.07 0 0 1 .04.06v5.58a4.51 4.51 0 0 1-4.5 4.48zM3.6 18.34a4.47 4.47 0 0 1-.54-3.03l.14.09 4.78 2.76a.78.78 0 0 0 .78 0l5.83-3.37v2.33a.07.07 0 0 1-.03.06l-4.83 2.79a4.51 4.51 0 0 1-6.13-1.63zM2.34 7.88A4.49 4.49 0 0 1 4.7 5.9v5.69a.78.78 0 0 0 .39.67l5.83 3.37-2.02 1.17a.07.07 0 0 1-.07 0L4 13.99A4.51 4.51 0 0 1 2.34 7.88zm17.32 4.03-5.83-3.37 2.02-1.16a.07.07 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.7 8.12v-5.71a.78.78 0 0 0-.39-.67zM21.67 9.7l-.14-.09-4.78-2.76a.78.78 0 0 0-.78 0l-5.83 3.37V7.89a.07.07 0 0 1 .03-.06L15 5.04a4.51 4.51 0 0 1 6.68 4.67zM7.64 13.32 5.62 12.15a.07.07 0 0 1-.04-.06V6.52a4.51 4.51 0 0 1 7.38-3.44l-.14.08-4.78 2.76a.78.78 0 0 0-.39.67v6.73zm1.1-2.37 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5v-3z" />
      </svg>
    ),
  },
  {
    name: "Claude",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM7.17 6.17a1.25 1.25 0 1 1 1.77 1.77 1.25 1.25 0 0 1-1.77-1.77zm9.66 0a1.25 1.25 0 1 1 1.77 1.77 1.25 1.25 0 0 1-1.77-1.77zM4.5 11a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm15 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM7.17 16.06a1.25 1.25 0 1 1 1.77 1.77 1.25 1.25 0 0 1-1.77-1.77zm9.66 0a1.25 1.25 0 1 1 1.77 1.77 1.25 1.25 0 0 1-1.77-1.77zM12 17a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 17z" />
      </svg>
    ),
  },
  {
    name: "Meta",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M6.92 6C4.27 6 2.51 8.33 1.72 10.53c-1.1 3.06-.68 6.29 1.84 7.75a3.68 3.68 0 0 0 4.06-.3c.93-.8 1.64-2 2.38-3.63.62-1.4 1.28-3.07 2-4.27A4.44 4.44 0 0 1 15.6 8a3.3 3.3 0 0 1 2.52.77c1.26 1.1 1.93 3.15 1.74 5.57-.14 1.8-.78 3.45-1.6 4.5a.5.5 0 0 0 .8.6c1-1.27 1.74-3.13 1.9-5.14.22-2.75-.58-5.14-2.16-6.52A4.29 4.29 0 0 0 15.6 7c-2.04 0-3.38 1.28-4.38 2.96-.77 1.3-1.44 3-2.04 4.36-.7 1.53-1.33 2.62-2.08 3.27a2.68 2.68 0 0 1-2.95.19c-2.02-1.17-2.38-3.87-1.4-6.6C3.47 9.1 5 7 6.92 7a3.32 3.32 0 0 1 2.1.8.5.5 0 0 0 .66-.76A4.32 4.32 0 0 0 6.92 6z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07a8.16 8.16 0 0 1-2.4-1.48 9 9 0 0 1-1.66-2.07c-.17-.3 0-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.91-2.2-.24-.57-.49-.5-.67-.5h-.57a1.1 1.1 0 0 0-.8.37A3.36 3.36 0 0 0 6.97 9.3a5.84 5.84 0 0 0 1.22 3.1 13.4 13.4 0 0 0 5.11 4.52 5.96 5.96 0 0 0 1.99.74 4.8 4.8 0 0 0 2.2-.14 3.1 3.1 0 0 0 2.03-1.43c.23-.4.23-.74.16-.82-.07-.07-.27-.17-.57-.32zM12.05 21.5a9.47 9.47 0 0 1-4.83-1.32l-.35-.2-3.6.94.97-3.52-.23-.36a9.43 9.43 0 0 1-1.45-5.03A9.5 9.5 0 0 1 12.05 2.5a9.44 9.44 0 0 1 6.7 2.78 9.44 9.44 0 0 1 2.78 6.72 9.5 9.5 0 0 1-9.48 9.5zM12.05 1A10.95 10.95 0 0 0 1.56 12.01c0 1.94.51 3.83 1.47 5.5L1.5 23l5.63-1.47a10.95 10.95 0 0 0 15.37-10 10.95 10.95 0 0 0-10.44-10.52z" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M12 2L2 19.5h20L12 2z" />
      </svg>
    ),
  },
  {
    name: "Firebase",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M4.53 20.2 6.27 3.57a.43.43 0 0 1 .79-.18l1.85 3.47-2.67 5.01L4.53 20.2zm15.1-.63L17.4 5.56a.44.44 0 0 0-.76-.15l-12.32 15 5.77 3.27a1.28 1.28 0 0 0 1.26 0l8.28-4.11zM14.78 7.05l-1.83-3.5a.43.43 0 0 0-.77 0l-5.94 11.13 8.54-7.63z" />
      </svg>
    ),
  },
  {
    name: "Twilio",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm-1.5-9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
      </svg>
    ),
  },
  {
    name: "ElevenLabs",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="at-stack-icon">
        <rect x="9" y="4" width="2.5" height="16" rx="1.25" />
        <rect x="13.5" y="4" width="2.5" height="16" rx="1.25" />
      </svg>
    ),
  },
];

export function TechStack() {
  const { t } = useT();
  const ref = useReveal<HTMLElement>();

  const row = LOGOS.map((l, i) => (
    <span className="at-stack-item" key={i} aria-label={l.name}>
      {l.icon}
      <span className="at-stack-label">{l.name}</span>
    </span>
  ));

  return (
    <section
      className="at-section at-stack-section"
      ref={ref}
      aria-label={t.techStack?.eyebrow ?? "Tech stack"}
    >
      <div className="container">
        <div className="at-section-head">
          <div className="eyebrow-row">
            <span className="dot" />
            <span className="txt">{t.techStack?.eyebrow ?? "Tech stack"}</span>
          </div>
          <h2>
            {t.techStack?.title ?? "Herramientas que "}
            <em>{t.techStack?.titleEm ?? "potencian tu negocio."}</em>
          </h2>
        </div>
      </div>

      <div className="at-stack-track" aria-hidden="true">
        <div className="at-stack-scroll">
          {row}
          {row}
        </div>
      </div>
    </section>
  );
}
