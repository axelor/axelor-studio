import { useLayoutEffect, useState } from "react";
import { useMediaQuery } from "./useMediaQuery";
import { loadTheme, getInfo } from "../services/api";

export function useAppTheme() {
  const [themeOptions, setThemeOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const preferred = dark ? "dark" : "light";

  useLayoutEffect(() => {
    (async function () {
      const info = await getInfo();
      const userTheme = info?.user?.theme ?? info?.application?.theme;
      const appTheme =
        userTheme === "auto" ? preferred : userTheme ?? preferred;
      const themeOptions = await loadTheme(appTheme);
      setThemeOptions(themeOptions);
      setLoading(false);
    })();
  }, [preferred]);
  return { ...themeOptions, loading };
}
