import { useState } from "react";

import AlertComponent from "../components/Alert";
import { AlertContext } from "../hooks/useAlert";

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<{ type: string; message: string } | null>(null);

  const showError = (type: string, message: string) => {
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
