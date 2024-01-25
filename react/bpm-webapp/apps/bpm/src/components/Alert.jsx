import React, { useEffect, useState } from "react";
import { Box, Alert } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const ICON = {
  danger: "error",
  success: "beenhere",
};

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
      <Box d="flex" alignItems="center" justifyContent="center">
        <MaterialIcon icon={ICON[messageType] || "beenhere"} />
      </Box>
      <Box
        d="flex"
        alignItems="center"
        justifyContent="center"
        gap={5}
        style={{ cursor: "pointer" }}
      >
        <Box fontSize={5} flex={1}>
          {message}
        </Box>
        <MaterialIcon fontSize={20} icon="close" onClick={onClose} />
      </Box>
    </Alert>
  );
}
