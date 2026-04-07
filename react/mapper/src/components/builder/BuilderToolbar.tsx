import React from "react";
import { clsx, Box, InputLabel, Switch  } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { getModels } from "@studio/shared/services";
import type { StoreApi, UseBoundStore } from "zustand";

import { IconButton } from "@studio/shared/components";
import { Selection, MultiSelect } from "../form";
import { VALUE_FROM, translate } from "../../utils";
import type { ModelRecord } from "../../utils";
import type { MapperStore } from "../../stores/useMapperStore";
import styles from "../../builder.module.css";

type UseMapperStore = UseBoundStore<StoreApi<MapperStore>>;

interface SwitchBoxProps {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  "data-testid"?: string;
}

function SwitchBox({ label, checked, onChange, "data-testid": testId }: SwitchBoxProps) {
  return (
    <Box d="flex" alignItems="center" gap={5}>
      <Switch
        size="lg"
        fontSize={5}
        checked={checked}
        color="primary"
        onChange={onChange}
        id={label}
        data-testid={testId}
      />
      <InputLabel color="body" htmlFor={label} className={styles.switchText}>
        {translate(label)}
      </InputLabel>
    </Box>
  );
}

interface BuilderToolbarProps {
  store: UseMapperStore;
  isBPMN?: boolean;
  handleSave: () => void;
  handleSourceModelChange: (e: unknown) => void;
  handleModalForm: () => void;
  getProcesses?: () => Record<string, unknown>[];
  getProcessElement?: (processId: Record<string, unknown>) => Record<string, unknown>;
}

export default function BuilderToolbar({
  store,
  isBPMN,
  handleSave,
  handleSourceModelChange,
  handleModalForm,
  getProcesses,
  getProcessElement,
}: BuilderToolbarProps) {
  const model = store((s) => s.model);
  const setModel = store((s) => s.setModel);
  const setBuilderFields = store((s) => s.setBuilderFields);
  const sourceModelList = store((s) => s.sourceModelList);
  const setSourceModelList = store((s) => s.setSourceModelList);
  const newRecord = store((s) => s.newRecord);
  const setNewRecord = store((s) => s.setNewRecord);
  const savedRecord = store((s) => s.savedRecord);
  const setSavedRecord = store((s) => s.setSavedRecord);
  const save = store((s) => s.save);
  const setSave = store((s) => s.setSave);
  const createVariable = store((s) => s.createVariable);
  const setCreateVariable = store((s) => s.setCreateVariable);
  const modelFrom = store((s) => s.modelFrom);
  const setModelFrom = store((s) => s.setModelFrom);
  const processId = store((s) => s.processId);
  const setProcessId = store((s) => s.setProcessId);

  const handleRemoveTag = (option: ModelRecord) => {
    const optionIndex = sourceModelList?.findIndex((s) => s.name === option?.name);
    setSourceModelList((sourceModelList) => sourceModelList.splice(0, optionIndex));
  };

  return (
    <Box style={{ marginBottom: 10 }}>
      <Box d="flex" flexWrap="wrap" alignItems="center">
        {!isBPMN && (
          <IconButton
            classes={{ colorPrimary: styles.saveIcon }}
            color="primary"
            onClick={handleSave}
            className={clsx(styles.iconButtonClassName)}
            disabled={!model}
            data-testid="save-button"
          >
            <MaterialIcon icon="save" fontSize={20} />
          </IconButton>
        )}
        <Selection
          className={styles.input}
          name="metaModal"
          title="Target model"
          placeholder="Target model"
          fetchAPI={(e) => getModels(e as Record<string, unknown> | undefined)}
          optionValueKey="name"
          onChange={(model: unknown) => {
            setModel(model as ModelRecord);
            setBuilderFields([]);
          }}
          value={model}
          inputRootClass={styles.targetModelInputRoot}
          data-testid="target-model-select"
        />
        {!isBPMN && (
          <MultiSelect
            containerClassName={styles.selectContainer}
            title="Source model"
            optionValueKey="name"
            optionLabelKey="title"
            concatValue={true}
            isM2o={true}
            isContext={true}
            value={sourceModelList}
            onChange={handleSourceModelChange}
            handleRemove={(option: unknown) => handleRemoveTag(option as ModelRecord)}
            data-testid="source-model-select"
          />
        )}
        <Box d="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <SwitchBox
            label={translate("New record")}
            checked={newRecord}
            data-testid="new-record-switch"
            onChange={(e) => {
              const nr = e.target.checked;
              setNewRecord(nr);
              if (nr) {
                setSave(true);
                setSavedRecord(false);
              } else {
                if (!savedRecord) {
                  setSave(false);
                }
              }
            }}
          />
          <SwitchBox
            label={translate("Update saved record")}
            checked={savedRecord}
            onChange={(e) => {
              const sr = e.target.checked;
              setSavedRecord(sr);
              if (sr) {
                setSave(true);
                setNewRecord(false);
              } else {
                if (!newRecord) {
                  setSave(false);
                }
              }
            }}
          />
          <SwitchBox
            label={translate("Save")}
            checked={save}
            data-testid="save-switch"
            onChange={(e) => {
              const s = e.target.checked;
              if (!s && (savedRecord || newRecord)) {
                return;
              }
              setSave(s);
            }}
          />
          {isBPMN && (
            <SwitchBox
              label={translate("Create variable")}
              checked={createVariable}
              onChange={(e) => setCreateVariable(e.target.checked)}
            />
          )}
        </Box>
      </Box>
      {isBPMN && (
        <Box d="flex" w={100} style={{ marginTop: 10, alignItems: "flex-end" }}>
          <Selection
            disableClearable
            className={styles.input}
            options={[
              { title: translate("Context"), id: VALUE_FROM.CONTEXT },
              { title: translate("Process"), id: VALUE_FROM.PROCESS },
            ]}
            value={modelFrom || {}}
            title="Model from"
            onChange={(e: unknown) => {
              setProcessId(null);
              setModelFrom(e as { title: string; id: string });
              handleModalForm();
            }}
          />
          {modelFrom?.id === VALUE_FROM.CONTEXT ? (
            <MultiSelect
              containerClassName={styles.selectContainerBPMN}
              title="Source model"
              optionValueKey="name"
              optionLabelKey="title"
              concatValue={true}
              isM2o={true}
              isContext={true}
              isBPMN={true}
              value={sourceModelList}
              onChange={handleSourceModelChange}
              handleRemove={(option: unknown) => handleRemoveTag(option as ModelRecord)}
            />
          ) : (
            <Box d="flex" alignItems="center">
              <Selection
                optionValueKey="name"
                optionLabelKey="title"
                concatValue={true}
                title="Process id"
                className={styles.process}
                options={getProcesses!()}
                value={processId}
                isProcessContext={true}
                onChange={(e: unknown) => {
                  setProcessId(e as { name: string });
                  handleModalForm();
                }}
              />

              {processId && (
                <React.Fragment>
                  <MultiSelect
                    optionValueKey="name"
                    optionLabelKey="title"
                    concatValue={true}
                    isProcessContext={true}
                    value={sourceModelList}
                    element={getProcessElement!(processId)}
                    onChange={handleSourceModelChange}
                    handleRemove={(option: unknown) => handleRemoveTag(option as ModelRecord)}
                  />
                </React.Fragment>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
