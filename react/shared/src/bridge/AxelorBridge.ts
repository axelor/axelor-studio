/**
 * Typed facade for iframe <-> Axelor Open Platform (AOP) communication.
 *
 * In production the cockpit SPA runs inside an AOP iframe (`type="html"`).
 * `window.top.axelor` exposes navigation, i18n, dialogs and tab-state helpers.
 *
 * In dev mode (standalone Vite server) the bridge returns a graceful fallback
 * that logs to the console instead of throwing.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface OpenViewParams {
  model: string;
  viewType: "form" | "grid";
  views?: Array<{ type: string; name?: string }>;
  domain?: string;
  context?: Record<string, unknown>;
}

export interface AxelorBridge {
  openView: (params: OpenViewParams) => void;
  openHtmlTab: (title: string, url: string) => void;
  translate: (key: string) => string;
  showError: (message: string) => void;
  showConfirm: (message: string) => Promise<boolean>;
  syncTabDirty: (dirty: boolean) => void;
}

// ---------------------------------------------------------------------------
// Internal: access the AOP global safely
// ---------------------------------------------------------------------------

/** Loosely-typed handle on `window.top.axelor`. */
type AxelorGlobal = Record<string, unknown> | undefined;

function getAxelorGlobal(): AxelorGlobal {
  try {
    return (window.top as unknown as Record<string, unknown>)?.axelor as AxelorGlobal; // safety: cross-frame dynamic lookup
  } catch {
    // Cross-origin access throws — treat as "not in iframe"
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Dev-mode fallback
// ---------------------------------------------------------------------------

const DEV_PREFIX = "[AxelorBridge] dev mode";

function createDevFallback(): AxelorBridge {
  return {
    openView: (params) => console.warn(`${DEV_PREFIX} — openView`, params),
    openHtmlTab: (title, url) => console.warn(`${DEV_PREFIX} — openHtmlTab`, title, url),
    translate: (key) => key,
    showError: (message) => console.error(`${DEV_PREFIX} — showError:`, message),
    showConfirm: (message) => Promise.resolve(window.confirm(message)),
    syncTabDirty: (dirty) => console.debug(`${DEV_PREFIX} — syncTabDirty`, dirty),
  };
}

// ---------------------------------------------------------------------------
// Production bridge (inside AOP iframe)
// ---------------------------------------------------------------------------

function createIframeBridge(axelor: NonNullable<AxelorGlobal>): AxelorBridge {
  return {
    translate(key: string): string {
      const i18n = axelor.i18n as { get?: (k: string) => string } | undefined;
      return i18n?.get?.(key) ?? key;
    },

    openView(params: OpenViewParams): void {
      const openViewFn = axelor.openView as ((p: OpenViewParams) => void) | undefined;
      if (openViewFn) {
        openViewFn(params);
      } else {
        console.warn("[AxelorBridge] openView not available on axelor global");
      }
    },

    openHtmlTab(title: string, url: string): void {
      const openTab = axelor.$openHtmlTab as ((u: string, t: string) => void) | undefined;
      if (openTab) {
        openTab(url, title);
      } else {
        console.warn("[AxelorBridge] $openHtmlTab not available on axelor global");
      }
    },

    showError(message: string): void {
      const dialogs = axelor.dialogs as { error?: (opts: { content: string }) => void } | undefined;
      if (dialogs?.error) {
        dialogs.error({ content: message });
      } else {
        console.error("[AxelorBridge] dialogs.error not available, message:", message);
      }
    },

    showConfirm(message: string): Promise<boolean> {
      const dialogs = axelor.dialogs as
        | { confirm?: (opts: { content: string; onOk: () => void; onCancel: () => void }) => void }
        | undefined;
      if (dialogs?.confirm) {
        return new Promise<boolean>((resolve) => {
          dialogs.confirm!({
            content: message,
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
      }
      return Promise.resolve(window.confirm(message));
    },

    syncTabDirty(dirty: boolean): void {
      // Reuses the same pattern as sync-axelor-tab.ts (useActiveTab hook)
      if (axelor.useActiveTab) {
        const [, setTabState] = (
          axelor.useActiveTab as () => [unknown, (v: { dirty: boolean }) => void]
        )();
        setTabState({ dirty });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Factory & singleton
// ---------------------------------------------------------------------------

export function createAxelorBridge(): AxelorBridge {
  const axelor = getAxelorGlobal();
  if (axelor) {
    return createIframeBridge(axelor);
  }
  return createDevFallback();
}

export const axelorBridge = createAxelorBridge();
