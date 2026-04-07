import React, { useEffect, useState } from "react";
import { Box, Alert } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "@studio/shared/i18n";

const ICON: Record<string, string> = {
  danger: "error",
  success: "beenhere",
};

interface AlertComponentProps {
  status: { type: string; message: string };
  onClose: () => void;
}

export default function AlertComponent({ status, onClose }: AlertComponentProps) {
  const { type, message } = status;
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (message) {
      if (!isHovered) {
        timeout = setTimeout(() => {
          onClose?.();
        }, 2000);
      }
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [isHovered, message, onClose]);

  return (
    <Alert
      variant={type as React.ComponentProps<typeof Alert>["variant"]}
      display="flex"
      gap={5}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        zIndex: 3,
        display: "flex",
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        <MaterialIcon
          icon={(ICON[type] || "beenhere") as React.ComponentProps<typeof MaterialIcon>["icon"]}
        />
      </Box>
      <Box
        display="flex"
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
