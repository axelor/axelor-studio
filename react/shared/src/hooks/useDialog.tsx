import { useCallback } from "react";

import { useDialogContext } from "./dialog-context";

interface OpenDialogOptions {
  title?: string;
  message?: string;
  onSave?: () => void;
  onClose?: () => void;
}

export const useDialog = () => {
  const { dispatch } = useDialogContext();

  const openDialog = useCallback(
    ({ title, message, onSave = () => {}, onClose = () => {} }: OpenDialogOptions) => {
      dispatch({
        type: "OPEN_DIALOG",
        payload: {
          title,
          message,
          onSave,
          onClose,
        },
      });
    },
    [dispatch],
  );

  return openDialog;
};
