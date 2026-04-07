/**
 * Monaco Editor configuration for BPM.
 *
 * This file MUST be imported in the app entry point (index.tsx) BEFORE
 * any component that uses CodeEditor renders.
 *
 * Design principle: the consumer app owns the Monaco dependency and its
 * configuration. @studio/shared's CodeEditor checks `isMonacoReady()` to
 * decide whether to render Monaco or a plain textarea.
 *
 * The static `import * as monaco` ensures Vite auto-discovers and pre-bundles
 * the 5MB monaco-editor package — no manual optimizeDeps.include needed.
 */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { loader } from "@monaco-editor/react";
import { markMonacoReady } from "@studio/shared/components";

loader.config({ monaco });
markMonacoReady();
