import mongoose from "mongoose";

// How to scale one problem for the complexity analyzer (our content, loaded from content/build/complexity.json by
// `npm run content:complexity`). It holds the Python source of the input generator, so it never goes to the browser.
const schema = new mongoose.Schema(
  {
    problem: { type: String, required: true, unique: true }, // slug
    functionName: String, // the learner's function (Python name)
    make: String, // Python source of  def _make(n, rng)
    sizes: [Number], // the input sizes to try, smallest first
    expected: String, // the usual best solution's class: "log n" | "n" | "n log n" | "n^2" | "n^3" | "exp"
    slow: String, // the brute-force solution's class (used by complexity:validate)
    configVersion: String,
  },
  { timestamps: true }
);

export const ComplexityConfig = mongoose.model("ComplexityConfig", schema);
