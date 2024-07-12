import { useMediaQuery } from "./useMediaQuery";
import { useLayoutEffect, useState } from "react";
import { getInfo, load } from "../api";

export function useAppTheme() {
  const [appTheme, setAppTheme] = useState({});

  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const preferred = dark ? "dark" : "light";

  useLayoutEffect(() => {
    async function fetchTheme() {
      const info = await getInfo();
      const userTheme =
        info?.theme ??
        info?.application?.theme ??
        info["user.theme"] ??
        info["application.theme"];
      const theme = userTheme === "auto" ? preferred : userTheme ?? "light";
      const currentTheme = await load(theme);
      setAppTheme(currentTheme);
    }

    fetchTheme();
  }, [preferred]);

  return appTheme;
}
