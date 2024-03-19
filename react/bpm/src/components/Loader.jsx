import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@axelor/ui";
import classNames from "classnames";
import styles from "./Loader.module.css";

function Loader({ text = "Loading...", delay = 400 }) {
  const [show, setShow] = useState(false);

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
      className={classNames(styles.loader, { [styles.show]: show })}
    >
      <Box>
        <CircularProgress size={25} indeterminate />
      </Box>
      <Box>{text}</Box>
    </Box>
  );
}

export default Loader;
