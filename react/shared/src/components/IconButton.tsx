import { Button } from "@axelor/ui";
import React from "react";

import styles from "./icon-button.module.css";

interface IconButtonProps {
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler;
  id?: string;
  size?: string;
  [key: string]: unknown;
}

const IconButton = ({
  children,
  disabled = false,
  className,
  onClick,
  id,
  ...rest
}: IconButtonProps) => {
  return (
    <Button
      rounded="circle"
      d="flex"
      justifyContent="center"
      alignItems="center"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`${styles.iconButton} ${className ? className : ""}`}
      id={id}
      {...(rest as Record<string, never>)}
    >
      {children}
    </Button>
  );
};

export default IconButton;
