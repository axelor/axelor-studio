import React from "react";
import { Resizable } from "re-resizable";
import { Box } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import styles from "../dmn-modeler.module.css";

import DmnDrawerContent from "./DmnDrawerContent";

const DRAWER_WIDTH = 380;

const resizeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "1px solid var(--bs-secondary-bg)",
};

interface DmnPropertiesDrawerProps {
  dmnModeler: import("dmn-js/lib/Modeler").DmnModeler;
  width: number;
  height: number | string;
  setWidth: React.Dispatch<React.SetStateAction<number>>;
  setHeight: (h: number | string) => void;
  setCSSWidth: (w: string) => void;
  drawerOpen: boolean;
  availableWidth: React.RefObject<number>;
  getData: (() => Record<string, unknown>[] | undefined) | null;
  getReadOnly: (entry: Record<string, unknown>) => boolean;
  onSave: () => void;
  nameCol: string | null;
  getNameCol: (nc: string) => void;
}

/**
 * Resizable drawer for DMN property panels.
 * Same resize handle pattern as BPMN PropertiesDrawer.
 */
function DmnPropertiesDrawer({
  dmnModeler,
  width,
  height,
  setWidth,
  setHeight,
  setCSSWidth,
  drawerOpen,
  availableWidth,
  getData,
  getReadOnly,
  onSave,
  nameCol,
  getNameCol,
}: DmnPropertiesDrawerProps) {
  return (
    <Box style={{ position: "sticky", top: 0, right: 0 }} h={100}>
      <Resizable
        style={resizeStyle}
        size={{ width, height }}
        onResizeStop={(e, direction, ref, d) => {
          setWidth((w) => w + d.width);
          setHeight(Number(height) + d.height);
          setCSSWidth(`${width + d.width}px`);
        }}
        maxWidth={Math.max(window.innerWidth - 230, DRAWER_WIDTH)}
        minWidth={!width || !drawerOpen || availableWidth.current <= 1024 ? 0 : DRAWER_WIDTH}
        minHeight={height}
        enable={{
          left: true,
        }}
      >
        <Box className={styles.drawerPaper} id="drawer">
          <Box className={styles.drawerContainer}>
            <DmnDrawerContent
              dmnModeler={dmnModeler}
              getData={getData}
              getReadOnly={getReadOnly}
              onSave={onSave}
              nameCol={nameCol}
              getNameCol={getNameCol}
            />
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
            setWidth((w) => (w === 0 ? DRAWER_WIDTH : 0));
            setCSSWidth(`${width === 0 ? DRAWER_WIDTH : 0}px`);
          }}
        >
          {translate("Properties")}
        </Box>
      </Resizable>
    </Box>
  );
}

export default DmnPropertiesDrawer;
