import React, { createContext, useReducer, useContext } from "react";

const AlertContext = createContext();
const alertReducer = (state, action) => {
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

export const AlertProvider = ({ children }) => {
  const [state, dispatch] = useReducer(alertReducer, {
    open: false,
    message: null,
    messageType: null,
  });

  return (
    <AlertContext.Provider value={{ state, dispatch }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  return useContext(AlertContext);
};
