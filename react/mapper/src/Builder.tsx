import React from "react";
import update from "immutability-helper";
import { fetchFields, fetchModelByName } from "@studio/shared/services";
import { Box } from "@axelor/ui";
import type { StoreApi, UseBoundStore } from "zustand";

import DataTable from "./DataTable";
import { createMapperStore } from "./stores/useMapperStore";
import type { MapperStore } from "./stores/useMapperStore";
import BuilderToolbar from "./components/builder/BuilderToolbar";
import { useSaveHandler } from "./components/builder/BuilderSaveHandler";
import { fetchRecord } from "./services/mapper-service";
import { VALUE_FROM, translate } from "./utils";
import type { BuilderField, MetaField, ModelRecord } from "./utils";
import { getBuilderField, getJSON } from "./Builder.utils";
import { Loader } from "@studio/shared/components";
import DialogBox from "./components/Dialog";
import styles from "./builder.module.css";


declare global {
  interface Window {
    __mapper_isDirty?: () => boolean;
  }
}

type UseMapperStore = UseBoundStore<StoreApi<MapperStore>>;

const alertUser = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = translate("Are you sure you want to close the tab?");
};

interface BuilderProps {
  params: Record<string, unknown> | null;
  isBPMN?: boolean;
  open?: boolean;
  handleClose?: () => void;
  isDialog?: boolean;
  onSave?: (data: Record<string, unknown>) => void;
  getProcesses?: () => Record<string, unknown>[];
  getProcessElement?: (processId: Record<string, unknown>) => Record<string, unknown>;
  isDMNAllow?: () => boolean;
  getDMNValues?: () => Promise<Record<string, unknown>[]>;
}

