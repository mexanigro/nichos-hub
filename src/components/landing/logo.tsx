"use client";

/** Logo icon — the "A" mark with tech elements (pin, bars, network) */
export function LogoIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      {/* A letterform with transparent cutout */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60 12L16 108H36L44 88H76L84 108H104L60 12ZM50 74L60 42L70 74H50Z"
        fill="#4a9a8a"
      />

      {/* Location pin at peak */}
      <path
        d="M60 2C55.8 2 52.5 5.3 52.5 9.5C52.5 15.5 60 22 60 22C60 22 67.5 15.5 67.5 9.5C67.5 5.3 64.2 2 60 2Z"
        fill="#5bbfad"
      />
      <circle cx="60" cy="9.5" r="3" fill="var(--l-bg, #09090b)" />

      {/* Bar chart — left leg */}
      <rect x="24" y="90" width="5.5" height="14" rx="1.5" fill="#5bbfad" opacity="0.75" />
      <rect x="32" y="82" width="5.5" height="22" rx="1.5" fill="#5bbfad" />
      <rect x="40" y="94" width="5.5" height="10" rx="1.5" fill="#5bbfad" opacity="0.55" />

      {/* Network graph — right leg */}
      <circle cx="79" cy="80" r="3.5" fill="#5bbfad" />
      <circle cx="93" cy="90" r="2.8" fill="#5bbfad" opacity="0.7" />
      <circle cx="84" cy="100" r="3.2" fill="#5bbfad" opacity="0.85" />
      <circle cx="97" cy="76" r="2.2" fill="#5bbfad" opacity="0.5" />
      <line x1="79" y1="80" x2="93" y2="90" stroke="#5bbfad" strokeWidth="1.4" opacity="0.5" />
      <line x1="93" y1="90" x2="84" y2="100" stroke="#5bbfad" strokeWidth="1.4" opacity="0.5" />
      <line x1="79" y1="80" x2="84" y2="100" stroke="#5bbfad" strokeWidth="1.2" opacity="0.35" />
      <line x1="79" y1="80" x2="97" y2="76" stroke="#5bbfad" strokeWidth="1.2" opacity="0.35" />

      {/* Signal arcs inside A */}
      <path d="M53 58 A10 10 0 0 1 67 58" stroke="#5bbfad" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <path d="M56 55 A6 6 0 0 1 64 55" stroke="#5bbfad" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <circle cx="60" cy="62" r="2" fill="#5bbfad" opacity="0.7" />
    </svg>
  );
}

/** Full logo text — "ARZAC .studio" */
export function LogoText({ className = "h-5" }: { className?: string }) {
  return (
    <span
      className={`flex items-baseline gap-0.5 ${className}`}
      style={{ fontFamily: "var(--l-display)" }}
    >
      <span className="text-[1em] font-bold tracking-[-0.02em] text-[var(--l-text)]">
        ARZAC
      </span>
      <span className="text-[0.6em] font-medium text-[var(--l-accent)]">
        .studio
      </span>
    </span>
  );
}

/** Combined logo — icon + text */
export function Logo({
  iconClass = "h-9 w-9",
  showText = true,
  textClass = "",
}: {
  iconClass?: string;
  showText?: boolean;
  textClass?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoIcon className={iconClass} />
      {showText && (
        <LogoText className={`hidden sm:flex ${textClass}`} />
      )}
    </span>
  );
}
