import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import {
  getTranslations,
  addTranslations,
  removeAllTranslations,
  getInfo,
} from "../../../../../services/api";
import {
  TextField,
  Checkbox,
} from "../../../../../components/properties/components";
import { translate, getBool } from "../../../../../utils";
import {
  Box,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Divider,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
  },
  tableCell: {
    textAlign: "left",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: 12,
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    padding: 2,
    color: "inherit",
    width: "fit-content",
    border: "1px solid #ccc",
  },
  clear: {
    fontSize: "1rem",
  },
  textRoot: {
    marginTop: 0,
  },
  confirm: {
    color: "#727272",
    width: "fit-content",
    border: "1px solid #ccc",
    height: 23,
    fontSize: 12,
    marginLeft: 5,
    borderRadius: 0,
    textTransform: "none",
    marginBottom: 10,
    padding: "0px 10px !important",
  },
});

export default function TranslationProps({
  element,
  bpmnModeler,
  index,
  label,
}) {
  const [isTranslations, setIsTranslations] = useState(false);
  const [value, setValue] = useState(null);
  const [translations, setTranslations] = useState(null);
  const [isVisible, setVisible] = useState(false);
  const [info, setInfo] = useState(null);
  const classes = useStyles();

  const setDiagramValue = (val, isCheckbox = false) => {
    if (!element) return;
    const bo = getBusinessObject(element);
    const isTranslation =
      (bo && bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    if (!getBool(isTranslation) && !isCheckbox) return;
    const elementType = element && element.type;
    let modelProperty =
      elementType === "bpmn:TextAnnotation"
        ? "text"
        : elementType === "bpmn:Group"
        ? "categoryValue"
        : "name";
    element.businessObject[modelProperty] = val;
    let elementRegistry = bpmnModeler?.get("elementRegistry");
    let modeling = bpmnModeler?.get("modeling");
    let shape = elementRegistry.get(element.id);
    if (!shape) return;
    modeling &&
      modeling.updateProperties(shape, {
        [modelProperty]: val,
      });
  };

  const onConfirm = async (translations) => {
    const res = await addTranslations(translations);
    setTranslations(res);
    if (translations && translations.length > 0) {
      const language = info && info["user.lang"];
      if (language) {
        const selectedTranslation = translations.find(
          (t) => t.language === language
        );
        const value = selectedTranslation && selectedTranslation.message;
        const bo = element && element.businessObject;
        const elementType = element && element.type;
        let modelProperty =
          elementType === "bpmn:TextAnnotation"
            ? "text"
            : elementType === "bpmn:Group"
            ? "categoryValue"
            : "name";
        const name = bo[modelProperty];
        const key = bo.$attrs["camunda:key"];
        element.businessObject.$attrs["camunda:key"] = key || name;
        const diagramValue = value || key || name;
        if (diagramValue) {
          setDiagramValue(diagramValue);
        }
      }
    }
  };

  const addTranslation = () => {
    setTranslations([
      ...(translations || []),
      {
        message: "",
        language: "",
        key: `value:${value}`,
      },
    ]);
  };

  const removeTranslation = async (index) => {
    const cloneTranslations = [...(translations || [])];
    const removedTranslations = [cloneTranslations[index]];
    cloneTranslations.splice(index, 1);
    if (
      removedTranslations &&
      removedTranslations.length > 0 &&
      removedTranslations[0].id
    ) {
      const res = await removeAllTranslations(removedTranslations);
      if (res) {
        const bo = element && element.businessObject;
        const elementType = element && element.type;
        let modelProperty =
          elementType === "bpmn:TextAnnotation"
            ? "text"
            : elementType === "bpmn:Group"
            ? "categoryValue"
            : "name";

        const name = bo[modelProperty];
        const key = bo.$attrs["camunda:key"];
        if (cloneTranslations && cloneTranslations.length === 0) {
          setDiagramValue(key || name);
        }
        if (cloneTranslations && cloneTranslations.length > 0) {
          const language = info && info["user.lang"];
          if (language) {
            const selectedTranslation = cloneTranslations.find(
              (t) => t.language === language
            );
            const value = selectedTranslation && selectedTranslation.message;
            const bo = element && element.businessObject;
            const elementType = element && element.type;
            let modelProperty =
              elementType === "bpmn:TextAnnotation"
                ? "text"
                : elementType === "bpmn:Group"
                ? "categoryValue"
                : "name";
            const name = bo[modelProperty];
            const key = bo.$attrs["camunda:key"];
            element.businessObject.$attrs["camunda:key"] = key || name;
            const diagramValue = value || key || name;
            if (diagramValue) {
              setDiagramValue(diagramValue);
            }
          }
        }
      }
    }
    setTranslations(cloneTranslations);
  };

  const setProperty = (index, label, value, callConfirm = false) => {
    const cloneTranslations = [...(translations || [])];
    cloneTranslations[index] = {
      ...cloneTranslations[index],
      [label]: value,
    };
    setTranslations(cloneTranslations);
    if (callConfirm) {
      onConfirm(cloneTranslations);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    async function getAllTranslations() {
      if (!element) return;
      const bo = element.businessObject;
      if (!bo) return;
      const elementType = element && element.type;
      let modelProperty =
        elementType === "bpmn:TextAnnotation"
          ? "text"
          : elementType === "bpmn:Group"
          ? "categoryValue"
          : "name";
      const name = bo[modelProperty];
      const key = bo.$attrs["camunda:key"];
      const value = key || name;
      const translations = await getTranslations(value);
      if (isSubscribed) {
        setValue(value);
        setTranslations(translations);
      }
    }
    getAllTranslations();
    return () => (isSubscribed = false);
  }, [element]);

  useEffect(() => {
    let isSubscribed = true;
    async function getUserInfo() {
      const info = await getInfo();
      if (isSubscribed) {
        setInfo(info);
      }
    }
    getUserInfo();
    return () => (isSubscribed = false);
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const bo = getBusinessObject(element);
    const isTranslation =
      (bo && bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    if (isSubscribed) {
      setIsTranslations(getBool(isTranslation));
    }
    return () => (isSubscribed = false);
  }, [element]);

  useEffect(() => {
    let canvas = bpmnModeler?.get("canvas");
    if (!canvas) return;
    let isSubscribed = true;
    let rootElement = canvas.getRootElement();
    if ((element && element.id) !== (rootElement && rootElement.id)) {
      if (isSubscribed) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
    return () => (isSubscribed = false);
  }, [element, bpmnModeler]);

  return (
    isVisible && (
      <div>
        <React.Fragment>
          {index > 0 && <Divider className={classes.divider} />}
        </React.Fragment>
        <Box color="body" className={classes.groupLabel}>
          {translate(label)}
        </Box>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Checkbox
            element={element}
            entry={{
              id: "isTranslations",
              label: translate("Add translations"),
              modelProperty: "isTranslations",
              get: function () {
                return {
                  isTranslations: isTranslations,
                };
              },
              set: function (e, value) {
                const isTranslations = !value.isTranslations;
                setIsTranslations(isTranslations);
                const bo = getBusinessObject(element);
                if (!bo) return;
                if (bo.$attrs) {
                  bo.$attrs["camunda:isTranslations"] = isTranslations;
                } else {
                  bo.$attrs = { "camunda:isTranslations": isTranslations };
                }

                const language = info && info["user.lang"];
                const selectedTranslation =
                  translations &&
                  translations.find((t) => t.language === language);
                if (!language || !selectedTranslation) return;
                const message =
                  selectedTranslation && selectedTranslation.message;
                const modelProperty =
                  element && element.type === "bpmn:TextAnnotation"
                    ? "text"
                    : "name";
                const name = bo[modelProperty];
                const key = bo.$attrs["camunda:key"];
                element.businessObject.$attrs["camunda:key"] = key || name;
                const diagramValue = !isTranslations
                  ? key || name
                  : message || key || name;
                if (diagramValue) {
                  setDiagramValue(diagramValue, true);
                }
              },
            }}
          />
          {isTranslations && (
            <Box color="body">
              <IconButton
                className={classes.iconButton}
                onClick={addTranslation}
              >
                <MaterialIcon icon="add" fontSize="1rem" />
              </IconButton>
            </Box>
          )}
        </div>
        {isTranslations && translations && translations.length > 0 && (
          <Box rounded={2} bgColor="body" shadow style={{ margin: "10px 0" }}>
            <Table size="sm" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell textAlign="center" className={classes.tableHead}>
                    {translate("Translation")}
                  </TableCell>
                  <TableCell textAlign="center" className={classes.tableHead}>
                    {translate("Language")} ({translate("Hint")}: en, fr)
                  </TableCell>
                  <TableCell
                    textAlign="center"
                    className={classes.tableHead}
                  ></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {translations &&
                  translations.length > 0 &&
                  translations.map((translateKey, index) => (
                    <TableRow key={index}>
                      <TableCell as="th" className={classes.tableCell}>
                        <TextField
                          rootClass={classes.textRoot}
                          element={element}
                          entry={{
                            id: "message",
                            modelProperty: "message",
                            get: function () {
                              return {
                                message: translateKey.message,
                              };
                            },
                            set: function (e, values) {
                              if (translateKey.message === values.message)
                                return;
                              setProperty(
                                index,
                                "message",
                                values.message,
                                translateKey.id ? true : false
                              );
                            },
                          }}
                          isLabel={false}
                        />
                      </TableCell>
                      <TableCell as="th" className={classes.tableCell}>
                        <TextField
                          element={element}
                          rootClass={classes.textRoot}
                          entry={{
                            id: "language",
                            modelProperty: "language",
                            get: function () {
                              return {
                                language: translateKey.language,
                              };
                            },
                            set: function (e, values) {
                              if (translateKey.language === values.language)
                                return;
                              setProperty(
                                index,
                                "language",
                                values.language,
                                true
                              );
                            },
                          }}
                          isLabel={false}
                        />
                      </TableCell>
                      <TableCell as="th" className={classes.tableCell}>
                        <Box color="body">
                          <IconButton
                            className={classes.iconButton}
                            onClick={() => removeTranslation(index)}
                          >
                            <MaterialIcon
                              icon="close"
                              className={classes.clear}
                            />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </div>
    )
  );
}
