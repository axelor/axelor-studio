import { createContext, useContext } from "react";

interface AlertContextValue {
  error: { type: string; message: string } | null;
  showError: (type: string, message: string) => void;
  clearError: () => void;
}

export const AlertContext = createContext<AlertContextValue | null>(null);

export const useAlert = (): AlertContextValue => {
  const context = useContext(AlertContext);
  if (context === null) throw new Error("useAlert must be used within AlertProvider");
  return context;
};
