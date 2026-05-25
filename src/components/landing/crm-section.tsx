"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";

const CRM_M = [
  { id: "dashboard", label: "Today", img: "/landing/crm-m-dashboard.png" },
  { id: "calendar", label: "Calendar", img: "/landing/crm-m-calendar.png" },
  { id: "customers", label: "Customers", img: "/landing/crm-m-customers.png" },
  { id: "assistant", label: "AI assist", img: "/landing/crm-m-assistant.png" },
  { id: "support", label: "Support", img: "/landing/crm-m-support.png" },
  { id: "menu", label: "Menu", img: "/landing/crm-m-menu.png" },
];

const CRM_D = [
  { id: "overview", label: "Overview", img: "/landing/crm-d-overview.png" },
  {
    id: "appointments",
    label: "Appointments",
    img: "/landing/crm-d-appointments.png",
  },
  {
    id: "payments",
    label: "Payments + AI",
    img: "/landing/crm-d-payments.png",
  },
  { id: "support", label: "Support", img: "/landing/crm-d-support.png" },
];

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return desktop;
}

export function CrmSection() {
  const { t } = useT();
  const isDesktop = useIsDesktop();
  const views = isDesktop ? CRM_D : CRM_M;
  const [active, setActive] = useState(views[0].id);
  const [paused, setPaused] = useState(false);
  const reveal = useReveal<HTMLElement>();

  useEffect(() => {
    setActive(views[0].id);
    setPaused(false);
  }, [isDesktop]);

  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      setActive((prev) => {
        const idx = views.findIndex((v) => v.id === prev);
        return views[(idx + 1) % views.length].id;
      });
    }, 3500);
    return () => clearInterval(tick);
  }, [paused, views]);

  function pick(id: string) {
    setActive(id);
    setPaused(true);
    setTimeout(() => setPaused(false), 9000);
  }

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

        {t.crm.why && (
          <div className="at-why">
            <div>
              <div className="head">Why this matters</div>
              <div className="body">{t.crm.why}</div>
            </div>
          </div>
        )}

        <div className="at-crm-wrap">
          <div className="at-crm-bullets">
            {t.crm.bullets.map((b, i) => (
              <div className="at-crm-bullet" key={i}>
                <span className="n">0{i + 1}</span>
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="at-crm-scene">
            <div className="at-crm-tabs" role="tablist">
              {views.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={v.id === active}
                  className={`at-crm-tab${v.id === active ? " on" : ""}`}
                  onClick={() => pick(v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {isDesktop ? (
              <div className="at-crm-browser">
                <div className="chrome">
                  <span className="dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="url">crm.arzac.studio</span>
                </div>
                <div className="frame">
                  {views.map((v) => (
                    <Image
                      key={v.id}
                      src={v.img}
                      alt={`CRM · ${v.label}`}
                      fill
                      className={v.id === active ? "active" : ""}
                      style={{ objectFit: "cover", objectPosition: "top" }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="at-crm-mobcard">
                <div className="topbar">
                  <span className="dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="url">crm.arzac.studio</span>
                </div>
                <div className="crm-imgs">
                  {views.map((v, i) => (
                    <Image
                      key={v.id}
                      src={v.img}
                      alt={`CRM · ${v.label}`}
                      width={390}
                      height={0}
                      style={{ width: "100%", height: "auto" }}
                      className={v.id === active ? "active" : ""}
                      {...(i === 0 ? {} : {})}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
