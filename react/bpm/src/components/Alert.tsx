import React, { useEffect, useState } from "react";
import { Box, Alert } from "@axelor/ui";

type AlertVariant = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "@studio/shared/i18n";

import styles from "./alert.module.css";

interface AlertComponentProps {
  open?: boolean;
  message?: string | null;
  messageType?: string | null;
  onClose?: (...args: unknown[]) => void;
}

export default function AlertComponent({
  open = false,
  message,
  messageType,
  onClose,
}: AlertComponentProps) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

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
      variant={(messageType ?? undefined) as AlertVariant | undefined}
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
          {message ? translate(message) : ""}
        </Box>
        <MaterialIcon fontSize={20} icon="close" onClick={onClose} />
      </Box>
    </Alert>
  );
}
