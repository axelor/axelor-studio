import React, { useState, useMemo, useEffect } from "react";
import { Box, Badge } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil.js";

import { getElementIcon } from "../../utils";
import { DynamicSvg } from "../../components/dynamic-svg/DynamicSVG.jsx";

import TabPanel from "./TabPanel";
import { isGroupVisible, isDefinition } from "./extra";
import Tab from "./Tab";
import styles from "./drawer.module.css";
import useWkfStore from "./stores/useWkfStore";
import useSelectionStore from "./stores/useSelectionStore";
import useSnackbarStore from "./stores/useSnackbarStore";
import useTabStore from "./stores/useTabStore";
import type { TabGroup } from "./stores/useTabStore";
import { useModeler } from "./hooks/useModeler";
import { useBpmnActions } from "./context/BpmnActionsContext";


interface SvgInfo {
  type: string;
  icon: unknown;
  stroke: string;
  fill: string;
}

const DEFAULT_SVG: SvgInfo = { type: "", icon: undefined, stroke: "#000000", fill: "#ffffff" };

export default function DrawerContent() {
  // --- All data from stores (zero props) ---
  const selectedElement = useSelectionStore((s) => s.selectedElement);
  const isMenuActionDisable = useSelectionStore((s) => s.isMenuActionDisable);
  const comments = useSelectionStore((s) => s.comments) || 0;

  const tabs = useTabStore((s) => s.tabs);
  const tabValue = useTabStore((s) => s.tabValue);

  const id = useWkfStore((s) => s.id);
  const wkf = useWkfStore((s) => s.wkf);
  const enableStudioApp = useWkfStore((s) => s.enableStudioApp);
  const showError = useWkfStore((s) => s.showError);

  const openSnackbar = useSnackbarStore();

  const bpmnModeler = useModeler();

  // --- Action callbacks from context (provided by BpmnModeler) ---
  const actions = useBpmnActions();

  const [svg, setSvg] = useState<SvgInfo>(DEFAULT_SVG);

  const tabItems = useMemo(
    () =>
      tabs.map((t) => {
        return t.id === "comments" && comments
          ? { ...t, title: `${translate(t.label)} (${comments})` }
          : { ...t, title: translate(t.label) };
      }),
    [tabs, comments],
  );

  const tab = tabItems[tabValue];
  const { groups = [], id: tabId = "" } = tab ?? {};
  const bo = getBusinessObject(selectedElement);

  useEffect(() => {
    // getElementIcon accepts BpmnElement from utils.ts -- canvas elements stored as ModdleElement
    const svgResult = getElementIcon(selectedElement as unknown as Parameters<typeof getElementIcon>[0]); // safety: bpmn-js element shape differs from getElementIcon parameter type
    if (svgResult && typeof svgResult === "object") {
      setSvg({
        type: (svgResult as SvgInfo).type ?? "",
        icon: (svgResult as SvgInfo).icon,
        stroke: (svgResult as SvgInfo).stroke ?? "#000000",
        fill: (svgResult as SvgInfo).fill ?? "#ffffff",
      });
    } else {
      setSvg(DEFAULT_SVG);
    }
  }, [selectedElement]);

  return (
    <React.Fragment>
      <Box color="body" className={styles.nodeTitle}>
        {selectedElement ? (
          isDefinition(selectedElement) ? (
            ""
          ) : (
            <Box className={styles.panelHeaderContainer}>
              <Box className={styles.panelHeader}>
                <DynamicSvg
                  icon={svg.icon as React.ComponentType<{ width: string; height: string }> | undefined}
                  fill={svg.fill}
                  stroke={svg.stroke}
                />
                <Box>
                  <Box className={styles.panelIconTitle}> {svg?.type}</Box>
                  {bo?.name && <span className={styles.panelElementName}>{bo?.name}</span>}
                </Box>
              </Box>
              {bo && bo?.$type === "bpmn:Participant" && (
                <Badge
                  bg={
                    bo && (bo.get("processRef") as Record<string, unknown> | undefined)?.isExecutable
                      ? "primary"
                      : "secondary"
                  }
                  className={styles.executableBadge}
                  px={2}
                  py={1}
                  rounded="pill"
                >
                  <MaterialIcon icon="bolt" />
                  <Box className={styles.executableText}>
                    {bo &&
                    (bo.get("processRef") as Record<string, unknown> | undefined)?.isExecutable
                      ? translate("Executable")
                      : translate("Non-Executable")}
                  </Box>
                </Badge>
              )}
            </Box>
          )
        ) : (
          ""
        )}
      </Box>
      <Box p={2}>
        <Tab
          onItemClick={actions?.handleChange ?? (() => {})}
          items={tabItems}
          active={tabId}
          isMenuActionDisable={isMenuActionDisable}
        />
        <Box className={styles.tabContent}>
          {groups.map((group: TabGroup, index: number) => (
            <React.Fragment key={group.id}>
              {isGroupVisible(group as unknown as Record<string, unknown>, selectedElement) && ( // safety: bpmn-js group shape is dynamic Record
                <TabPanel
                  group={group as unknown as Record<string, unknown>} // safety: bpmn-js group shape is dynamic Record
                  index={index}
                  selectedElement={selectedElement}
                  id={id}
                  handleAdd={actions?.handleAdd ?? (() => {})}
                  wkf={wkf}
                  reloadView={actions?.reloadView ?? (() => {})}
                  onSave={actions?.onSave ?? (() => Promise.resolve())}
                  openSnackbar={openSnackbar}
                  handleMenuActionTab={actions?.handleMenuActionTab ?? (() => {})}
                  updateCommentsCount={actions?.updateCommentsCount ?? (() => {})}
                  handleSnackbarClick={actions?.handleSnackbarClick ?? (() => {})}
                  enableStudioApp={enableStudioApp}
                  addNewVersion={actions?.addNewVersion ?? (() => Promise.resolve(undefined))}
                  changeColor={actions?.changeColor ?? (() => {})}
                  bpmnModeler={bpmnModeler}
                  showError={showError}
                />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </React.Fragment>
  );
}
