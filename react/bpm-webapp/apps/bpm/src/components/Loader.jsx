import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@axelor/ui";
import { makeStyles } from "@material-ui/core/styles";
import classNames from "classnames";

const useStyles = makeStyles(() => ({
  loader: {
    gap: "0.5rem",
    padding: "1rem",
    opacity: 0,
    visibility: "hidden",
    transition: "opacity 400ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
  },
  show: {
    opacity: 1,
    visibility: "visible",
  },
}));

function Loader({ text = "Loading...", delay = 400 }) {
  const [show, setShow] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    let canceled = false;
    let timer = setTimeout(() => {
      if (!canceled) {
        setShow(true);
      }
    }, delay);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [delay]);

  return (
    <Box
      d="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      className={classNames(classes.loader, { [classes.show]: show })}
    >
      <Box>
        <CircularProgress size={25} indeterminate />
      </Box>
      <Box>{text}</Box>
    </Box>
  );
}

export default Loader;
