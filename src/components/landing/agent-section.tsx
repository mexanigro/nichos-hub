"use client";
import { useState, useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";

function AnimatedChat({
  messages,
}: {
  messages: { from: "client" | "agent"; text: string }[];
}) {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState<Set<number>>(new Set());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function reset() {
      if (cancelled) return;
      setVisible(0);
      setMounted(new Set());
      setTyping(false);
      schedule(700);
    }

    function schedule(delay: number) {
      timeouts.push(setTimeout(step, delay));
    }

    function step() {
      if (cancelled) return;
      setVisible((v) => {
        const next = v + 1;
        if (next > messages.length) {
          timeouts.push(setTimeout(reset, 2800));
          return v;
        }
        const isAgent = messages[v].from === "agent";
        if (isAgent) {
          setTyping(true);
          timeouts.push(
            setTimeout(() => {
              if (cancelled) return;
              setTyping(false);
              schedule(900);
            }, 1100)
          );
          return v + 1;
        } else {
          schedule(1200);
          return v + 1;
        }
      });
    }

    reset();
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [messages]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setMounted((prev) => {
          const next = new Set(prev);
          for (let i = 0; i < visible; i++) next.add(i);
          return next;
        });
      });
    });
  }, [visible]);

  return (
    <div className="at-wa-body">
      {messages.slice(0, visible).map((m, i) => (
        <div key={i} className={`at-bubble ${m.from}${mounted.has(i) ? " in" : ""}`}>
          {m.text}
          {m.from === "agent" && <span className="tick">&#10003;&#10003;</span>}
        </div>
      ))}
      {typing && (
        <div className="at-typing">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}

const REASON_ICONS = [
  <svg
    key="1"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>,
  <svg
    key="2"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
  >
    <path d="M13 3 L4 14h7l-1 7 9-11h-7l1-7z" />
  </svg>,
  <svg
    key="3"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <path d="M9 12V6a2 2 0 1 1 4 0v6" />
    <path d="M5 12h14M5 12v4a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-4" />
  </svg>,
  <svg
    key="4"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>,
];

export function AgentSection() {
  const { t } = useT();
  const reveal = useReveal<HTMLElement>();
  return (
    <section className="at-section alt" id="agent" ref={reveal} data-reveal>
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row">
              <span className="dot" />
              <span className="txt">{t.agent.eyebrow}</span>
            </div>
            <h2>
              {t.agent.title}
              <em>{t.agent.titleEm}</em>
            </h2>
          </div>
          <p>{t.agent.sub}</p>
        </div>

        {t.agent.why && (
          <div className="at-why">
            <div>
              <div className="head">Why this matters</div>
              <div className="body">{t.agent.why}</div>
            </div>
          </div>
        )}

        <div className="at-agent-wrap">
          <div className="at-agent-reasons">
            {t.agent.reasons.map((r, i) => (
              <div className="at-reason" key={i}>
                <div className="ico">{REASON_ICONS[i]}</div>
                <div>
                  <h5>{r.t}</h5>
                  <p>{r.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="at-agent-phone" aria-hidden="true">
            <div className="island" />
            <div className="screen">
              <div className="at-wa-head">
                <div className="av">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                  >
                    <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>
                </div>
                <div className="info">
                  <div className="name">Arzac Studio</div>
                  <div className="status">online &middot; auto-reply</div>
                </div>
                <span className="badge">24/7</span>
              </div>
              <AnimatedChat messages={t.agent.chat} />
              <div className="at-wa-input">
                <div className="field">Mensaje&hellip;</div>
                <div className="send">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="home-ind" />
          </div>
        </div>
      </div>
    </section>
  );
}
