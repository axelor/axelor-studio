import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";

import TabPanel from "./TabPanel";
import { Tab, Tabs } from "../../components/Tabs";
import { TabScrollButtonComponent } from "../../components/properties/components";
import { isGroupVisible, isDefinition } from "./extra.js";
import { translate } from "../../utils";

const useStyles = makeStyles((theme) => ({
  nodeTitle: {
    fontSize: "120%",
    fontWeight: "bolder",
  },
}));

export default function DrawerContent({
  selectedElement,
  tabs,
  tabValue,
  handleChange,
  isMenuActionDisable,
  comments,
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
  fetchDiagram,
  changeColor,
  bpmnModeler,
  showError,
}) {
  const classes = useStyles();
  return (
    <React.Fragment>
      <Typography className={classes.nodeTitle}>
        {selectedElement
          ? isDefinition(selectedElement)
            ? ""
            : selectedElement.id
          : ""}
      </Typography>
      <Tabs
        value={tabValue}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        ScrollButtonComponent={TabScrollButtonComponent}
      >
        {tabs.map((tab, tabIndex) => (
          <Tab
            disabled={tab.id === "menu-action-tab" && isMenuActionDisable}
            label={
              tab.id === "comments" && comments
                ? `${translate(tab.label)} (${comments})`
                : translate(tab.label)
            }
            key={tabIndex}
            data-tab={tab.id}
          />
        ))}
      </Tabs>
      <React.Fragment>
        {tabs &&
          tabs[tabValue] &&
          tabs[tabValue].groups &&
          tabs[tabValue].groups.map((group, index) => (
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
                  fetchDiagram={fetchDiagram}
                  changeColor={changeColor}
                  bpmnModeler={bpmnModeler}
                  showError={showError}
                />
              )}
            </React.Fragment>
          ))}
      </React.Fragment>
    </React.Fragment>
  );
}
