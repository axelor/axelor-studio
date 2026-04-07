import { createContext, useContext } from "react";

interface ConfirmationContextValue {
  askConfirmation: (question: string, callback: () => void) => void;
  clearConfirmation: () => void;
}

export const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export const useConfirmation = (): ConfirmationContextValue => {
  const context = useContext(ConfirmationContext);
  if (context === null) throw new Error("useConfirmation must be used within ConfirmationDialogProvider");
  return context;
};
