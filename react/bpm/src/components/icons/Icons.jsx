import React from "react";
import { Box, clsx } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { ICON_TYPE } from "../../BPMN/Modeler/constants";
import styles from "./icons.module.css";

export const Icons = ({ type, disabled = false }) => {
  switch (type) {
    case ICON_TYPE.SUCCESS:
      return (
        <Box
          className={clsx(styles.itemIcon, styles.success, {
            [styles.disabled]: disabled,
          })}
        >
          <MaterialIcon icon={"check"} />
        </Box>
      );
    case ICON_TYPE.WARNING:
      return (
        <Box
          className={clsx(styles.itemIcon, styles.warning, {
            [styles.disabled]: disabled,
          })}
        >
          <MaterialIcon icon={"warning"} />
        </Box>
      );

    case ICON_TYPE.ERROR:
      return (
        <Box
          className={clsx(styles.itemIcon, styles.error, {
            [styles.disabled]: disabled,
          })}
        >
          <MaterialIcon icon={"close"} />
        </Box>
      );
  }
};

export default Icons;
