import React, { useEffect, useState } from "react";
import { Box, Alert } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { translate } from "../../utils";

const ICON = {
  danger: "error",
  success: "beenhere",
};

export default function AlertComponent({ status = {}, onClose }) {
  const { type, message } = status;
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    let timeout;
    if (message) {
      if (!isHovered) {
        timeout = setTimeout(() => {
          onClose && onClose();
        }, 2000);
      }
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [isHovered, message, onClose]);

  return (
    <Alert
      variant={type}
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
        <MaterialIcon icon={ICON[type] || "beenhere"} />
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
