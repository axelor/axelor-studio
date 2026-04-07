import "./monaco-setup" // Configure Monaco BEFORE any component renders
import React from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

const container = document.getElementById("root")
const root = createRoot(container)
root.render(<App />)
