// Shared numbers for the knowledge models ("kt" = knowledge tracing). Pure maths, no database.
export const SCALE = 400 / Math.LN10; // Elo's 400-point scale expressed for the logistic curve: P = sigmoid((rating - difficulty) / SCALE)
export const START = 1000; // everyone's starting rating in every skill
export const DAY_MS = 86_400_000;
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const clampP = (p, eps = 1e-4) => Math.min(1 - eps, Math.max(eps, p));
