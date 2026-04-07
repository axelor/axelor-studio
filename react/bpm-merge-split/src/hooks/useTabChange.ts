import { createContext, useContext } from "react";

interface TabContextValue {
  tabVisible: boolean;
}

export const TabContext = createContext<TabContextValue | null>(null);

export const useTab = (): TabContextValue => {
  const context = useContext(TabContext);
  if (context === null) throw new Error("useTab must be used within TabProvider");
  return context;
};
