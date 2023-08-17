import React from "react";
import classnames from "classnames";
import { makeStyles } from "@material-ui/core/styles";

import RenderComponent from "./RenderWidget";
import { isHiddenProperty } from "./extra.js";
import { translate } from "../../utils";

const useStyles = makeStyles((theme) => ({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
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
    borderTop: "1px dotted #ccc",
  },
  businessRuleTask: {
    marginTop: 0,
  },
  comments: {
    height: "calc(100% - 66px)",
  },
}));

function Entry({ entry, selectedElement, changeColor, bpmnModeler, wkf }) {
  return (
    !isHiddenProperty(selectedElement, entry) && (
      <div key={entry.id}>
        <RenderComponent
          entry={entry}
          selectedElement={selectedElement}
          changeColor={changeColor}
          bpmnModeler={bpmnModeler}
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
}) {
  const classes = useStyles();
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
        />
      ) : (
        group.entries.length > 0 && (
          <React.Fragment>
            <React.Fragment>
              {index > 0 && <div className={classes.divider} />}
            </React.Fragment>
            <div className={classes.groupLabel}>{translate(group.label)}</div>
            <div>
              {group.entries.map((entry, i) => (
                <Entry
                  entry={entry}
                  key={i}
                  selectedElement={selectedElement}
                  changeColor={changeColor}
                  bpmnModeler={bpmnModeler}
                />
              ))}
            </div>
          </React.Fragment>
        )
      )}
    </div>
  );
}
