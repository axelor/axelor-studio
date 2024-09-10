import { createContext, useReducer } from "react";
import dialogReducer from "./dialog-reducer";

const INITIAL_STATE = {
  open: false,
  title: null,
  message: null,
  onSave: () => {},
  onClose: () => {},
};

export const DialogContext = createContext(INITIAL_STATE);

export const DialogContextProvider = ({ children }) => {
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
