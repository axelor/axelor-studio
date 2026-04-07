import React, { createContext, useContext, useReducer } from "react";

import { dialogReducer, type DialogState, type DialogAction } from "./dialog-reducer";

export interface DialogContextValue extends DialogState {
  dispatch: React.Dispatch<DialogAction>;
}

const INITIAL_STATE: DialogState = {
  open: false,
  title: null,
  message: null,
  onSave: () => {},
  onClose: () => {},
};

export const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * Guard hook for DialogContext -- throws if used outside DialogContextProvider.
 * For the higher-level `useDialog()` (returns openDialog callback), see useDialog.tsx.
 */
export function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (ctx === null) {
    throw new Error("useDialogContext must be used within a DialogContextProvider");
  }
  return ctx;
}

export const DialogContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(dialogReducer, INITIAL_STATE);
  return (
    <DialogContext.Provider
      value={{
        open: state.open,
        title: state.title,
        message: state.message,
        onSave: state.onSave,
        onClose: state.onClose,
        dispatch,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
};
