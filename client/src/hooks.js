import { useCallback, useEffect, useRef, useState } from "react";

// ---- colour mode: dark ("ink") or light ("paper"), remembered on this device, defaults to the system setting
export function useTheme() {
  const [theme, setThemeState] = useState(() => document.documentElement.getAttribute("data-theme") || "dark");
  const setTheme = useCallback((mode) => {
    document.documentElement.setAttribute("data-theme", mode);
    try { localStorage.setItem("theme", mode); } catch { /* private mode: just not remembered */ }
    setThemeState(mode);
  }, []);
  return [theme, setTheme];
}

// ---- tiny router on the URL hash:  #/  (path)   #/problems?concept=arrays   #/practice/peak-altitude
function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));
  if (parts[0] === "practice" && parts[1]) return { name: "practice", slug: decodeURIComponent(parts[1]), params };
  if (parts[0] === "problems") return { name: "problems", params };
  return { name: "path", params };
}
export function useRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
export const go = (hash) => { window.location.hash = hash; };

// ---- drag-to-resize. axis "x" resizes a width, "y" a height. Returns the current size and handlers for the handle.
export function useSplit({ initial, min, max, axis = "x", storeKey, reverse = false }) {
  const [size, setSize] = useState(() => {
    try { const v = Number(sessionStorage.getItem(storeKey)); if (v) return Math.min(max, Math.max(min, v)); } catch { /* ignore */ }
    return initial;
  });
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { pos: axis === "x" ? e.clientX : e.clientY, size };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    if (!start.current) return;
    const delta = (axis === "x" ? e.clientX : e.clientY) - start.current.pos;
    setSize(Math.min(max, Math.max(min, start.current.size + (reverse ? -delta : delta))));
  };
  const end = () => {
    if (!start.current) return;
    start.current = null; setDragging(false);
    try { sessionStorage.setItem(storeKey, String(Math.round(sizeRef.current))); } catch { /* ignore */ }
  };
  const sizeRef = useRef(size);
  sizeRef.current = size;
  return { size, dragging, handleProps: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } };
}

// ---- close a popover on outside click or Escape
export function useDismiss(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const key = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, onClose]);
  return ref;
}

// ---- code drafts live in this tab only (sessionStorage), so a refresh does not lose your work
export function loadDraft(learnerId, key) {
  try { return sessionStorage.getItem(`draft:${learnerId}:${key}`) ?? undefined; } catch { return undefined; }
}
export function saveDraft(learnerId, key, value) {
  try { sessionStorage.setItem(`draft:${learnerId}:${key}`, value); } catch { /* ignore */ }
}
export function removeDraft(learnerId, key) {
  try { sessionStorage.removeItem(`draft:${learnerId}:${key}`); } catch { /* ignore */ }
}
export function clearDrafts(learnerId) {
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith(`draft:${learnerId}:`)) sessionStorage.removeItem(k);
  } catch { /* ignore */ }
}
