// Runs a SECOND copy of the API on port 4100 with a FAKE AI tutor, so you can try the "Explain my result" button
// without an Anthropic key (the answer is canned text, nothing is sent anywhere). Your normal dev server is untouched.
//   1. cd server && npm run dev:fake-ai
//   2. cd client && set API_URL=http://localhost:4100 && npm run dev      (PowerShell: $env:API_URL="http://localhost:4100")
// Stop with Ctrl+C.
import { spawn } from "node:child_process";
import http from "node:http";

const stub = http.createServer((req, res) => {
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({
      id: "msg_fake", type: "message", role: "assistant", model: "claude-haiku-4-5", stop_reason: "end_turn", stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
      content: [{ type: "text", text: "(Fake AI tutor, for testing.) Look at what your function returns when the list has only negative numbers: does the starting altitude 0 count? Try that case by hand first." }],
    }));
  });
});
await new Promise((resolve) => stub.listen(0, "127.0.0.1", resolve));

const api = spawn(process.execPath, ["--env-file=../.env", "src/index.js"], {
  env: { ...process.env, PORT: "4100", ANTHROPIC_API_KEY: "fake-key", ANTHROPIC_BASE_URL: `http://127.0.0.1:${stub.address().port}` },
  stdio: "inherit",
});
const stop = () => { api.kill(); stub.close(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
console.log("Fake-AI API on http://localhost:4100  (Ctrl+C to stop)");
