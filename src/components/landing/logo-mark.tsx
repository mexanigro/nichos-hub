"use client";

interface LogoMarkProps {
  size?: number;
  color?: string;
}

export function LogoMark({ size = 28, color = "currentColor" }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60 12L16 108H36L44 88H76L84 108H104L60 12ZM50 74L60 42L70 74H50Z"
        fill={color}
      />
      <path
        d="M60 2C55.8 2 52.5 5.3 52.5 9.5C52.5 15.5 60 22 60 22C60 22 67.5 15.5 67.5 9.5C67.5 5.3 64.2 2 60 2Z"
        fill={color}
      />
      <circle cx="60" cy="9.5" r="3" fill="var(--bg-circle, #ece7df)" />
      <rect x="24" y="90" width="5.5" height="14" rx="1.5" fill={color} opacity="0.75" />
      <rect x="32" y="82" width="5.5" height="22" rx="1.5" fill={color} />
      <rect x="40" y="94" width="5.5" height="10" rx="1.5" fill={color} opacity="0.55" />
      <circle cx="79" cy="80" r="3.5" fill={color} />
      <circle cx="93" cy="90" r="2.8" fill={color} opacity="0.7" />
      <circle cx="84" cy="100" r="3.2" fill={color} opacity="0.85" />
      <circle cx="97" cy="76" r="2.2" fill={color} opacity="0.5" />
      <line x1="79" y1="80" x2="93" y2="90" stroke={color} strokeWidth="1.4" opacity="0.5" />
      <line x1="93" y1="90" x2="84" y2="100" stroke={color} strokeWidth="1.4" opacity="0.5" />
      <line x1="79" y1="80" x2="84" y2="100" stroke={color} strokeWidth="1.2" opacity="0.35" />
      <line x1="79" y1="80" x2="97" y2="76" stroke={color} strokeWidth="1.2" opacity="0.35" />
      <path
        d="M53 58 A10 10 0 0 1 67 58"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M56 55 A6 6 0 0 1 64 55"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="60" cy="62" r="2" fill={color} opacity="0.7" />
    </svg>
  );
}
