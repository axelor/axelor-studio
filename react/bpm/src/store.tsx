import React, { useEffect, useState, useMemo, type ReactNode } from "react";

import { getInfo, getLanguages } from "./shared/services";

interface Language {
  value: string;
  title: string;
  id: string;
}

interface StoreState {
  info: Record<string, unknown> | null;
  languages: Language[];
  execute: boolean;
  [key: string]: unknown;
}

interface StoreContextValue {
  state: StoreState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: React.Dispatch<React.SetStateAction<any>>;
}

const StoreContext = React.createContext<StoreContextValue | null>(null);

function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>({
    info: null,
    languages: [
      {
        value: "en",
        title: "English",
        id: "en",
      },
      {
        value: "fr",
        title: "French",
        id: "fr",
      },
    ],
    execute: false,
  });

  const value = useMemo(
    () => ({
      state,
      update: setState,
    }),
    [state],
  );

  useEffect(() => {
    // Parallel fetch — getInfo() is cache-deduplicated with useAppTheme
    Promise.all([getInfo(), getLanguages()]).then(([info, languages]) => {
      setState((state) => ({ ...state, info, languages: languages as Language[] }));
    });
  }, []);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (ctx === null) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export default StoreProvider;
