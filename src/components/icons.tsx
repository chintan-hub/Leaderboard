// Additional hand-authored icons (same 24x24 stroke recipe as nav-icons.tsx)
// used outside the nav — admin tool cards, action buttons, and inline status
// glyphs — so nothing in the app falls back to emoji as a substitute icon.
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconStar({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3.5l2.6 5.3 5.9.7-4.3 4.1 1.1 5.8-5.3-2.8-5.3 2.8 1.1-5.8-4.3-4.1 5.9-.7z" />
    </svg>
  );
}

export function IconGear({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line key={deg} x1="12" y1="3.5" x2="12" y2="1.5" transform={`rotate(${deg} 12 12)`} />
      ))}
    </svg>
  );
}

export function IconPrinter({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5" />
      <rect x="4" y="9" width="16" height="8" rx="1.5" />
      <path d="M6 17v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" />
      <rect x="9" y="12" width="6" height="4" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function IconCircle({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

export function IconWarning({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 3.5 21.5 20H2.5L12 3.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconEdit({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

export function IconArchive({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}
