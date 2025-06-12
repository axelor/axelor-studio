import React, { useState, useMemo, useEffect } from "react";

import TabPanel from "./TabPanel";
import { isGroupVisible, isDefinition } from "./extra.js";
import { Box, Badge } from "@axelor/ui";
import Tab from "./Tab";
import { getElementIcon, translate } from "../../utils";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil.js";
import { DynamicSvg } from "../../components/dynamic-svg/DynamicSVG.jsx";
import styles from "./drawer.module.css";

export default function DrawerContent({
  selectedElement,
  tabs,
  tabValue,
  handleChange,
  isMenuActionDisable,
  comments = 0,
  id,
  handleAdd,
  wkf,
  reloadView,
  onSave,
  openSnackbar,
  handleMenuActionTab,
  updateCommentsCount,
  handleSnackbarClick,
  enableStudioApp,
  addNewVersion,
  changeColor,
  bpmnModeler,
  showError,
  setDummyProperty,
}) {
  const [svg, setSvg] = useState({
    type: "",
    icon: "",
    stroke: "#000000",
    fill: "#ffffff",
  });

  const tabItems = useMemo(
    () =>
      tabs.map((t) => {
        return t.id === "comments" && comments
          ? { ...t, title: `${translate(t.label)} (${comments})` }
          : { ...t, title: translate(t.label) };
      }),
    [tabs, comments]
  );

  const tab = tabItems && tabItems[tabValue];
  const { groups = [], id: tabId = "" } = tab || {};
  const bo = getBusinessObject(selectedElement);

  useEffect(() => {
    const svg = getElementIcon(selectedElement);
    setSvg(svg);
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
                <DynamicSvg {...svg} />
                <Box>
                  <Box className={styles.panelIconTitle}> {svg?.type}</Box>
                  {bo?.name && (
                    <span className={styles.panelElementName}>{bo?.name}</span>
                  )}
                </Box>
              </Box>
              {bo && bo?.$type === "bpmn:Participant" && (
                <Badge
                  bg={
                    bo && bo?.processRef?.isExecutable ? "primary" : "secondary"
                  }
                  className={styles.executableBadge}
                  px={2}
                  py={1}
                  rounded="pill"
                >
                  <MaterialIcon icon="bolt" />
                  <Box className={styles.executableText}>
                    {bo && bo?.processRef?.isExecutable
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
      <Box p={(2, 2, 2, 2)}>
        <Tab
          onItemClick={handleChange}
          items={tabItems}
          active={tabId}
          isMenuActionDisable={isMenuActionDisable}
          setDummyProperty={setDummyProperty}
        />
        <Box className={styles.tabContent}>
          {groups.map((group, index) => (
            <React.Fragment key={group.id}>
              {isGroupVisible(group, selectedElement) && (
                <TabPanel
                  group={group}
                  index={index}
                  selectedElement={selectedElement}
                  id={id}
                  handleAdd={handleAdd}
                  wkf={wkf}
                  reloadView={reloadView}
                  onSave={onSave}
                  openSnackbar={openSnackbar}
                  handleMenuActionTab={handleMenuActionTab}
                  updateCommentsCount={updateCommentsCount}
                  handleSnackbarClick={handleSnackbarClick}
                  enableStudioApp={enableStudioApp}
                  addNewVersion={addNewVersion}
                  changeColor={changeColor}
                  bpmnModeler={bpmnModeler}
                  showError={showError}
                  setDummyProperty={setDummyProperty}
                />
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </React.Fragment>
  );
}
