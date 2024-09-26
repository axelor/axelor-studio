import React from "react";
import classnames from "classnames";
import { Button } from "@axelor/ui";
import IconButton from "../../IconButton";
import styles from "./button.module.css";
import { translate } from "../../../utils";

function ButtonComp({ title, Icon, onClick, className }) {
  if (!title) {
    return (
      <IconButton
        size="medium"
        onClick={onClick}
        className={classnames(styles.button, className)}
        style={{ padding: "0px 12px" }}
      >
        <Icon fontSize="small" />
      </IconButton>
    );
  }

  if (!Icon) {
    return (
      <Button
        className={classnames(styles.button, styles.buttonLabel, className)}
        onClick={onClick}
      >
        {translate(title)}
      </Button>
    );
  }

  return (
    <Button
      className={classnames(styles.button, styles.buttonLabel, className)}
      endIcon={<Icon />}
      onClick={onClick}
    >
      {translate(title)}
    </Button>
  );
}

export default ButtonComp;
