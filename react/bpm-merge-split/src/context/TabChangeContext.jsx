import { useState, createContext, useEffect, useContext } from "react";

const TabContext = createContext();

export const TabProvider = ({ children }) => {
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
  return (
    <TabContext.Provider value={{ tabVisible }}>{children}</TabContext.Provider>
  );
};

export const useTab = () => useContext(TabContext);
