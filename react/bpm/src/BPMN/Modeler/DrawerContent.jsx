import React, { useMemo } from "react";

import TabPanel from "./TabPanel";
import { isGroupVisible, isDefinition } from "./extra.js";
import { Box, Badge } from "@axelor/ui";
import Tab from "./Tab";
import { translate } from "../../utils";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil.js";
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

  return (
    <React.Fragment>
      <Box color="body" className={styles.nodeTitle}>
        {selectedElement ? (
          isDefinition(selectedElement) ? (
            ""
          ) : (
            <>
              {selectedElement?.id}
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
            </>
          )
        ) : (
          ""
        )}
      </Box>
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
    </React.Fragment>
  );
}
