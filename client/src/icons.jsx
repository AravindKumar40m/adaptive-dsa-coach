// Small line icons (16px, 1.6 stroke). Hand-written so the app needs no icon library.
const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const make = (children) => function Icon({ size = 16, ...rest }) { return <svg {...base} width={size} height={size} {...rest}>{children}</svg>; };

export const Sun = make(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const Moon = make(<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />);
export const Lock = make(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const Check = make(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const Play = make(<path d="M7 5l11 7-11 7z" />);
export const Send = make(<path d="M4 12l16-8-6 17-3-7z" />);
export const Search = make(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></>);
export const Chevron = make(<path d="M6 9l6 6 6-6" />);
export const Arrow = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const Bulb = make(<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>);
export const Reset = make(<><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v5h5" /></>);
export const Spark = make(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />);
export const Target = make(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>);
export const Branch = make(<><circle cx="6" cy="6" r="2.2" /><circle cx="6" cy="18" r="2.2" /><circle cx="18" cy="9" r="2.2" /><path d="M6 8.2v7.6M18 11.2c0 3-6 2-12 4.6" /></>);
export const Shield = make(<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />);

// The brand mark: a lamp shade over a small stem (a reading lamp).
export function Logo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--bg-sunken)" stroke="var(--line-strong)" />
      <path d="M7 18a9 9 0 0 1 18 0z" fill="var(--accent)" />
      <rect x="14.5" y="19.5" width="3" height="6" rx="1.5" fill="var(--text-faint)" />
    </svg>
  );
}
