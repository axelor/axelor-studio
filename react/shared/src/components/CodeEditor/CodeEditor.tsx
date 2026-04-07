import React, { Suspense } from "react";

import { isMonacoReady } from "./MonacoContext";
import { TextareaFallback } from "./TextareaFallback";

const LazyMonacoEditor = React.lazy(() => import("./MonacoEditor"));

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "groovy" | "jpql" | "xml" | "json" | "javascript";
  readOnly?: boolean;
  height?: number | string;
  resizable?: boolean;
  minimap?: boolean;
  suggestion?: boolean;
  className?: string;
  onBlur?: () => void;
  isError?: boolean;
}

/**
 * Code editor component with optional Monaco Editor.
 *
 * Rendering decision:
 * - If the consumer app has called `configureMonaco()` at startup → renders Monaco
 * - Otherwise → renders TextareaFallback (a functional styled textarea)
 *
 * This is NOT an error fallback — it's an explicit contract:
 * apps that want Monaco must configure it. Apps that don't get a textarea.
 *
 * Monaco is lazy-loaded via React.lazy so the ~5MB chunk is only fetched
 * when CodeEditor first renders (not at app startup).
 */
export function CodeEditor(props: CodeEditorProps) {
  if (!isMonacoReady()) {
    return (
      <TextareaFallback
        value={props.value}
        onChange={props.onChange}
        readOnly={props.readOnly}
        height={props.height}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <TextareaFallback
          value={props.value}
          onChange={props.onChange}
          readOnly={props.readOnly}
          height={props.height}
          loading
        />
      }
    >
      <LazyMonacoEditor {...props} />
    </Suspense>
  );
}
