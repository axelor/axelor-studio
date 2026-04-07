
/**
 * React context for the Monaco Editor instance.
 *
 * Consumer apps provide the Monaco instance by calling `configureMonaco()`
 * in their entry point BEFORE any component renders. CodeEditor reads
 * from this context to decide whether to render Monaco or TextareaFallback.
 *
 * This follows the Dependency Inversion Principle: @studio/shared declares
 * the interface (CodeEditor), consumers provide the implementation (monaco-editor).
 */

let monacoReady = false;

/**
 * Called by consumer apps at startup to signal that Monaco is configured.
 * Must be called AFTER `loader.config({ monaco })` from @monaco-editor/react.
 */
export function markMonacoReady(): void {
  monacoReady = true;
}

/**
 * Returns true if the consumer has configured Monaco via `configureMonaco()`.
 * Used by CodeEditor to decide render path.
 */
export function isMonacoReady(): boolean {
  return monacoReady;
}

/**
 * Resets state for testing.
 * @internal
 */
export function _resetMonacoReady(): void {
  monacoReady = false;
}
