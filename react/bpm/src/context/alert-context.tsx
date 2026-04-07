import React, { createContext, useReducer, useContext, type ReactNode } from "react";

interface AlertState {
  open: boolean;
  message: string | null;
  messageType: string | null;
}

type AlertAction =
  | { type: "OPEN_ALERT"; payload: { message: string; messageType: string } }
  | { type: "CLOSE_ALERT" };

interface AlertContextValue {
  state: AlertState;
  dispatch: React.Dispatch<AlertAction>;
}

const AlertContext = createContext<AlertContextValue | null>(null);

const alertReducer = (state: AlertState, action: AlertAction): AlertState => {
  switch (action.type) {
    case "OPEN_ALERT":
      return {
        ...state,
        open: true,
        message: action.payload.message,
        messageType: action.payload.messageType,
      };
    case "CLOSE_ALERT":
      return {
        ...state,
        open: false,
        message: null,
        messageType: null,
      };
    default:
      return state;
  }
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(alertReducer, {
    open: false,
    message: null,
    messageType: null,
  });

  return <AlertContext.Provider value={{ state, dispatch }}>{children}</AlertContext.Provider>;
};

export const useAlert = (): AlertContextValue => {
  const context = useContext(AlertContext);
  if (context === null) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
