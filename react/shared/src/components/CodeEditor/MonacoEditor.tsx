import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { Resizable } from "re-resizable";

import { useMonacoLanguage } from "./useMonacoLanguage";
import type { CodeEditorProps } from "./CodeEditor";
import styles from "./code-editor.module.css";

/**
 * Internal Monaco wrapper — lazy-loaded via React.lazy in CodeEditor.tsx.
 *
 * Assumes Monaco is already configured by the consumer app
 * (via `configureMonaco()` in their entry point). No setup logic here.
 */
function MonacoEditor({
  value,
  onChange,
  language = "groovy",
  readOnly = false,
  height: initialHeight = 120,
  resizable = true,
  minimap = true,
  suggestion = true,
  className,
  onBlur,
  isError = false,
}: CodeEditorProps) {
  // CSS string heights (e.g. "100%") bypass numeric resize state
  const isCSSHeight = typeof initialHeight === "string";
  const [editorHeight, setEditorHeight] = useState(
    typeof initialHeight === "number" ? initialHeight : 120,
  );
  const savedHeight = React.useRef(editorHeight);
  const resolvedHeight = isCSSHeight ? initialHeight : `${editorHeight}px`;

  const { onMount } = useMonacoLanguage(language ?? "groovy", { suggestion });

  const editorOptions = {
    readOnly,
    selectOnLineNumbers: true,
    automaticLayout: true,
    minimap: { enabled: minimap },
    suggestOnTriggerCharacters: suggestion,
    quickSuggestions: suggestion,
    wordWrap: "on" as const,
  };

  const editorContent = (
    <div
      className={`${styles.editorContainer} ${isError ? styles.editorError : ""} ${className ?? ""}`}
      style={isCSSHeight ? { height: resolvedHeight } : undefined}
      onBlur={onBlur}
    >
      <Editor
        height={resolvedHeight}
        language={language}
        value={value}
        onChange={(newValue: string | undefined) => onChange(newValue ?? "")}
        onMount={onMount}
        options={editorOptions}
      />
    </div>
  );

  if (!resizable || isCSSHeight) {
    return editorContent;
  }

  return (
    <Resizable
      defaultSize={{ width: "100%", height: editorHeight }}
      enable={{
        top: false,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      onResizeStart={() => {
        savedHeight.current = editorHeight;
      }}
      onResize={(_e, _direction, _ref, d) => {
        setEditorHeight(savedHeight.current + d.height);
      }}
      className={styles.resizableWrapper}
    >
      {editorContent}
    </Resizable>
  );
}

export default MonacoEditor;
