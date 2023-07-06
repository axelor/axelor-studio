import React from "react";
import {
  Grid,
  Button,
  Typography,
  CircularProgress,
  Switch,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { makeStyles } from "@material-ui/core/styles";
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

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 650,
  },
  input: {
    width: "13%",
    marginRight: 20,
  },
  metaFieldGrid: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  newRecordSwitch: {
    marginTop: 2,
  },
  newRecordSwitchText: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  newRecordInputView: {
    display: "flex",
    flexDirection: "row",
    marginTop: 5,
  },
  modelFieldSelection: {
    // width: '30%',
    marginRight: 20,
    marginLeft: 50,
  },
  addModelFieldIcon: {
    marginLeft: 15,
  },
  saveButton: {
    marginLeft: 10,
  },
  cardContent: {
    overflow: "auto",
    height: 600,
  },
  cardContentItemText: {
    lineHeight: 3,
  },
  cardActionView: {
    justifyContent: "flex-end",
  },
  capitalizeText: {
    textTransform: "capitalize",
  },
  saveButtonText: {
    marginLeft: 10,
  },
  saveMessageAlert: {
    width: "100%",
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
  },
  topView: {
    margin: "10px 10px 0px 10px",
  },
  searchField: {
    flexDirection: "row",
    width: "12%",
    "& input": {
      paddingBottom: 0,
    },
  },
  loaderView: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "999",
  },
  paper: {
    margin: theme.spacing(1),
    width: `calc(100% - 16px)`,
    display: "flex",
    height: "calc(100% - 50px)",
    overflow: "hidden",
  },
  dialogPaper: {
    maxWidth: "100%",
    maxHeight: "100%",
    resize: "both",
    width: "100%",
    height: "90%",
  },
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    height: "100%",
    overflow: "hidden",
  },
  save: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  selectContainer: {
    minWidth: 150,
  },
  targetModelInputRoot: {
    marginTop: "22px !important",
  },
}));

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
  const classes = useStyles();
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
    async (data, _builderRecord = {}) => {
      const builder = JSON.parse(params.resultMetaField || "{}");
      const jsonData = get(builder, "fields", []);
      const newFields = new Array(jsonData.length);
      excludeFields([...data]).forEach((field, index) => {
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
      onClose={(e, reason) => {
        if (reason !== "backdropClick") {
          handleClose();
        }
      }}
      aria-labelledby="simple-dialog-title"
      open={open}
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="simple-dialog-title">Script</DialogTitle>
      <div className={classes.root}>
        <Paper variant="outlined" className={classes.paper}>
          <div style={{ height: "100%", width: "100%" }}>
            <>
              <Grid container style={{ height: "100%" }}>
                <Grid container className={classes.topView}>
                  <Grid
                    container
                    justify="space-between"
                    style={{ marginBottom: 10 }}
                  >
                    <Grid item className={classes.metaFieldGrid}>
                      <Grid container>
                        <FieldPopover
                          data={builderFields}
                          onSubmit={(data) => handleAdd(data)}
                          icon={<AddIcon />}
                          buttonTitle={"Add fields"}
                          iconButton={true}
                          buttonClassName={classes.modelFieldSelection}
                          iconButtonClassName={classes.addModelFieldIcon}
                          open={manageField}
                          onClose={handleCloseManageField}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid
                    container
                    style={{ marginBottom: 10, alignItems: "flex-end" }}
                  >
                    <Selection
                      className={classes.input}
                      name="metaModal"
                      title="Target model"
                      placeholder="Target model"
                      fetchAPI={(e) => getMetaModels(e)}
                      optionLabelKey="name"
                      onChange={(e) => handleModelSelect(e)}
                      value={model}
                      inputRootClass={classes.targetModelInputRoot}
                    />
                    <MultiSelector
                      containerClassName={classes.selectContainer}
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
                    <Grid item className={classes.newRecordInputView}>
                      <Switch
                        className={classes.newRecordSwitch}
                        checked={newRecord}
                        onChange={(e) => setNewRecord(e.target.checked)}
                      />
                      <Typography className={classes.newRecordSwitchText}>
                        {translate("New record")}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
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
              </Grid>
              {loading && (
                <div className={classes.loaderView}>
                  <CircularProgress size={32} />
                </div>
              )}
            </>
          </div>
        </Paper>
        <div>
          <Button className={classes.save} onClick={handleSave}>
            OK
          </Button>
          <Button
            className={classes.save}
            onClick={onCancel}
            style={{ textTransform: "none" }}
          >
            Cancel
          </Button>
        </div>
      </div>
      {openAlert && (
        <Dialog
          open={openAlert}
          onClose={(e, reason) => {
            if (reason !== "backdropClick") {
              setAlert(false);
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {alertConfig.alertTitle}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {alertConfig.alertMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAlert(false);
                if (isClose) {
                  handleClose();
                }
              }}
              color="primary"
              autoFocus
              className={classes.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                setAlert(false);
              }}
              color="primary"
              autoFocus
              style={{ textTransform: "none" }}
              className={classes.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

export default Builder;
