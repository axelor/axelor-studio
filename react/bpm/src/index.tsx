import "./monaco-setup"; // Configure Monaco BEFORE any component renders
import React from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "@studio/shared/components";

import App from "./App";
import "./index.css";

const container = document.getElementById("root")!;
const root = createRoot(container);
root.render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
