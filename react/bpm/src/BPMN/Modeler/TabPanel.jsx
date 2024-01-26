import React from "react";
import classnames from "classnames";

import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import RenderComponent from "./RenderWidget";
import { isHiddenProperty } from "./extra.js";
import styles from "./tabpanel.module.css";
import Title from "./Title";

const getProcessId = (element) => {
  const bo = getBusinessObject(element);
  const processRef = bo && bo.get("processRef");
  return processRef?.id || bo?.id;
};

function Entry({
  entry,
  selectedElement,
  changeColor,
  bpmnModeler,
  readOnly,
  setDummyProperty,
}) {
  return (
    !isHiddenProperty(selectedElement, entry) && (
      <div key={entry.id}>
        <RenderComponent
          entry={entry}
          selectedElement={selectedElement}
          changeColor={changeColor}
          bpmnModeler={bpmnModeler}
          readOnly={readOnly}
          setDummyProperty={setDummyProperty}
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
      className={classnames(styles.groupContainer, styles[group.className])}
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
            <Title divider={index > 0} label={group.label} />
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
