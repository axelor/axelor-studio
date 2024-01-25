import React from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import RenderComponent from "./RenderWidget";
import { isHiddenProperty } from "./extra.js";
import { translate } from "../../utils";
import { Box, Divider } from "@axelor/ui";

const useStyles = makeStyles((theme) => ({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  groupContainer: {
    marginTop: 10,
  },
  divider: {
    marginTop: 15,
  },
  businessRuleTask: {
    marginTop: 0,
  },
}));

const getProcessId = (element) => {
  const bo = getBusinessObject(element);
  const processRef = bo && bo.get("processRef");
  return processRef?.id || bo?.id;
};

function Entry({ entry, selectedElement, changeColor, bpmnModeler, readOnly }) {
  return (
    !isHiddenProperty(selectedElement, entry) && (
      <div key={entry.id}>
        <RenderComponent
          entry={entry}
          selectedElement={selectedElement}
          changeColor={changeColor}
          bpmnModeler={bpmnModeler}
          readOnly={readOnly}
        />
      </div>
    )
  );
}

export default function TabPanel({
  group,
  index,
  selectedElement,
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

  const getReadOnly = React.useCallback(
    (entry) => {
      const proceedId = getProcessId(selectedElement);
      const oldNodes = JSON.parse(wkf?.oldNodes || "{}");
      return (
        (oldNodes || {}).hasOwnProperty(proceedId) &&
        wkf?.statusSelect !== 1 &&
        entry?.isProcess
      );
    },
    [selectedElement, wkf]
  );

  return (
    <div
      key={group.id}
      data-group={group.id}
      className={classnames(classes.groupContainer, classes[group.className])}
    >
      {group.component ? (
        <group.component
          element={selectedElement}
          index={index}
          label={group.label}
          bpmnModeler={bpmnModeler}
          bpmnFactory={bpmnModeler && bpmnModeler.get("bpmnFactory")}
          bpmnModdle={bpmnModeler && bpmnModeler.get("moddle")}
          id={id}
          handleAdd={handleAdd}
          wkf={wkf}
          reloadView={reloadView}
          onSave={onSave}
          openSnackbar={openSnackbar.open}
          handleMenuActionTab={handleMenuActionTab}
          updateCommentsCount={updateCommentsCount}
          handleSnackbarClick={handleSnackbarClick}
          enableStudioApp={enableStudioApp}
          addNewVersion={addNewVersion}
          showError={showError}
          setDummyProperty={setDummyProperty}
        />
      ) : (
        group.entries.length > 0 && (
          <React.Fragment>
            <React.Fragment>
              {index > 0 && <Divider className={classes.divider} />}
            </React.Fragment>
            <Box color="body" className={classes.groupLabel}>
              {translate(group.label)}
            </Box>
            <div>
              {group.entries.map((entry, i) => (
                <Entry
                  entry={entry}
                  key={i}
                  selectedElement={selectedElement}
                  changeColor={changeColor}
                  bpmnModeler={bpmnModeler}
                  readOnly={getReadOnly(entry)}
                  setDummyProperty={setDummyProperty}
                />
              ))}
            </div>
          </React.Fragment>
        )
      )}
    </div>
  );
}
