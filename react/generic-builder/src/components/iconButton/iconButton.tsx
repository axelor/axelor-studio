import { Button } from "@axelor/ui";
import React from "react";

import styles from "./icon-button.module.css";

interface IconButtonProps {
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  size?: string;
  style?: React.CSSProperties;
  title?: string;
  color?: string;
  [key: string]: unknown;
}

const IconButton = ({
  children,
  disabled = false,
  className,
  onClick,
  size: _size,
  title: _title,
  color: _color,
  ...props
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
      style={props.style}
    >
      {children}
    </Button>
  );
};

export default IconButton;
