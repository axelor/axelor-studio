import React from "react";
import { Box, Divider } from "@axelor/ui";
import { translate } from "../i18n";

import styles from "./title.module.css";

interface TitleProps {
  label?: string;
  divider?: boolean;
}

const Title = ({ label, divider }: TitleProps) => {
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
