import React, { useEffect, useState } from "react";
import { Box, Alert } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "../utils";
import styles from "./alert.module.css";

export default function AlertComponent({
  open = false,
  message,
  messageType,
  onClose,
}) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let timeout;

    if (open) {
      if (!isHovered) {
        timeout = setTimeout(() => {
          onClose && onClose();
        }, 2000);
      }
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [open, isHovered]);

  return (
    <Alert
      variant={messageType}
      d="flex"
      alignItems="center"
      className={styles.alertContainer}
      gap={5}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box
        d="flex"
        alignItems="center"
        justifyContent="center"
        gap={5}
        style={{ cursor: "pointer" }}
      >
        <Box fontSize={5} flex={1}>
          {translate(message)}
        </Box>
        <MaterialIcon fontSize={20} icon="close" onClick={onClose} />
      </Box>
    </Alert>
  );
}
