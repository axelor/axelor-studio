import { useContext, useCallback } from "react";
import { DialogContext } from "../context/dialog-context";

export const useDialog = () => {
  const { dispatch } = useContext(DialogContext);

  const openDialog = useCallback(({ title, message, onSave=()=>{}, onClose=()=>{} }) => {
    dispatch({
      type: "OPEN_DIALOG",
      payload: {
        title,
        message,
        onSave,
        onClose,
      },
    });
  },[dispatch]);

  return openDialog
};

export default useDialog;