function Builder({
  params,
  isBPMN,
  open,
  handleClose,
  isDialog,
  onSave,
  getProcesses,
  getProcessElement,
  isDMNAllow,
  getDMNValues,
}: BuilderProps) {
  const store: UseMapperStore = React.useMemo(() => createMapperStore(), []);

  const loading = store((s) => s.loading);
  const model = store((s) => s.model);
  const metaFields = store((s) => s.metaFields);
  const builderFields = store((s) => s.builderFields);
  const sourceModel = store((s) => s.sourceModel);
  const newRecord = store((s) => s.newRecord);
  const setBuilderFields = store((s) => s.setBuilderFields);
  const setSourceModel = store((s) => s.setSourceModel);
  const setSourceModelList = store((s) => s.setSourceModelList);
  const setMetaFields = store((s) => s.setMetaFields);

  const { handleSave, getJSONQuery } = useSaveHandler(store, { params, onSave });

  // add rows
  const handleAdd = React.useCallback(
    (fields: MetaField[] = []) => {
      setBuilderFields((list) => [
        ...list,
        ...fields.map((field) => getBuilderField(field, sourceModel)),
      ]);
    },
    [setBuilderFields, sourceModel],
  );

  // remove row
  const handleRemove = React.useCallback(
    (_row: BuilderField, index: number) => {
      setBuilderFields((fields) => {
        fields.splice(index, 1);
      });
    },
    [setBuilderFields],
  );

  // update editor values
  const handleChange = React.useCallback(
    (_e: unknown, key: string, value: unknown, rowIndex: number) => {
      setBuilderFields((fields) => {
        if (!fields?.length) return;
        function set(key: string, value: unknown) {
          ["condition", "conditionMeta", "dmn", "processId", "searchField"].includes(key)
            ? ((fields[rowIndex] as Record<string, unknown>)[key] = value)
            : ((fields[rowIndex].value as Record<string, unknown>)[key] = value);
        }
        set(key, value);
        if (key === "from") {
          set("subFields", []);
          set("selected", null);
          set("query", null);
          set("searchField", null);
          set("dmn", null);
          set("processId", null);
        }
        if (["dmn", "processId"].includes(key)) {
          set("selected", null);
          set("subFields", []);
          set("searchField", null);
        }
      });
    },
    [setBuilderFields],
  );

  const handleReorder = React.useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setBuilderFields((items) => {
        const dragItem = items[dragIndex];
        return update(items, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragItem],
          ],
        });
      });
    },
    [setBuilderFields],
  );

  const handleSourceModelChange = (e: unknown) => {
    const list = ((e || []) as ModelRecord[]).map((item) =>
      !item.fullName && item.target ? { ...item, fullName: item.target } : item,
    );
    const sm = list[list.length - 1];
    setSourceModelList([...list]);
    setSourceModel(sm || null);
    setBuilderFields((fields) => {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const { from, selected, subFields } = field?.value || {};
        if (!sm && from === VALUE_FROM.SOURCE) {
          field.value.from = VALUE_FROM.NONE;
        }
        if (from === VALUE_FROM.SOURCE) {
          field.value.subFields = [];
          field.value.selected = null;
        }
        if (
          sm &&
          ((([VALUE_FROM.NONE, VALUE_FROM.EXPRESSION, VALUE_FROM.QUERY] as string[]).includes(
            from as string,
          ) &&
            !(selected as Record<string, unknown> | null)?.value) ||
            (([VALUE_FROM.CONTEXT, VALUE_FROM.SELF] as string[]).includes(from as string) &&
              (subFields || []).length === 0))
        ) {
          field.value.from = VALUE_FROM.SOURCE;
        }
      }
    });
  };

  const handleModalForm = () => {
    setSourceModelList([]);
    setSourceModel(null);
    setBuilderFields((fields) => {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (field?.value?.from === VALUE_FROM.SOURCE) {
          field.value.from = VALUE_FROM.NONE;
          field.value.selected = null;
          field.value.subFields = [];
        }
      }
    });
  };

  // fetch fields on model change
  React.useEffect(() => {
    if (model) {
      (async () => {
        const data = await fetchFields(model);
        setMetaFields(data);
      })();
    }
  }, [model, setMetaFields]);

  // initial data load
  React.useEffect(() => {
    (async () => {
      if (!params) return;
      const s = store.getState();
      try {
        s.setLoading(true);
        const result = isBPMN
          ? true
          : await fetchRecord(params.model as string, params.id as string);
        if (!result) {
          console.error("[Builder] Record is not available");
          return;
        }
        !isBPMN && typeof result === "object" && s.setBuilderRecord(result);
        const jsonData = isBPMN
          ? getJSON(params, "resultMetaField")
          : getJSON(result as Record<string, unknown>, params.resultMetaField as string);
        if (!jsonData) return;
        const {
          fields = [],
          newRecord = false,
          savedRecord = false,
          createVariable = false,
          save = true,
          targetModel,
          processId,
          modelFrom,
          sourceModelList = [],
        } = jsonData;
        const sourceList = sourceModelList as ModelRecord[];
        const lastSM =
          sourceList.length > 0 ? sourceList[sourceList.length - 1] || {} : ({} as ModelRecord);
        const sourceModelName = lastSM.target ? lastSM.target.split(".").pop() : lastSM.name;
        const modelResult = await fetchModelByName(targetModel as string);
        const sourceModelResult = await fetchModelByName(sourceModelName as string);
        const mFields = await fetchFields(modelResult ?? null);
        s.setSourceModelList([...sourceList]);
        s.setModel(modelResult ?? null);
        s.setSourceModel(sourceModelResult ?? null);
        s.setNewRecord(newRecord as boolean);
        s.setSavedRecord(savedRecord as boolean);
        s.setSave(save as boolean);
        s.setCreateVariable(createVariable as boolean);
        s.setProcessId(processId ? { name: processId as string } : null);
        s.setModelFrom(
          (modelFrom as { title: string; id: string }) || {
            title: translate("Context"),
            id: VALUE_FROM.CONTEXT,
          },
        );
        s.setBuilderFields(
          (fields as BuilderField[]).map((field) => {
            const metaField = mFields.find((f: MetaField) => f.name === field.name);
            const r: BuilderField = {
              ...getBuilderField(field),
              ...field,
              ...metaField,
            } as BuilderField;
            if (field?.processId)
              r["processId"] = {
                name:
                  typeof field.processId === "string"
                    ? field.processId
                    : (field.processId as { name: string }).name,
              };
            return r;
          }),
        );
      } finally {
        s.setLoading(false);
      }
    })();
  }, [params, store, isBPMN]);

  // beforeunload listener (browser-level dirty protection)
  React.useEffect(() => {
    window.top && window.top.addEventListener("beforeunload", alertUser);
    return () => {
      window.top && window.top.removeEventListener("beforeunload", alertUser);
    };
  });

  // iframe-safe dirty-state bridge
  React.useEffect(() => {
    window.__mapper_isDirty = () => {
      const { builderRecord } = store.getState();
      return getJSONQuery() !== builderRecord.scriptMeta;
    };
    return () => {
      delete window.__mapper_isDirty;
    };
  }, [store, getJSONQuery]);

  function UI() {
    return (
      <Box w={100} h={100} overflow="hidden">
        <Box className={styles.topView}>
          <BuilderToolbar
            store={store}
            isBPMN={isBPMN}
            handleSave={handleSave}
            handleSourceModelChange={handleSourceModelChange}
            handleModalForm={handleModalForm}
            getProcesses={getProcesses}
            getProcessElement={getProcessElement}
          />
        </Box>
        <DataTable
          data={builderFields}
          metaFields={metaFields}
          sourceModel={sourceModel}
          targetModel={model}
          newRecord={newRecord}
          onRowAdd={handleAdd}
          onRowChange={handleChange}
          onRemove={handleRemove}
          onReorder={handleReorder}
          isBPMN={isBPMN}
          getProcesses={getProcesses}
          getProcessElement={getProcessElement}
          isDMNAllow={isDMNAllow}
          getDMNValues={getDMNValues}
        />
      </Box>
    );
  }

  return (
    <>
      {isDialog ? (
        <DialogBox
          fullscreen={true}
          open={open}
          title="Script"
          handleSave={handleSave}
          handleClose={handleClose}
          className={styles.dialogPaper}
        >
          {UI()}
        </DialogBox>
      ) : (
        UI()
      )}
      {loading && <Loader />}
    </>
  );
}

export default Builder;
