import React from "react";
import { Box, CommandBar } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

import Select from "../../../components/Select";
import { Collaboration } from "../../../components/Collaboration";
import styles from "../bpmn-modeler.module.css";
import type { WkfModel } from "../stores/useWkfStore";

interface BpmnTopToolbarProps {
  leftToolbar: unknown[];
  rightToolbar: unknown[];
  wkf: WkfModel | null;
  setWkf: (val: WkfModel | null) => void;
  updateWkfModel: (value: WkfModel, oldValue?: WkfModel) => void;
  getModels: (criteria: unknown) => Promise<unknown>;
  uploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BpmnTopToolbar({
  leftToolbar,
  rightToolbar,
  wkf,
  setWkf,
  updateWkfModel,
  getModels,
  uploadFile,
}: BpmnTopToolbarProps) {
  return (
    <Box
      d="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      rounded
      border
      gap="4"
      style={{
        padding: "6px 20px 8px 20px",
        backgroundColor: "var(--bs-tertiary-bg)",
      }}
    >
      <CommandBar
        items={leftToolbar as Parameters<typeof CommandBar>[0]["items"]}
        className={styles.commandBar}
      />
      <Box flex="1">
        <Select
          className={styles.select}
          disableClearable={true}
          update={(value: WkfModel, label: string, oldValue: WkfModel) => {
            setWkf("" as unknown as WkfModel); // safety: empty string resets WkfModel state to initial
            updateWkfModel(value, oldValue);
          }}
          name="wkf"
          value={wkf}
          optionLabel="name"
          optionLabelSecondary="description"
          isLabel={false}
          fetchMethod={(criteria: unknown) => getModels(criteria)}
          disableUnderline={false}
          isOptionEllipsis={true}
          placeholder={translate("BPM model")}
        />
      </Box>
      <Collaboration />
      <CommandBar
        items={rightToolbar as Parameters<typeof CommandBar>[0]["items"]}
        className={styles.commandBar}
      />
      <input
        id="inputFile"
        type="file"
        name="file"
        onChange={uploadFile}
        style={{ display: "none" }}
      />
    </Box>
  );
}

export default BpmnTopToolbar;
