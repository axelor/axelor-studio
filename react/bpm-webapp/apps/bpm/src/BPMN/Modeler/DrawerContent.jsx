import React, { useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";

import TabPanel from "./TabPanel";
import { isGroupVisible, isDefinition } from "./extra.js";
import { Box } from "@axelor/ui";
import Tab from "./Tab";
import { translate } from "../../utils";

const useStyles = makeStyles((theme) => ({
  nodeTitle: {
    fontSize: "120%",
    fontWeight: "bolder",
  },
  navDisable: {
    cursor: "default",
    pointerEvents: "none",
    opacity: 0.8,
  },
  tabContent: {
    border: "var(--ax-theme-panel-border, 1px solid var(--bs-border-color))",
    borderRadius:
      "var(--ax-theme-panel-border-radius, var(--bs-border-radius))",
    padding: "var(--ax-theme-panel-body-padding, .5rem)",
  },
}));

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
  const classes = useStyles();

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

  return (
    <React.Fragment>
      <Box color="body" className={classes.nodeTitle}>
        {selectedElement
          ? isDefinition(selectedElement)
            ? ""
            : selectedElement?.id
          : ""}
      </Box>
      <Tab
        onItemClick={handleChange}
        items={tabItems}
        active={tabId}
        isMenuActionDisable={isMenuActionDisable}
        setDummyProperty={setDummyProperty}
      />
      <Box className={classes.tabContent}>
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
