import React, { useEffect, useState, useMemo } from "react";
import { getInfo, getLanguages } from "./services/api";

const StoreContext = React.createContext();

function StoreProvider({ children }) {
  const [state, setState] = useState({
    info: null,
    languages: [
      {
        code: "en",
        name: "English",
        id: "en",
      },
      {
        code: "fr",
        name: "French",
        id: "fr",
      },
    ],
  });

  const value = useMemo(
    () => ({
      state,
      update: setState,
    }),
    [state]
  );

  useEffect(() => {
    async function getInitials() {
      const info = await getInfo();
      const languages = await getLanguages();
      setState((state) => ({
        ...state,
        info,
        languages,
      }));
    }
    getInitials();
  }, []);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  return React.useContext(StoreContext);
}

export default StoreProvider;
