"use client";
import { LandingI18nProvider, useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { LEGAL } from "@/lib/i18n/legal";
import { precio } from "@/lib/i18n/precios";
import { LogoMark } from "./logo-mark";
import { LangSwitch } from "./lang-switch";

const EMAIL = "website@arzac.studio";

function Contenido({ doc }: { doc: "terms" | "privacy" }) {
  const { locale } = useT();
  const L = LEGAL[locale];
  const d = L[doc];
  const conPrecio = (s: string) => s.split("{precio}").join(precio(locale));
  return (
    <div className="at at-legal" dir={RTL_LOCALES.includes(locale) ? "rtl" : "ltr"} lang={locale}>
      <header className="at-legal-head">
        <div className="container at-legal-bar">
          <a className="at-brand" href="/">
            <LogoMark size={22} color="var(--at-ink)" />
            <span className="wm">Arzac <em>studio</em></span>
          </a>
          <LangSwitch />
        </div>
      </header>
      <main className="container at-legal-main">
        <h1>{d.title}</h1>
        <p className="at-legal-updated">{L.updated}</p>
        {d.sections.map((s, i) => (
          <section key={i}>
            <h2>{s.h}</h2>
            {s.p?.map((p, j) => <p key={j}>{conPrecio(p)}</p>)}
            {s.li && <ul>{s.li.map((li, j) => <li key={j}>{conPrecio(li)}</li>)}</ul>}
          </section>
        ))}
        <section>
          <p>{L.contactEmail} <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.</p>
          <p className="at-legal-note">{L.prevalece}</p>
        </section>
        <a className="at-legal-back" href="/">{L.back}</a>
      </main>
    </div>
  );
}

export function LegalPage({ doc }: { doc: "terms" | "privacy" }) {
  return (
    <LandingI18nProvider>
      <Contenido doc={doc} />
    </LandingI18nProvider>
  );
}
