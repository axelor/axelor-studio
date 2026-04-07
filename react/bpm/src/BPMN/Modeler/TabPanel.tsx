
import React from "react";
import classnames from "classnames";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import type { TypedBpmnModeler } from "@studio/shared/types";
import type { SnackbarState } from "@studio/shared/stores";

import RenderComponent from "./RenderWidget";
import { isHiddenProperty } from "./extra";
import styles from "./tabpanel.module.css";
import { Title } from "@studio/shared/components";
import type { WkfModel } from "./stores/useWkfStore";

const getProcessId = (element: unknown): string | undefined => {
  const bo = getBusinessObject(element);
  if (!bo) return undefined;
  const processRef = bo.get("processRef") as Record<string, unknown> | undefined;
  return (processRef?.id as string | undefined) || bo.id;
};

interface EntryProps {
  entry: Record<string, unknown>;
  selectedElement: unknown;
  changeColor: (color: string) => void;
  bpmnModeler: TypedBpmnModeler | null;
  readOnly: boolean;
}

function Entry({ entry, selectedElement, changeColor, bpmnModeler, readOnly }: EntryProps) {
  return (
    !isHiddenProperty(selectedElement, entry) && (
      <div key={entry.id as string}>
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

interface TabPanelProps {
  group: Record<string, unknown>;
  index: number;
  selectedElement: unknown;
  id: number | string | null;
  handleAdd: (row: unknown) => void;
  wkf: WkfModel | null;
  reloadView: () => void;
  onSave: () => Promise<void>;
  openSnackbar: SnackbarState;
  handleMenuActionTab: (val: boolean) => void;
  updateCommentsCount: (isIncrement?: boolean) => void;
  handleSnackbarClick: (messageType: string, message: string) => void;
  enableStudioApp: boolean;
  addNewVersion: (wkfParam?: WkfModel) => Promise<WkfModel | undefined>;
  changeColor: (color: string) => void;
  bpmnModeler: TypedBpmnModeler | null;
  showError: boolean;
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
}: TabPanelProps) {
  const getReadOnly = React.useCallback(
    (entry: Record<string, unknown>) => {
      const proceedId = getProcessId(selectedElement);
      const oldNodes = JSON.parse(wkf?.oldNodes || "{}");
      return (
        (oldNodes || {}).hasOwnProperty(proceedId) && wkf?.statusSelect !== 1 && entry?.isProcess
      );
    },
    [selectedElement, wkf],
  );

  const GroupComponent = group.component as
    | React.ComponentType<Record<string, unknown>>
    | undefined;
  const entries = (group.entries || []) as Array<Record<string, unknown>>;

  return (
    <div
      key={group.id as string}
      data-group={group.id as string}
      className={classnames(styles.groupContainer, styles[(group.className as string) || ""])}
    >
      {GroupComponent ? (
        <GroupComponent
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
        entries.length > 0 && (
          <React.Fragment>
            <Title divider={index > 0} label={group.label as string} />
            <div>
              {entries.map((entry: Record<string, unknown>, i: number) => (
                <Entry
                  entry={entry}
                  key={i}
                  selectedElement={selectedElement}
                  changeColor={changeColor}
                  bpmnModeler={bpmnModeler}
                  readOnly={!!getReadOnly(entry)}
                />
              ))}
            </div>
          </React.Fragment>
        )
      )}
    </div>
  );
}
