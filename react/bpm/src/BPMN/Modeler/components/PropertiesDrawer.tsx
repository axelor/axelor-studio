import React, { useCallback } from "react";
import { Resizable } from "re-resizable";
import { Box } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";
import type { TypedBpmnModeler } from "@studio/shared/types";

import DrawerContent from "../DrawerContent";
import { resizeStyle, DRAWER_WIDTH } from "../utils/modeler-helpers";
import styles from "../bpmn-modeler.module.css";

interface PropertiesDrawerProps {
  modeler: TypedBpmnModeler | null;
  width: number;
  height: string | number;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
  setHeight: React.Dispatch<React.SetStateAction<string | number>>;
  setCSSWidth: (w: string) => void;
  drawerOpen: boolean;
  isXmlEditorOpen: boolean;
  availableWidth: React.MutableRefObject<number>;
}

function PropertiesDrawer({
  modeler,
  width,
  height,
  setWidth,
  setHeight,
  setCSSWidth,
  drawerOpen,
  isXmlEditorOpen,
  availableWidth,
}: PropertiesDrawerProps) {
  const propertiesPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!modeler) return;
      try {
        const propertiesPanel = modeler.get("propertiesPanel");
        if (node) {
          propertiesPanel.attachTo(node);
        } else {
          propertiesPanel.detach();
        }
      } catch (e) {
        console.warn("Properties panel attach deferred:", (e as Error).message);
      }
    },
    [modeler],
  );

  return (
    <Box position="sticky" style={{ top: 0, right: 0, height: "100%" }}>
      <Resizable
        style={resizeStyle}
        size={{ width, height: height as number }}
        onResizeStop={(_e, _direction, _ref, d) => {
          if (!isXmlEditorOpen) {
            setWidth((w) => w + d.width);
            setHeight((h) => (typeof h === "number" ? h + d.height : h));
            setCSSWidth(`${width + d.width}px`);
          }
        }}
        maxWidth={Math.max(window.innerWidth - 230, DRAWER_WIDTH)}
        minWidth={!width || !drawerOpen || availableWidth.current <= 1024 ? 0 : DRAWER_WIDTH}
        minHeight={height}
        enable={{
          left: !isXmlEditorOpen,
        }}
      >
        <Box className={styles.drawerPaper} maxH={100}>
          <Box className={styles.drawerContainer}>
            <DrawerContent />
          </Box>
        </Box>
        <Box
          className="bpmn-property-toggle"
          color="body"
          borderEnd
          borderTop
          borderStart
          pos="absolute"
          bg="body-tertiary"
          userSelect="none"
          roundedTop
          fontSize={6}
          onClick={() => {
            if (!isXmlEditorOpen) {
              setWidth((w) => (w === 0 ? DRAWER_WIDTH : 0));
              setCSSWidth(`${width === 0 ? DRAWER_WIDTH : 0}px`);
            }
          }}
        >
          {translate("Properties")}
        </Box>
        <div
          className="properties-panel-parent"
          id="js-properties-panel"
          ref={propertiesPanelRef}
        ></div>
      </Resizable>
    </Box>
  );
}

export default PropertiesDrawer;
