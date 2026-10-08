// All settings come from environment variables (see ../.env.example).
export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/adaptive_dsa",
  judge0Url: process.env.JUDGE0_URL ?? "http://localhost:2358",
  // AI feedback is switched on only when an API key is present. Never commit the key (use .env).
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5", // small, cheap model (CLAUDE.md decision)
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL || undefined, // only for tests (a local stand-in server)
  aiCallsPerHour: Number(process.env.AI_CALLS_PER_HOUR ?? 10), // per learner, to cap the cost
  // accounts and sessions
  sessionDays: Number(process.env.SESSION_DAYS ?? 30),
  cookieSecure: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production", // Secure cookies need https
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean), // extra sites allowed to call the API
  signupsPerHour: Number(process.env.AUTH_SIGNUPS_PER_HOUR ?? (process.env.NODE_ENV === "production" ? 10 : 200)), // per IP
  // Google sign-in is switched on only when both values exist. Never commit them (use .env).
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  // Must match the "Authorized redirect URI" in the Google Cloud console exactly.
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? `${process.env.PUBLIC_URL ?? "http://localhost:5173"}/api/auth/google/callback`,
  googleAuthUrl: process.env.GOOGLE_AUTH_URL ?? "https://accounts.google.com/o/oauth2/v2/auth", // overridden only by tests (a local stand-in)
  googleTokenUrl: process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token",
  googleAttemptsPer15Min: Number(process.env.AUTH_GOOGLE_ATTEMPTS ?? 30), // Google sign-in steps per IP (start + callback)
  loginAttemptsPer15Min: Number(process.env.AUTH_LOGIN_ATTEMPTS ?? 10), // per email + IP
};
