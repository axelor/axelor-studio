import React, { useEffect } from "react";
import useDialog from "../hooks/useDialog";

const OpenDialog = ({ title, message, onSave, onClose }) => {
  const { openDialog } = useDialog();

  useEffect(() => {
    openDialog({ title, message, onSave, onClose });
  }, [title, message, onSave, onClose, openDialog]);

  return null;
};

export default OpenDialog;
