/**
 * Filters out known infrastructure noise from browser console errors.
 *
 * These patterns are not caused by application code and should not
 * fail E2E tests:
 * - WebSocket connection failures (no backend WS server in E2E)
 * - Bootstrap/HMR errors from Vite dev server
 * - React development mode warnings
 */

const NOISE_PATTERNS: RegExp[] = [
  /WebSocket connection/i,
  /websocket/i,
  /ERR_CONNECTION_REFUSED/i,
  /bootstrap/i,
  /\[HMR\]/i,
  /\[vite\]/i,
  /Failed to load resource.*websocket/i,
  /net::ERR_/i,
  /getDefinitions/i,
  /Can't import XML/i,
  /ResizeObserver loop/i,
  /Failed to load resource.*404/i,
  /Failed to load resource.*the server responded/i,
  /favicon\.ico/i,
];

/**
 * Returns true if the console error message is known infrastructure noise
 * and should be ignored.
 */
export function isNoiseError(message: string): boolean {
  return NOISE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Filters an array of console error messages, returning only
 * the errors that are likely from application code.
 */
export function filterConsoleErrors(errors: string[]): string[] {
  return errors.filter((msg) => !isNoiseError(msg));
}
