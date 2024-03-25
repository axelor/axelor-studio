import React, { useEffect, useMemo, useState } from "react";
import { EXPRESSION_LANGUAGE_OPTIONS, TYPES } from "../constants";
import { getMetaFields } from "../../services/api";
import {
  TextField,
  SelectBox,
  FieldEditor,
  DatePicker,
} from "../../components/properties/components";
import { translate, lowerCaseFirstLetter, getLowerCase } from "../../utils";
import { RELATIONAL_TYPES, ALL_TYPES } from "../constants";
import { getNameField } from "../services/api";
import { Selection } from "../../components/expression-builder/components";
import AlertDialog from "../../components/AlertDialog";
import Tooltip from "../../components/Tooltip";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import styles from "./InputHeadProperties.module.css";

export default function InputHeadProperties({
  element,
  input: propInput,
  dmnModeler,
  getData,
}) {
  const [input, setInput] = useState(null);
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(false);
  const [metaField, setMetaField] = useState(null);
  const [contextModel, setContextModel] = useState(null);
  const [relationalField, setRelationalField] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [openAlert, setOpenAlert] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [expressionLanguage, setExpressionLanguage] = useState("feel");
  const [type, setType] = useState("string");
  const [defaultValue, setDefaultValue] = useState(null);

  const models = useMemo(() => getData && getData(), [getData]);

  const handleClickOpen = () => {
    setOpen(true);

    //refill values

    if (models?.length === 1) setContextModel(models[0]);

    const { inputExpression } = input || {};
    const { text, $attrs } = inputExpression || {};

    const allFields = $attrs && $attrs["camunda:allFields"];
    const metaField = $attrs && $attrs["camunda:textMetaField"];
    const relationalField = $attrs && $attrs["camunda:relationalField"];

    setAllFields(allFields ? JSON.parse(allFields) : []);
    setMetaField(metaField ? JSON.parse(metaField) : undefined);
    setRelationalField(
      relationalField ? JSON.parse(relationalField) : undefined
    );

    if (!allFields) return;

    const textValues = text?.replace("?.atStartOfDay()", "")?.split(".");
    const modelName = textValues && textValues[0];
    const value =
      textValues && textValues.length > 0
        ? textValues.slice(1).join(".")
        : text;
    setField(value);

    if (models?.length > 1) {
      const model = models?.find(
        (m) => getLowerCase(m.name) === getLowerCase(modelName)
      );
      setContextModel(model);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const setProperty = React.useCallback(
    (context, field) => {
      const activeEditor = dmnModeler.getActiveViewer();
      const modeling = activeEditor.get("modeling");
      modeling.updateProperties(field, context);
      modeling._eventBus.fire("root.added");
    },
    [dmnModeler]
  );

  const handleOk = async () => {
    if (!input?.inputExpression) return;
    const model = lowerCaseFirstLetter(contextModel?.name);
    const type = metaField?.type?.toLowerCase();
    let text = field && model && field !== "" ? `${model}.${field}` : "";
    const dateExpr = text?.replace("?.atStartOfDay()", "");
    text = text && type === "date" ? `${dateExpr}?.atStartOfDay()` : text;
    let typeRef = "string";
    setReadOnly(allFields?.length ? true : false);
    if (ALL_TYPES.includes(type)) {
      typeRef = type;
    } else if (RELATIONAL_TYPES.includes(type)) {
      const { targetName, model, jsonTarget } = metaField || {};
      let nameColumn = targetName;
      if (model === "com.axelor.meta.db.MetaJsonRecord" && jsonTarget) {
        let fieldData = await getNameField(jsonTarget);
        nameColumn = fieldData && fieldData.name ? fieldData.name : targetName;
      }
      text =
        nameColumn && !text?.includes(nameColumn)
          ? `${text}.${nameColumn}`
          : text;
    } else if (type === "time") {
      typeRef = "long";
    } else if (type === "decimal") {
      typeRef = "double";
    }
    const expressionLanguage = text && text !== "" ? "groovy" : "feel";
    let context = {
      text,
      expressionLanguage,
      "camunda:textMetaField": JSON.stringify(metaField || undefined),
      "camunda:allFields": JSON.stringify(allFields || undefined),
      "camunda:relationalField":
        metaField?.type !== "BOOLEAN"
          ? JSON.stringify(relationalField || undefined)
          : undefined,
      typeRef,
    };
    setType(typeRef);
    setProperty(context, input.inputExpression);
    setContextModel(null);
    setField(null);
    setMetaField(null);
    setAllFields([]);
    setRelationalField(null);
    setExpressionLanguage(expressionLanguage);
  };

  useEffect(() => {
    setInput(propInput);
    const { inputExpression } = propInput || {};
    const { $attrs, text, expressionLanguage, typeRef } = inputExpression || {};
    setExpressionLanguage(expressionLanguage);
    setType(typeRef);
    setDefaultValue(
      propInput?.$attrs ? propInput.$attrs["camunda:defaultValue"] : undefined
    );

    const textValues = text?.split(".");
    const modelName = textValues && textValues[0];
    const isPresent = models?.find(
      (m) => getLowerCase(m.name) === getLowerCase(modelName)
    )?.name;
    const allFields = $attrs && $attrs["camunda:allFields"];
    setReadOnly(allFields ? true : false);

    // model is removed from view drd
    if (!isPresent && allFields) {
      setReadOnly(false);
      setType("string");
      setProperty(
        {
          typeRef: "string",
          "camunda:textMetaField": undefined,
          "camunda:relationalField": undefined,
          "camunda:allFields": undefined,
        },
        inputExpression
      );
    }
  }, [propInput, models, setProperty]);

  const alertClose = () => {
    setOpenAlert(false);
  };

  const handleAlertOk = () => {
    setOpenAlert(false);
    setReadOnly(false);
    setType("string");

    setProperty(
      {
        typeRef: "string",
        "camunda:textMetaField": undefined,
        "camunda:relationalField": undefined,
        "camunda:allFields": undefined,
      },
      input.inputExpression
    );

    setProperty({ "camunda:defaultValue": undefined }, input);
  };

  return (
    <React.Fragment>
      <TextField
        element={element}
        entry={{
          id: "label",
          label: translate("Label"),
          modelProperty: "label",
          get: function () {
            return {
              label: input && input.label,
            };
          },
          set: function (e, values) {
            let currentVal = values["label"];
            setProperty({ label: currentVal }, input);
          },
        }}
        canRemove={true}
      />
      <TextField
        element={element}
        entry={{
          id: "expression",
          label: translate("Expression"),
          modelProperty: "expression",
          get: function () {
            return {
              expression:
                input && input.inputExpression && input.inputExpression.text,
            };
          },
          set: function (e, values) {
            let currentVal = values["expression"];
            (currentVal || "").replace(/[\u200B-\u200D\uFEFF]/g, "");
            if (!currentVal) {
              setProperty(
                {
                  "camunda:textMetaField": undefined,
                  "camunda:relationalField": undefined,
                  "camunda:allFields": undefined,
                  typeRef: "string",
                  expressionLanguage: "feel",
                  "camunda:inputVariable": undefined,
                },
                input.inputExpression
              );
              setExpressionLanguage("feel");
            } else if (currentVal && currentVal.trim() !== "") {
              setExpressionLanguage("groovy");
              setProperty(
                { expressionLanguage: "groovy" },
                input.inputExpression
              );
            }
            setProperty({ text: currentVal }, input.inputExpression);
          },
        }}
        canRemove={true}
        readOnly={readOnly}
        endAdornment={
          <>
            <Tooltip title="Enable" aria-label="enable">
              <MaterialIcon
                icon="do_not_disturb"
                className={styles.newIcon}
                onClick={() => readOnly && setOpenAlert(true)}
              />
            </Tooltip>
            <MaterialIcon
              icon="edit"
              className={styles.newIcon}
              onClick={handleClickOpen}
            />
          </>
        }
      />
      {open && (
        <Dialog open={open} centered backdrop className={styles.dialog}>
          <DialogHeader onCloseClick={handleClose}>
            <h3>{translate("Expression")}</h3>
          </DialogHeader>
          <DialogContent className={styles.dialogContent}>
            {models?.length > 1 && (
              <Selection
                name="model"
                title="Model"
                placeholder="Model"
                fetchAPI={() => getData()}
                optionLabelKey="name"
                onChange={(e) => {
                  if (!e) {
                    setMetaField(null);
                    setAllFields(null);
                    setRelationalField(null);
                  }

                  setContextModel(e);
                  setField(null);
                }}
                value={contextModel}
                classes={{ root: styles.MuiAutocompleteRoot }}
              />
            )}
            <FieldEditor
              getMetaFields={() => getMetaFields(contextModel)}
              allowAllFields={true}
              excludeUITypes={true}
              onChange={(val, metaField, relationalField) => {
                setField(val);
                setMetaField(metaField);
                const values = val && val.split(".");
                const newFields = [...(allFields || []), metaField];
                const fields =
                  newFields &&
                  values &&
                  newFields.filter((f) => values.includes(f && f.name));
                const isAvailable =
                  fields &&
                  relationalField &&
                  fields.find((f) => (f && f.name) === relationalField.name);
                if (isAvailable) {
                  setRelationalField(relationalField);
                } else {
                  setRelationalField(null);
                }
                setAllFields(fields);
              }}
              value={{
                fieldName: field || "",
                allFields,
              }}
              isParent={true}
            />
          </DialogContent>
          <DialogFooter>
            <Button
              onClick={() => {
                handleOk();
                handleClose();
              }}
              variant="primary"
              className={styles.save}
            >
              {translate("OK")}
            </Button>
            <Button
              onClick={() => {
                handleClose();
                setField(null);
                setContextModel(null);
                setMetaField(null);
                setAllFields([]);
                setRelationalField(null);
              }}
              variant="secondary"
              className={styles.save}
            >
              {translate("Cancel")}
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      <SelectBox
        element={element}
        entry={{
          id: "expressionLanguage",
          label: "Expression language",
          modelProperty: "expressionLanguage",
          selectOptions: EXPRESSION_LANGUAGE_OPTIONS,
          get: function () {
            return { expressionLanguage };
          },
          set: function (e, value) {
            let expressionLanguage = value.expressionLanguage;
            if (input && input.inputExpression) {
              setProperty({ expressionLanguage }, input.inputExpression);
              setExpressionLanguage(expressionLanguage);
            }
          },
        }}
      />
      <TextField
        element={element}
        entry={{
          id: "inputVariable",
          label: translate("Input variable"),
          modelProperty: "inputVariable",
          get: function () {
            return {
              inputVariable: input && input.inputVariable,
            };
          },
          set: function (e, values) {
            let currentVal = values["inputVariable"];
            setProperty({ inputVariable: currentVal }, input);
          },
        }}
        canRemove={true}
      />
      <SelectBox
        element={element}
        entry={{
          id: "typeRef",
          label: translate("Type"),
          modelProperty: "typeRef",
          selectOptions: TYPES,
          disabled: readOnly,
          get: function () {
            return { typeRef: type };
          },
          set: function (e, value) {
            let typeRef = value.typeRef;
            if (input?.inputExpression) {
              setType(typeRef);
              setDefaultValue(null);
              setProperty({ "camunda:defaultValue": undefined }, input);
              setProperty({ typeRef }, input.inputExpression);
            }
          },
        }}
      />
      {["date", "datetime", "time"].includes(type) ? (
        <DatePicker
          type={type}
          entry={{
            id: "defaultValue",
            label: translate("Default value"),
            get: function () {
              return { defaultValue };
            },
            set: function (value) {
              setDefaultValue(value);
              setProperty({ "camunda:defaultValue": value }, input);
            },
          }}
        />
      ) : (
        <TextField
          element={element}
          entry={{
            id: "defaultValue",
            label: translate("Default value"),
            modelProperty: "defaultValue",
            get: function () {
              return { defaultValue };
            },
            set: function (e, values) {
              const currentVal = values["defaultValue"];
              const value =
                currentVal && type === "string"
                  ? `"${currentVal.replace(/['"]+/g, "")}"`
                  : currentVal;
              setDefaultValue(value);
              setProperty({ "camunda:defaultValue": value }, input);
            },
          }}
          canRemove={true}
        />
      )}
      <AlertDialog
        openAlert={openAlert}
        handleAlertOk={handleAlertOk}
        alertClose={alertClose}
        message="Script can't be managed using builder once changed manually."
        title="Warning"
      />
    </React.Fragment>
  );
}
