/**
 * Module augmentation for @monaco-editor/react.
 *
 * The published types target React 18's JSX namespace. Under React 19's
 * automatic JSX transform the default export is typed as
 * React.ComponentType<never>, causing TS2322 at every usage site.
 *
 * This override declares the props actually used at runtime.
 * Remove this file when @monaco-editor/react publishes React 19-compatible types.
 */
declare module "@monaco-editor/react" {
  import type { FC } from "react";
  import type { editor } from "monaco-editor";

  interface EditorProps {
    height?: string | number;
    language?: string;
    value?: string;
    onChange?: (value: string | undefined) => void;
    onMount?: (
      editor: editor.IStandaloneCodeEditor,
      monaco: typeof import("monaco-editor"),
    ) => void;
    options?: editor.IStandaloneEditorConstructionOptions;
    theme?: string;
    className?: string;
  }

  type OnMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor"),
  ) => void;

  interface MonacoLoader {
    config: (opts: { monaco: typeof import("monaco-editor") }) => void;
  }

  const Editor: FC<EditorProps>;
  const loader: MonacoLoader;
  export default Editor;
  export { loader };
  export type { EditorProps, OnMount };
}
