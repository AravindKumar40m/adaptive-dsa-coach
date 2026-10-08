// Try Google sign-in WITHOUT a Google account or keys: starts a stand-in Google (port 4200) and a second copy of the API
// (port 4101) wired to it, with the redirect address http://localhost:5174/api/auth/google/callback.
// Then, in client/:   $env:API_URL="http://localhost:4101"; npx vite --port 5174 --strictPort
// Control who "signs in": http://127.0.0.1:4200/__set?email=a@example.test&sub=abc&mode=ok   (mode: ok | deny | bad-aud | bad-nonce | expired)
// Run: npm run dev:fake-google      (stop with Ctrl+C; your normal API on port 4000 is not touched)
import { spawn } from "node:child_process";
import { startFakeGoogle } from "./lib/fake-google.js";

const redirectUri = "http://localhost:5174/api/auth/google/callback";
const fake = await startFakeGoogle({ clientId: "fake-client-id", clientSecret: "fake-client-secret", redirectUri, port: 4200 });
const api = spawn(process.execPath, ["--env-file=../.env", "src/index.js"], {
  stdio: "inherit",
  env: { ...process.env, PORT: "4101", GOOGLE_CLIENT_ID: "fake-client-id", GOOGLE_CLIENT_SECRET: "fake-client-secret",
    GOOGLE_REDIRECT_URI: redirectUri, GOOGLE_AUTH_URL: fake.authUrl, GOOGLE_TOKEN_URL: fake.tokenUrl },
});
console.log(`Stand-in Google on ${fake.base}, API on http://localhost:4101. Now start the page:\n  cd client; $env:API_URL="http://localhost:4101"; npx vite --port 5174 --strictPort`);
const stop = () => { api.kill(); fake.close(); process.exit(0); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
