import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/jetbrains-mono";
import "./styles/theme.css";
import "./styles/app.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
