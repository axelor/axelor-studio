import React from "react";
import Selection from "./components/Selection";
import DataTable from "./DataTable";
import {
  getMetaModels,
  fetchFields,
  fetchModelByName,
  fetchCustomFields,
  generateScriptString,
} from "./services/api";
import { generateJson } from "./generator";
import {
  excludeFields,
  generatePath,
  upperCaseFirstLetter,
  isCustomTarget,
  useDebounce,
} from "./utils";
import { ModelType, VALUE_FROM } from "./constant";
import { useStore } from "./store/context";
import { set, get } from "lodash";
import FieldPopover from "./components/FieldPopover";
import MultiSelector from "./components/MultiSelector";
import { translate } from "../../utils";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Switch,
} from "@axelor/ui";

const getDefaultFrom = (sourceModel) => {
  return sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE;
};

const getSourceModelString = (list) => {
  let string = "";
  list.forEach((item) => {
    if (string === "") {
      string = item.name;
    } else {
      string = `${string}.${item.name}`;
    }
  });
  return string;
};

const getFieldValue = (value) => {
  return value;
};

const getCustomTarget = (item) => {
  if (item.targetJsonModel) {
    return item.targetJsonModel.id;
  }
  return item.targetModel;
};

const getModelSubField = (fields) => {
  if (fields) {
    const newFields = fields.filter((f) => Object.keys(f).length > 0);
    return newFields;
  }
  return fields;
};

const getFieldInfo = (item) => {
  if (item.target && !isCustomTarget(item.target)) {
    return { ...item, fullName: item.target };
  } else {
    if (item.targetModel) {
      // refers to base model
      return { ...item, fullName: item.targetModel };
    }
    return { ...item, modelType: ModelType.CUSTOM, name: item.jsonTarget };
  }
};

const getContextValue = (value, from) => {
  let contextValue = {};
  let newValue = value;
  if (value && value?.selected && value?.selected?.value) {
    const splitedValue = `${value.selected.value}`.split(".");
    // const modelSubField = getModelFields(splitedValue);
    if (from === VALUE_FROM.CONTEXT) {
      const contextModel = { name: upperCaseFirstLetter(splitedValue[0]) };
      return { contextModel };
    }
    if (from === VALUE_FROM.SELF) {
      newValue.selected = { ...newValue.selected, value: splitedValue[0] };
      return { value: newValue };
    }
  }
  return contextValue;
};

const findFields = (item, jsonData = []) => {
  let field = jsonData.find((f) => f.name === item.name);
  if (!field) {
    for (let i = 0; i < jsonData.length; i++) {
      const jsonField = jsonData[i];
      const fields = get(jsonField, "value.fields");
      if (fields) {
        field = findFields(item, fields);
        if (field) {
          break;
        }
      }
    }
  }
  return field;
};

const getNewBuilderFields = (fields, searchText) => {
  return fields.map((field) => {
    let newField = { ...field };
    let hasChildrenShow = false;
    if (newField.value && newField.value.fields) {
      const newFieldlist = getNewBuilderFields(
        newField.value.fields,
        searchText
      );
      hasChildrenShow =
        newFieldlist.findIndex((f) => f.isHidden === false) !== -1;
      newField = {
        ...newField,
        value: {
          ...newField.value,
          fields: newFieldlist,
        },
      };
    }
    if (
      !field.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !hasChildrenShow
    ) {
      newField.isHidden = true;
    } else {
      newField.isHidden = false;
    }
    return newField;
  });
};

const clearChildrenParentValue = ({
  fields = [],
  from = VALUE_FROM.PARENT,
  shouldChangeFrom = true,
}) => {
  return fields.map((field) => {
    let newField = { ...field };
    const newFieldFrom = get(newField, "value.from");
    if (newFieldFrom === from) {
      if (shouldChangeFrom) {
        newField.value.from = VALUE_FROM.NONE;
      }
      if (newField.value && newField.value.selected) {
        newField = Object.assign(
          {},
          {
            ...newField,
            value: {
              ...newField.value,
              selected: {
                ...newField.value.selected,
                value: null,
              },
            },
          }
        );
      }
      newField.modelSubField = [];
    }
    if (newField.value && newField.value.fields) {
      const fields = [
        ...clearChildrenParentValue({
          fields: newField.value.fields,
          from,
          shouldChangeFrom,
        }),
      ];
      newField = Object.assign(
        {},
        {
          ...newField,
          value: {
            ...newField.value,
            fields,
          },
        }
      );
    }
    return newField;
  });
};

