"use client";
import type { CSSProperties } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";
import { AutoRotatingTabs } from "./auto-rotating-tabs";

type TabKey = "dashboard" | "calendar" | "customers" | "support" | "menu" | "overview" | "appointments" | "payments";

const CRM_M: { id: TabKey; img: string }[] = [
  { id: "dashboard", img: "/landing/crm-m-dashboard.png" },
  { id: "calendar", img: "/landing/crm-m-calendar.png" },
  { id: "customers", img: "/landing/crm-m-customers.png" },
  { id: "support", img: "/landing/crm-m-support.png" },
  { id: "menu", img: "/landing/crm-m-menu.png" },
];

const CRM_D: { id: TabKey; img: string }[] = [
  { id: "overview", img: "/landing/crm-d-overview.png" },
  { id: "appointments", img: "/landing/crm-d-appointments.png" },
  { id: "payments", img: "/landing/crm-d-payments.png" },
  { id: "support", img: "/landing/crm-d-support.png" },
];

const Dots = () => <span className="dots"><i /><i /><i /></span>;

export function CrmSection() {
  const { t } = useT();
  const reveal = useReveal<HTMLElement>();
  const bulletsRef = useReveal<HTMLUListElement>();
  const tabs = (set: typeof CRM_M) => set.map((v) => ({ id: v.id, label: t.crm.tabs[v.id] }));

  return (
    <section className="at-section" id="crm" ref={reveal} data-reveal>
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row">
              <span className="dot" />
              <span className="txt">{t.crm.eyebrow}</span>
            </div>
            <h2>
              {t.crm.title}
              <em>{t.crm.titleEm}</em>
            </h2>
          </div>
          <p>{t.crm.sub}</p>
        </div>

        <div className="at-crm-wrap">
          <ul className="at-crm-bullets" ref={bulletsRef} data-stagger role="list">
            {t.crm.bullets.map((b, i) => (
              <li className="at-crm-bullet" key={i} style={{ "--si": i } as CSSProperties}>
                <span className="n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Las dos escenas van en el HTML y el CSS muestra una según el ancho: sin salto al hidratar (LANDING-01). */}
          <div className="at-crm-scene at-only-mobile">
            <AutoRotatingTabs tabs={tabs(CRM_M)} tabsClassName="at-crm-tabs" tabClassName="at-crm-tab" pauseLabel={t.crm.pause} playLabel={t.crm.play}>
              {(active, panel) => (
                <div className="at-crm-mobcard">
                  <div className="topbar"><Dots /><span className="url">crm.arzac.studio</span></div>
                  <div className="crm-imgs" {...panel}>
                    {CRM_M.map((v, i) => (
                      <Image
                        key={v.id}
                        src={v.img}
                        alt={v.id === active ? `CRM · ${t.crm.tabs[v.id]}` : ""}
                        width={390}
                        height={0}
                        sizes="(max-width: 1024px) 100vw, 390px"
                        style={{ width: "100%", height: "auto" }}
                        className={v.id === active ? "active" : ""}
                        loading={i === 0 ? undefined : "lazy"}
                      />
                    ))}
                  </div>
                </div>
              )}
            </AutoRotatingTabs>
          </div>
          <div className="at-crm-scene at-only-desktop">
            <AutoRotatingTabs tabs={tabs(CRM_D)} tabsClassName="at-crm-tabs" tabClassName="at-crm-tab" pauseLabel={t.crm.pause} playLabel={t.crm.play}>
              {(active, panel) => (
                <div className="at-crm-browser">
                  <div className="chrome"><Dots /><span className="url">crm.arzac.studio</span></div>
                  <div className="frame" {...panel}>
                    {CRM_D.map((v) => (
                      <Image
                        key={v.id}
                        src={v.img}
                        alt={v.id === active ? `CRM · ${t.crm.tabs[v.id]}` : ""}
                        fill
                        sizes="720px"
                        className={v.id === active ? "active" : ""}
                        style={{ objectFit: "cover", objectPosition: "top" }}
                        loading="lazy"
                      />
                    ))}
                  </div>
                </div>
              )}
            </AutoRotatingTabs>
          </div>
        </div>
      </div>
    </section>
  );
}
