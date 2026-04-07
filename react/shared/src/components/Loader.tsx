import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@axelor/ui";

import styles from "./loader.module.css";

function Loader({ text = "Loading...", delay = 400, classes = "" }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let canceled = false;
    const timer = setTimeout(() => {
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
      className={[styles.loader, classes, show ? styles.show : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <Box>
        <CircularProgress size={25} indeterminate />
      </Box>
      <Box>{text}</Box>
    </Box>
  );
}

export default Loader;
