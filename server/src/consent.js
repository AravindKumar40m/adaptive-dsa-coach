// The consent texts shown at sign-up. Whatever the learner agreed to is stored together with this VERSION.
// If you change the wording, change the version: everyone must then agree again before anything is recorded.
// NOTE: this wording is a plain-language DRAFT written by the developer, not legal advice. Have it reviewed
// (privacy law, minors, your country's rules) before real learners use the platform.
export const CONSENT_VERSION = "2026-10-08";

export const CONSENT_TEXT = {
  version: CONSENT_VERSION,
  recording: {
    title: "Recording your practice",
    required: true,
    intro: "To adapt the problems to you, we record what you do inside the code editor:",
    points: [
      "the code you run or submit, and the results (which tests passed, how long it took)",
      "which hints you open, and how long you spend on each problem",
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
