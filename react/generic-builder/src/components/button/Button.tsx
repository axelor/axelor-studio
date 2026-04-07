import React from "react";
import classnames from "classnames";
import { Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import IconButton from "../iconButton/iconButton";
import { translate } from "../../common/utils";

import styles from "./Button.module.css";

interface ButtonCompProps {
  title?: string;
  icon?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "light" | "dark";
}

function ButtonComp({
  title,
  icon = "",
  onClick,
  className,
  disabled = false,
  variant = "primary",
}: ButtonCompProps) {
  if (!title) {
    return (
      <IconButton
        size="medium"
        onClick={onClick}
        className={classnames(styles.button, className)}
        style={{ padding: "0px 12px" }}
        disabled={disabled}
      >
        <MaterialIcon icon={icon as "add"} fontSize="small" />
      </IconButton>
    );
  } else if (!icon) {
    return (
      <Button
        className={classnames(styles.button, styles.buttonLabel, className)}
        onClick={onClick}
        disabled={disabled}
        variant={variant}
      >
        {translate(title)}
      </Button>
    );
  } else
    return (
      <Button
        className={classnames(styles.button, styles.buttonLabel, className)}
        onClick={onClick}
        disabled={disabled}
        variant={variant}
        d="flex"
        alignItems="center"
        gap={4}
        outline
      >
        {translate(title)} <MaterialIcon icon={icon as "add"} fontSize={18} />
      </Button>
    );
}

export default ButtonComp;
