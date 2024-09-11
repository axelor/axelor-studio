import { Button } from "@axelor/ui";
import React from "react";
import styles from "./icon-button.module.css";

const IconButton = ({ children, disabled = false, className, ...props }) => {
  return (
    <Button
      rounded="circle"
      d="flex"
      p={0}
      justifyContent="center"
      alignItems="center"
      disabled={disabled}
      onClick={disabled ? null : props.onClick}
      className={`${styles.iconButton}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export default IconButton;
