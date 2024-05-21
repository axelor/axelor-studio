import { useState, createContext, useContext } from "react";
import AlertComponent from "../components/Alert";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = (type, message) => {
    setError({ type, message });
  };

  const clearError = () => {
    setError(null);
  };
  return (
    <AlertContext.Provider value={{ error, showError, clearError }}>
      {children}
      {error && <AlertComponent status={error} onClose={clearError} />}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
