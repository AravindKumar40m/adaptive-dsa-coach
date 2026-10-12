// The consent texts shown at sign-up. Whatever the learner agreed to is stored together with this VERSION.
// If you change the wording, change the version: everyone must then agree again before anything is recorded.
// NOTE: this wording is a plain-language DRAFT written by the developer, not legal advice. Have it reviewed
// (privacy law, minors, your country's rules) before real learners use the platform.
export const CONSENT_VERSION = "2026-10-12.3";

export const CONSENT_TEXT = {
  version: CONSENT_VERSION,
  recording: {
    title: "Recording your practice",
    required: true,
    intro: "To adapt the problems to you, we record what you do inside the code editor:",
    points: [
      "the code you run or submit, and the results (which tests passed, how long it took)",
      "which hints you open, and how long you spend on each problem",
      "how you work in the editor: when you start typing, how much you type or paste, and your pauses (totals only, not a recording of every key)",
      "which problems we recommended to you and which you chose, and what you tell us about a problem: how hard it felt, whether you liked it, why you skipped it",
      "how fast your submitted solution runs on larger inputs that we generate (we run your correct solution again on bigger and bigger inputs and time it, to show how it scales)",
      "the code in the editor as it develops: a saved copy about every 30 seconds while you work, so we can see how a solution grows",
      "when we suggest a hint because you seem stuck, and whether you used it; when a topic is due for review",
      "how long our server takes to answer each request (kept for 14 days, tied only to a scrambled id, never your email)",
      "your own answers about what you already know: an optional self-assessment, and an optional placement quiz (which option you chose for each question, whether it was right, and how long you took)",
      "your skill ratings, which are calculated from the above",
      "your email address, only so you can log in",
    ],
    outro:
      "We record nothing outside the editor. Only the owner of this platform can see this data, and we do not sell or share it. It is kept until you delete it: the Account menu has \"Delete my learning data\" (keeps your account) and \"Delete my account\" (removes everything, including your email).",
  },
  ai: {
    title: "AI explanations (optional)",
    required: false,
    intro: "If you click \"Explain my result\", an AI tutor (Claude, made by Anthropic) writes a short explanation.",
    points: [
      "to do this, your code for that problem and its test results are sent to Anthropic",
      "nothing is sent unless you click the button, and you can turn this off at any time in the Account menu",
      "using an AI explanation counts as help and lowers the independence part of your score for that problem",
    ],
    outro: "If you do not tick this box, the AI button stays hidden and nothing is ever sent to Anthropic.",
  },
};
