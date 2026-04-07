import { useState, useEffect } from "react";

import { TabContext } from "../hooks/useTabChange";

export const TabProvider = ({ children }: { children: React.ReactNode }) => {
  const [tabVisible, setTabVisible] = useState(false);

  useEffect(() => {
    const app = document.getElementById("app");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setTabVisible(entry.isIntersecting);
      });
    });

    if (app) {
      observer.observe(app);
    }

    return () => {
      if (app) {
        observer.unobserve(app);
      }
    };
  }, []);
  return <TabContext.Provider value={{ tabVisible }}>{children}</TabContext.Provider>;
};
