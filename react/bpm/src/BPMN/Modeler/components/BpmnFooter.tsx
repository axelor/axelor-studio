import React from "react";
import { Box, Button } from "@axelor/ui";

import { Logo } from "../../../components/Logo";
import Icons from "../../../components/icons/Icons.jsx";
import { ICON_TYPE } from "../constants";
import styles from "../bpmn-modeler.module.css";

interface BpmnFooterProps {
  issues: { errors?: unknown[]; warnings?: unknown[] };
  onToggle: (e: React.MouseEvent) => void;
  translate: (key: string) => string;
}

function BpmnFooter({ issues, onToggle, translate: _translate }: BpmnFooterProps) {
  return (
    <Box className={styles.footer}>
      <Button className={styles.issueViewBtn} onClick={onToggle}>
        <Box className="flexCenter" gap={10}>
          <Icons type={ICON_TYPE.ERROR} disabled={!issues.errors?.length} />
          <Box> {issues.errors?.length || 0}</Box>
          <Icons type={ICON_TYPE.WARNING} disabled={!issues.warnings?.length} />
          <Box>{issues.warnings?.length || 0}</Box>
        </Box>
      </Button>
      <Logo />
    </Box>
  );
}

export default BpmnFooter;