function Builder({ params, onSave, handleClose, open, bpmnModeler }) {
  const { state, update } = useStore();
  const { builderFields } = state;
  const [model, setModel] = React.useState();
  const [sourceModel, setSourceModel] = React.useState();
  const [sourceModelList, setSourceModelList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [newRecord, setNewRecord] = React.useState(false);
  const [modelFieldMap, setModelFieldMap] = React.useState({});
  const [metaFields, setMetaFields] = React.useState([]);
  const [errors, setErrors] = React.useState({});
  const [manageField, setManageField] = React.useState(false);
  const [openAlert, setAlert] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState({
    alertMessage: "Add all values",
    alertTitle: "Error",
  });
  const [isClose, setClose] = React.useState(false);

  const setBuilderFields = React.useCallback(
    (fields) => {
      update((draft) => {
        set(draft, "builderFields", fields);
      });
    },
    [update]
  );

  const handleRowChange = React.useCallback(
    (row, rowIndex, key, value) => {
      update((draft) => {
        const recordIndex = draft.builderFields.findIndex(
          (f) => f.name === row.name
        );
        const record = draft.builderFields[recordIndex];

        if (
          key === "value.from" &&
          [VALUE_FROM.CONTEXT, VALUE_FROM.SELF].includes(
            get(record, "value.from")
          )
        ) {
          const prevFields = get(record, "value.fields", []);
          if (prevFields.length) {
            const fields = clearChildrenParentValue({ fields: prevFields });
            set(draft.builderFields, `[${recordIndex}].value.fields`, fields);
          }
        }
        if (
          key === "value.selected" &&
          [VALUE_FROM.CONTEXT, VALUE_FROM.SELF].includes(
            get(record, "value.from")
          )
        ) {
          const prevFields = get(record, "value.fields", []);
          if (prevFields.length) {
            const fields = clearChildrenParentValue({
              fields: prevFields,
              shouldChangeFrom: false,
            });
            set(draft.builderFields, `[${recordIndex}].value.fields`, fields);
          }
        }
        set(draft.builderFields, `[${recordIndex}].${key}`, value);
      });
    },
    [update]
  );
  const handleRowRemove = React.useCallback(
    (row) => {
      update((draft) => {
        const index = draft.builderFields.findIndex((f) => f.name === row.name);
        if (index !== -1) {
          draft.builderFields[index].isRemoved = true;
        }
      });
    },
    [update]
  );

  const handleSubFieldAdd = React.useCallback(
    async (item, expand) => {
      // const oldFields = [...draft.builderFields];
      if (expand) {
        const target = item.target || getCustomTarget(item);
        let fields = modelFieldMap[target];
        const builder = JSON.parse(params.resultMetaField || "{}");
        const builderJSONFields = get(builder, "fields", []);
        if (!modelFieldMap[target]) {
          if (model.modelType === ModelType.CUSTOM) {
            fields = await fetchCustomFields({ ...item });
          } else {
            fields = await fetchFields(getFieldInfo(item));
          }
          setModelFieldMap({ [target]: fields });
          const dataPath = `${item.dataPath}.value.fields`;
          const newFields = [];

          const builderField = findFields(item, builderJSONFields);
          const jsonFieldList = get(builderField, "value.fields", []);

          excludeFields(fields).forEach((field, i) => {
            const jsonField =
              jsonFieldList.find((f) => f.name === field.name) || {};
            const value = getFieldValue(jsonField.value);
            const from = get(jsonField, "value.from");

            const contextValue = getContextValue(value, from);

            newFields.push({
              ...field,
              dataPath: `${dataPath}[${i}]`,
              from,
              value,
              hideFields: true,
              isRemoved: true,
              modelSubField: jsonField.modelSubField,
              ...contextValue,
            });
          });
          update((draft) => {
            set(
              draft.builderFields,
              `${item.dataPath}.value.fields`,
              newFields
            );
            set(draft.builderFields, `${item.dataPath}.hideFields`, false);
          });
          // const newFields = updateBuilderFields(oldFields, item, excludeFields(fields));
          // setBuilderFields([...newFields]);
        } else {
          const newFields = [];
          const dataPath = `${item.dataPath}.value.fields`;
          const builderField = findFields(item, builderJSONFields);
          const jsonFieldList = get(builderField, "value.fields", []);
          excludeFields(fields).forEach((field, i) => {
            const jsonField =
              jsonFieldList.find((f) => f.name === field.name) || {};
            const value = getFieldValue(jsonField.value);
            const from = get(jsonField, "value.from");
            const contextValue = getContextValue(value, from);
            newFields.push({
              ...field,
              dataPath: `${dataPath}[${i}]`,
              from,
              value,
              hideFields: true,
              isRemoved: false,
              modelSubField: jsonField.modelSubField,
              ...contextValue,
            });
          });
          update((draft) => {
            set(
              draft.builderFields,
              `${item.dataPath}.value.fields`,
              newFields
            );
            set(draft.builderFields, `${item.dataPath}.hideFields`, false);
          });
          // const newFields = showHideBuilderFields(oldFields, item, false);
          // setBuilderFields([...newFields]);
        }
      } else {
        update((draft) => {
          set(draft.builderFields, `${item.dataPath}.hideFields`, true);
        });
        // hide fields from builder field
        // const newFields = showHideBuilderFields(oldFields, item, true);
        // setBuilderFields([...newFields]);
      }
    },
    [model, modelFieldMap, update, params]
  );

  const handleAdd = React.useCallback(
    (rows) => {
      update((draft) => {
        rows.forEach((row) => {
          set(draft.builderFields, `${row.dataPath}.isRemoved`, false);
        });
      });
    },
    [update]
  );

  const getBuilderFields = React.useCallback(
    async (data) => {
      const builder = JSON.parse(params.resultMetaField || "{}");
      const jsonData = get(builder, "fields", []);
      const newFields = new Array(jsonData.length);
      excludeFields([...data]).forEach((field) => {
        const jsonFieldIndex = jsonData.findIndex((f) => f.name === field.name);
        const jsonField = jsonData[jsonFieldIndex] || {};

        const value = getFieldValue(jsonField.value);
        const from = get(jsonField, "value.from");
        // get(jsonData, `${field.name}.from`);
        const contextValue = getContextValue(value, from);

        const obj = {
          ...field,
          path: generatePath(field),
          from,
          value,
          hideFields: true,
          isRemoved: value ? false : true,
          modelSubField: getModelSubField(jsonField.modelSubField),
          selfField: jsonField.selfField,
          sourceField: jsonField.sourceField,
          processId: jsonField.processId ? { name: jsonField.processId } : null,
          ...contextValue,
        };
        if (jsonFieldIndex !== -1) {
          obj.dataPath = `[${jsonFieldIndex}]`;
          newFields.splice(jsonFieldIndex, 1, { ...obj });
        } else {
          obj.dataPath = `[${newFields.length}]`;
          newFields.push({ ...obj });
        }
      });
      // const builder = JSON.parse(_builderRecord[params.resultMetaField] || '{}');
      // const newFields = getAssignmentFields(jsonData, fields);
      update((draft) => {
        set(
          draft,
          "builderFields",
          newFields.filter((e) => e)
        );
      });
      // setBuilderFields(newFields);
    },
    [params, update]
  );

  const getMetaFields = React.useCallback(
    async (model, _builderRecord) => {
      if (model) {
        const data = await fetchFields(model);
        setMetaFields([...data]);
        setErrors({});
        getBuilderFields(data, _builderRecord);
      }
    },
    [getBuilderFields]
  );

  const handleClearError = React.useCallback((path) => {
    setErrors((err) => {
      return JSON.parse(JSON.stringify(set(err, path, undefined)));
    });
  }, []);

  const getJSON = React.useCallback(() => {
    const currentJson = JSON.parse(params.resultMetaField || "{}");
    const jsonFields = generateJson(
      builderFields,
      currentJson,
      getDefaultFrom(sourceModel),
      sourceModel
    );
    const sourceModelString = getSourceModelString(sourceModelList);
    const json = {
      fields: jsonFields,
      targetModel: model && model.name,
      sourceModel:
        !sourceModelString || sourceModelString === ""
          ? undefined
          : sourceModelString,
      sourceModelList,
      newRecord,
      isJson: (model && model.modelType) === ModelType.CUSTOM,
    };
    return json;
  }, [builderFields, model, newRecord, sourceModel, sourceModelList, params]);

  const handleSave = React.useCallback(async () => {
    setErrors({});
    const json = getJSON();
    const jsonQuery = JSON.stringify({ ...json });
    if (!model) {
      onSave(undefined);
      return;
    }
    let _model = params.model;
    if (!_model) {
      if (model.modelType === "CUSTOM") {
        _model = "com.axelor.meta.db.MetaJsonRecord";
      } else {
        _model = model.fullName;
      }
    }
    const scriptString = await generateScriptString(jsonQuery, _model);
    const record = {
      resultMetaField: jsonQuery,
      resultField: scriptString,
      targetField: json.targetModel,
      sourceField: json.sourceModel,
    };
    onSave(record);
  }, [params, model, onSave, getJSON]);

  const onCancel = () => {
    const jsonData = JSON.parse(params.resultMetaField || "{}");
    const currentJson = getJSON();
    if (
      !(currentJson && currentJson.targetModel) ||
      JSON.stringify(jsonData) === JSON.stringify(currentJson)
    ) {
      handleClose();
      return;
    }
    setClose(true);
    setAlert(true);
    setAlertConfig({
      alertMessage:
        "Current changes will be lost. Do you really want to proceed?",
      alertTitle: "Question",
    });
  };

  const handleModelSelect = React.useCallback(
    async (e) => {
      setModel(e);
      getMetaFields(e);
    },
    [getMetaFields]
  );

  const searchField = React.useCallback(
    (searchText) => {
      const fields = getNewBuilderFields(builderFields, searchText);
      setBuilderFields([...fields]);
    },
    [builderFields, setBuilderFields]
  );

  const delayFetch = useDebounce(searchField, 400);

  const handleFieldSearch = React.useCallback(
    (e) => {
      const searchText = e.target.value;
      delayFetch(searchText);
    },
    [delayFetch]
  );

  const handleManageFieldClick = React.useCallback(() => {
    setManageField(true);
  }, []);

  const handleCloseManageField = React.useCallback(() => {
    setManageField(false);
  }, []);

  const handleReorder = React.useCallback(
    (dragIndex, hoverIndex) => {
      update((draft) => {
        const item = draft.builderFields[dragIndex];
        draft.builderFields.splice(dragIndex, 1);
        draft.builderFields.splice(hoverIndex, 0, item);
      });
    },
    [update]
  );

  React.useEffect(() => {
    async function init() {
      if (!params) return;
      const jsonData = JSON.parse(params.resultMetaField || "{}");
      if (jsonData && params.resultMetaField) {
        setLoading(true);
        const modelResult = await fetchModelByName(jsonData.targetModel);
        const lastSourceModel = jsonData.sourceModelList
          ? jsonData.sourceModelList[jsonData.sourceModelList.length - 1] || {}
          : {};
        const sourceModelName = lastSourceModel.target
          ? lastSourceModel.target.split(".").pop()
          : lastSourceModel.name;
        const sourceModelResult = await fetchModelByName(sourceModelName);
        setSourceModelList([...(jsonData.sourceModelList || [])]);
        setModel(modelResult);
        setSourceModel(sourceModelResult);
        setNewRecord(jsonData.newRecord);
        getMetaFields(modelResult);
        setLoading(false);
      }
    }
    init();
  }, [params, getMetaFields]);

  return (
    <Dialog
      backdrop
      size="xl"
      aria-labelledby="simple-dialog-title"
      open={open}
    >
      <DialogHeader onCloseClick={handleClose}>
        <DialogTitle id="simple-dialog-title">Script</DialogTitle>
      </DialogHeader>
      <DialogContent style={{ maxHeight: "82vh" }} overflow="auto">
        <Box border rounded style={{ height: "100%", width: "100%" }}>
          <Box m={2}>
            <Box>
              <Box>
                <Box d="flex" justifyContent="space-between" flex={1} mb={3}>
                  <FieldPopover
                    data={builderFields}
                    onSubmit={(data) => handleAdd(data)}
                    open={manageField}
                    onClose={handleCloseManageField}
                  />
                </Box>
                <Box mb={4} m={1} d="flex" flexWrap="wrap" gap={10}>
                  <Selection
                    name="metaModal"
                    title="Target model"
                    placeholder="Target model"
                    fetchAPI={(e) => getMetaModels(e)}
                    optionLabelKey="name"
                    onChange={(e) => handleModelSelect(e)}
                    value={model}
                  />
                  <MultiSelector
                    title="Source model"
                    optionValueKey="name"
                    optionLabelKey="name"
                    concatValue={true}
                    isM2o={true}
                    isContext={true}
                    value={sourceModelList}
                    onChange={(e) => {
                      const list = e.map((item) => {
                        if (!item.fullName && item.target) {
                          return { ...item, fullName: item.target };
                        }
                        return item;
                      });
                      setSourceModelList([...list]);
                      setSourceModel({ ...list[list.length - 1] });
                    }}
                  />
                  <Box d="flex" mt={1} justifyContent="center">
                    <Switch
                      checked={newRecord}
                      onChange={(e) => setNewRecord(e.target.checked)}
                    />
                    <Box>{translate("New record")}</Box>
                  </Box>
                </Box>
              </Box>
              <DataTable
                builderFields={builderFields}
                data={builderFields}
                onRowChange={handleRowChange}
                onRemove={handleRowRemove}
                metaFields={metaFields}
                errors={errors}
                onClearError={handleClearError}
                onSubFieldAdd={handleSubFieldAdd}
                handleAdd={handleAdd}
                sourceModel={sourceModel}
                targetModel={model}
                bpmnModeler={bpmnModeler}
                manageFieldClick={handleManageFieldClick}
                handleFieldSearch={handleFieldSearch}
                onReorder={handleReorder}
              />
            </Box>
            {loading && (
              <Box
                pos="absolute"
                h={100}
                d="flex"
                flex-direction="column"
                justifyContent="center"
                alignItems="center"
                style={{
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                }}
              >
                <CircularProgress color="body" size={32} indeterminate />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button variant="primary" size="sm" onClick={handleSave}>
          {translate("OK")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          style={{ textTransform: "none" }}
        >
          {translate("Cancel")}
        </Button>
      </DialogFooter>
      {openAlert && (
        <Dialog
          backdrop
          open={openAlert}
          onClose={() => setAlert(false)}
          size="md"
        >
          <DialogHeader>
            <DialogTitle id="alert-dialog-title">
              {alertConfig.alertTitle}
            </DialogTitle>
          </DialogHeader>
          <DialogContent>
            <Box id="alert-dialog-description">{alertConfig.alertMessage}</Box>
          </DialogContent>
          <DialogFooter>
            <Button
              onClick={() => {
                setAlert(false);
                if (isClose) {
                  handleClose();
                }
              }}
              variant="primary"
              autoFocus
              size="sm"
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setAlert(false);
              }}
              variant="secondary"
              autoFocus
              size="sm"
              style={{ textTransform: "none" }}
            >
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </Dialog>
  );
}

export default Builder;
