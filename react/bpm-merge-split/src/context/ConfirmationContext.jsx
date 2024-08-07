import { useState, createContext, useContext } from "react";
import Dialog from "../components/Dialog";
import { Box } from "@axelor/ui";
import { translate } from "../utils";

const ConfirmationContext = createContext();

export const ConfirmationDialogProvider = ({ children }) => {
  const [question, setQuestion] = useState(null);
  const [callback, setCallback] = useState(null);

  const askConfirmation = (que = "", callback) => {
    setQuestion(que);
    setCallback(() => callback);
  };

  const handleConfirm = () => {
    if (callback) {
      callback();
    }
    setQuestion(null);
    setCallback(null);
  };

  const clearConfirmation = () => {
    setQuestion(null);
    setCallback(null);
  };

  return (
    <ConfirmationContext.Provider
      value={{ askConfirmation, clearConfirmation }}
    >
      {children}
      {question && (
        <Dialog
          open={question}
          title={translate("Are you sure ?")}
          onConfirm={handleConfirm}
          onCancel={clearConfirmation}
        >
          <Box>{translate(question)}</Box>
        </Dialog>
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => useContext(ConfirmationContext);
