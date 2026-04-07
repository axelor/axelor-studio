import { useState } from "react";
import { Box } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import Dialog from "../components/Dialog";
import { ConfirmationContext } from "../hooks/useConfirmation";

export const ConfirmationDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [question, setQuestion] = useState<string | null>(null);
  const [callback, setCallback] = useState<(() => void) | null>(null);

  const askConfirmation = (que = "", callback: () => void) => {
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
    <ConfirmationContext.Provider value={{ askConfirmation, clearConfirmation }}>
      {children}
      {question && (
        <Dialog
          open={!!question}
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
