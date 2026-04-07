/**
 * Dialog context and hook for ExpressionBuilder.
 *
 * Extracted to avoid circular imports between index.tsx and ExpressionBuilder.tsx.
 */
import React, { createContext, useContext } from "react";

interface DialogContextValue {
  DialogBox: React.ComponentType<{
    open: boolean;
    title?: string;
    children?: React.ReactNode;
    handleSave?: () => void;
    handleClose?: () => void;
    fullscreen?: boolean;
    className?: string;
    isFooterShow?: boolean;
    [key: string]: unknown;
  }>;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (ctx === null) throw new Error("useDialog must be used within a DialogContext.Provider");
  return ctx;
}
