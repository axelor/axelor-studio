import { useLayoutEffect, useState } from "react";
import { useMediaQuery } from "@studio/shared/theme";

import { loadTheme, getInfo } from "../shared/services";

interface ThemeOptions {
  options: Record<string, unknown>;
  theme: string;
}

/**
 * Resolves the app theme from user preferences or system defaults.
 *
 * Optimization: getInfo() uses a promise-deduplication cache, so concurrent
 * calls from StoreProvider and useAppTheme share the same network request.
 * The info→theme dependency is sequential (theme name comes from info),
 * but the single setState at the end produces only one render transition.
 */
export function useAppTheme(): ThemeOptions & { loading: boolean } {
  const [state, setState] = useState<{ themeOptions: ThemeOptions | null; loading: boolean }>({
    themeOptions: null,
    loading: true,
  });

  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const preferred = dark ? "dark" : "light";

  useLayoutEffect(() => {
    let cancelled = false;
    (async () => {
      const info = await getInfo();
      const userTheme = info?.user?.theme ?? info?.application?.theme;
      const appTheme = userTheme === "auto" ? preferred : (userTheme ?? preferred);
      let result = await loadTheme(appTheme);
      if (!result?.options || result?.options?.ok === false) {
        result = await loadTheme(preferred);
      }
      if (!cancelled) {
        // Single setState — one render transition from loading to ready
        setState({ themeOptions: result as ThemeOptions | null, loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, [preferred]);

  return { ...(state.themeOptions as ThemeOptions), loading: state.loading };
}
