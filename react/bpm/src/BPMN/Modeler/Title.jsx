import React from "react";
import { Box, Divider } from "@axelor/ui";
import styles from "./title.module.css";
import { translate } from "../../utils";

const Title = ({ label, divider }) => {
  return (
    <div>
      {divider && <Divider className={styles.divider} />}
      {label && (
        <Box color="body" className={styles.label}>
          {translate(label)}
        </Box>
      )}
    </div>
  );
};

export default Title;
