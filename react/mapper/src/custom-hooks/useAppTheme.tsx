import { useLayoutEffect, useState } from "react";
import { useMediaQuery } from "@studio/shared/theme";
import { ServiceInstance } from "@studio/shared/services";

interface ThemeOptions {
  options: Record<string, unknown>;
  theme: string;
}

interface AppThemeResult {
  options?: Record<string, unknown>;
  theme?: string;
  loading: boolean;
}

async function loadTheme(theme: string): Promise<ThemeOptions | undefined> {
  if (!theme) return;
  // AOP 8.1+: use global axelor app data if available
  if (window.axelor?.getAppData) {
    try {
      const appData = await window.axelor.getAppData();
      return { options: appData.options, theme: appData.theme };
    } catch {
      // fall through
    }
  }
  // AOP 8.1 endpoint: returns 204 No Content when no custom theme
  try {
    const res = await fetch(
      `${ServiceInstance.baseURL}/ws/public/app/theme?name=${encodeURIComponent(theme)}`,
      { method: "GET", credentials: "include", headers: { Accept: "application/json" } },
    );
    if (res.ok && res.status !== 204) {
      const options = await res.json();
      return { options, theme };
    }
    return { options: {}, theme };
  } catch {
    return { options: {}, theme };
  }
}

async function getInfo(): Promise<Record<string, unknown> | undefined> {
  const url = `ws/public/app/info`;
  const res = await ServiceInstance.get(url) as Record<string, unknown> | undefined;
  return res;
}

export function useAppTheme(): AppThemeResult {
  const [themeOptions, setThemeOptions] = useState<ThemeOptions | null>(null);
  const [loading, setLoading] = useState(true);

  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const preferred = dark ? "dark" : "light";

  useLayoutEffect(() => {
    (async function () {
      const info = await getInfo();
      const user = info?.user as Record<string, unknown> | undefined;
      const application = info?.application as Record<string, unknown> | undefined;
      const userTheme = (user?.theme ?? application?.theme) as string | undefined;
      const appTheme = userTheme === "auto" ? preferred : (userTheme ?? preferred);
      const result = await loadTheme(appTheme);
      setThemeOptions(result ?? null);
      setLoading(false);
    })();
  }, [preferred]);

  return { ...themeOptions, loading };
}
