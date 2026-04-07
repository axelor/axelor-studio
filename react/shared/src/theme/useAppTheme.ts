import { useLayoutEffect, useState } from "react";

import { loadTheme, getInfo } from "../services/index";

import { useMediaQuery } from "./useMediaQuery";

interface ThemeOptions {
  options?: Record<string, unknown>;
  theme?: string;
  [key: string]: unknown;
}

export function useAppTheme(): ThemeOptions & { loading: boolean } {
  const [themeOptions, setThemeOptions] = useState<ThemeOptions | null>(null);
  const [loading, setLoading] = useState(true);

  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const preferred = dark ? "dark" : "light";

  useLayoutEffect(() => {
    (async function () {
      const info = await getInfo();
      const userTheme = info?.user?.theme ?? info?.application?.theme;
      const appTheme = userTheme === "auto" ? preferred : (userTheme ?? preferred);
      let themeOpts = await loadTheme(appTheme);
      if (!themeOpts?.options || (themeOpts?.options)?.ok === false) {
        themeOpts = await loadTheme(preferred);
      }
      setThemeOptions(themeOpts ?? null);
      setLoading(false);
    })();
  }, [preferred]);
  return { ...themeOptions, loading };
}
