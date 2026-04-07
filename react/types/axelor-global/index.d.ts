// Axelor global namespace (available on window)
interface AxelorGlobal {
  i18n: { get: (key: string, ...args: unknown[]) => string };
  getAppData?: () => Promise<{ theme: string; options: Record<string, unknown> }>;
  dialogs?: {
    error: (opts: { content: string }) => () => void;
  };
}

interface Window {
  axelor?: AxelorGlobal;
}
