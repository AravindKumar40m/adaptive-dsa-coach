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
export const ThumbUp = make(<><path d="M7 11v9H4v-9h3z" /><path d="M7 11l4-8c1.5 0 2.5 1 2.5 2.5V9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" /></>);
export const ThumbDown = (props) => <ThumbUp {...props} style={{ transform: "scaleY(-1)", ...(props.style ?? {}) }} />;
export const Shield = make(<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />);

// Step-through controls
export const StepFirst = make(<><path d="M6 5v14" /><path d="M18 6l-8 6 8 6z" /></>);
export const StepBack = make(<path d="M16 6l-8 6 8 6z" />);
export const StepNext = make(<path d="M8 6l8 6-8 6z" />);
export const StepLast = make(<><path d="M18 5v14" /><path d="M6 6l8 6-8 6z" /></>);
export const StepOverIcon = make(<><path d="M4 15a8 8 0 0 1 16 0" /><path d="M16 11l4 4-4 4" /></>);
export const StepOutIcon = make(<><path d="M12 19V7" /><path d="M7 11l5-5 5 5" /><path d="M5 20h14" /></>);
export const Close = make(<path d="M6 6l12 12M18 6L6 18" />);
export const Footsteps = make(<><path d="M8 4c2 0 3 2 3 5s-1 5-3 5-3-1-3-3 1-7 3-7z" /><path d="M7 17h3" /><path d="M16 9c2 0 3 2 3 5s-1 5-3 5-3-1-3-3 1-7 3-7z" /></>);

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
