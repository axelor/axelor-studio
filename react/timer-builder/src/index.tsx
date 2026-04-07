import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import App from "./App";
import { AppErrorBoundary } from "@studio/shared/components";

// Read timerDefinitionType from URL params for standalone/E2E usage.
// In production, the timer-builder is embedded with props from the BPM modeler.
const params = new URLSearchParams(window.location.search);
const timerDefinitionType = params.get("timerDefinitionType") || "cron";
const value = params.get("value") || undefined;

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App timerDefinitionType={timerDefinitionType} value={value} />
    </AppErrorBoundary>
  </React.StrictMode>,
);
