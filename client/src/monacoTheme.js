// Editor colours that match the page: warm ink for dark, warm paper for light. Called once, before the editor mounts.
export function defineLamplightThemes(monaco) {
  const common = { base: "vs-dark", inherit: true };
  monaco.editor.defineTheme("lamplight-dark", {
    ...common,
    rules: [
      { token: "comment", foreground: "7d7260", fontStyle: "italic" },
      { token: "keyword", foreground: "e0956b" },
      { token: "string", foreground: "a9c27f" },
      { token: "number", foreground: "e9c46a" },
      { token: "type", foreground: "86aebf" },
      { token: "identifier", foreground: "ece4d6" },
      { token: "delimiter", foreground: "a89d8c" },
    ],
    colors: {
      "editor.background": "#1a1612", "editor.foreground": "#ece4d6",
      "editorLineNumber.foreground": "#6f6657", "editorLineNumber.activeForeground": "#b0a593",
      "editor.lineHighlightBackground": "#211c16", "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#4a3a22", "editor.inactiveSelectionBackground": "#3a2e1d",
      "editorCursor.foreground": "#e9a23b", "editorIndentGuide.background1": "#2c261f", "editorIndentGuide.activeBackground1": "#4a4034",
      "editorWidget.background": "#1f1a14", "editorWidget.border": "#3b332a", "editorSuggestWidget.background": "#1f1a14",
      "editorSuggestWidget.selectedBackground": "#2c261f", "scrollbarSlider.background": "#3b332a80",
    },
  });
  monaco.editor.defineTheme("lamplight-paper", {
    base: "vs", inherit: true,
    rules: [
      { token: "comment", foreground: "9a8f7a", fontStyle: "italic" },
      { token: "keyword", foreground: "a8461a" },
      { token: "string", foreground: "4a7a2a" },
      { token: "number", foreground: "8a6100" },
      { token: "type", foreground: "1f6a85" },
      { token: "identifier", foreground: "251f16" },
      { token: "delimiter", foreground: "7a705f" },
    ],
    colors: {
      "editor.background": "#fffcf5", "editor.foreground": "#251f16",
      "editorLineNumber.foreground": "#b2a78f", "editorLineNumber.activeForeground": "#5b5242",
      "editor.lineHighlightBackground": "#f6f0e1", "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#ecd9b0", "editor.inactiveSelectionBackground": "#f1e5c7",
      "editorCursor.foreground": "#a85a06", "editorIndentGuide.background1": "#e8dfcb", "editorIndentGuide.activeBackground1": "#cfc4ab",
      "editorWidget.background": "#fffcf5", "editorWidget.border": "#e2d9c5",
    },
  });
}

export const EDITOR_OPTIONS = {
  fontFamily: '"JetBrains Mono Variable", ui-monospace, Consolas, monospace',
  fontSize: 14, lineHeight: 23, fontLigatures: false,
  minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true,
  padding: { top: 14, bottom: 14 }, renderLineHighlight: "line", renderWhitespace: "none",
  cursorBlinking: "solid", cursorSmoothCaretAnimation: "off", smoothScrolling: false, // no animations
  overviewRulerLanes: 0, hideCursorInOverviewRuler: true, guides: { indentation: true }, tabSize: 4,
  contextmenu: false, lineNumbersMinChars: 3, folding: false,
};
