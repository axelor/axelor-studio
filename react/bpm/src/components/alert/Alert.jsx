import React, { useEffect, useState } from "react";
import { Box, Alert } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useAlert } from "../../context/alert-context";
import { translate } from "../../utils";
import styles from "./alert.module.css";

const AlertComponent = () => {
  const { state, dispatch } = useAlert();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let timeout;
    if (state.open) {
      if (!isHovered) {
        timeout = setTimeout(() => {
          dispatch({ type: "CLOSE_ALERT" });
        }, 2000);
      }
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [state.open, isHovered, dispatch]);

  if (!state.open) {
    return null;
  }

  return (
    <Alert
      variant={state.messageType}
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
          {translate(state.message)}
        </Box>
        <MaterialIcon
          fontSize={20}
          icon="close"
          onClick={() => dispatch({ type: "CLOSE_ALERT" })}
        />
      </Box>
    </Alert>
  );
};

export default AlertComponent;
