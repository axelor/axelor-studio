import React from "react";
import classnames from "classnames";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  button: {
    color: "#0275d8",
    textTransform: "none",
  },
  buttonLabel: {
    maxHeight: 30,
  },
}));

function ButtonComp({ title, Icon, onClick, className }) {
  const classes = useStyles();
  if (!title) {
    return (
      <IconButton
        size="medium"
        onClick={onClick}
        className={classnames(classes.button, className)}
        style={{ padding: "0px 12px" }}
      >
        <Icon fontSize="small" />
      </IconButton>
    );
  }

  if (!Icon) {
    return (
      <Button
        className={classnames(classes.button, classes.buttonLabel, className)}
        onClick={onClick}
      >
        {title}
      </Button>
    );
  }

  return (
    <Button
      className={classnames(classes.button, classes.buttonLabel, className)}
      endIcon={<Icon />}
      onClick={onClick}
    >
      {title}
    </Button>
  );
}

export default ButtonComp;
