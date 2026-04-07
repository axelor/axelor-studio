import React from "react";
import { CommandBar } from "@axelor/ui";

import styles from "../bpmn-modeler.module.css";

interface BpmnBottomToolbarProps {
  bottomToolbar: unknown[];
  isXmlEditorOpen: boolean;
}

function BpmnBottomToolbar({ bottomToolbar, isXmlEditorOpen }: BpmnBottomToolbarProps) {
  if (isXmlEditorOpen) return null;

  return (
    <CommandBar
      items={bottomToolbar as Parameters<typeof CommandBar>[0]["items"]}
      className={styles.bottomBar}
    />
  );
}

export default BpmnBottomToolbar;
