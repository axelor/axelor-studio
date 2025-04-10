import React, { useEffect, useState, useCallback } from "react";
import IconButton from "../../../../../components/IconButton";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import {
  getTranslations,
  addTranslations,
  removeAllTranslations,
} from "../../../../../services/api";
import {
  TextField,
  Checkbox,
} from "../../../../../components/properties/components";
import TranslationSelect from "../../../../../components/TranslationSelect";
import Alert from "../../../../../components/Alert";
import { translate, getBool } from "../../../../../utils";
import {
  Box,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
} from "@axelor/ui";
import Title from "../../../Title";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { useStore } from "../../../../../store";
import { useAlert } from "../../../../../context/alert-context";
import { getNameProperty } from "../../../extra";
import styles from "./translation-props.module.css";

const getValue = (element) => {
  if (!element) return;
  const bo = getBusinessObject(element);
  return bo?.[getNameProperty(element)];
};

const getKey = (element) => {
  if (!element) return;
  const bo = getBusinessObject(element);
  return bo?.$attrs["camunda:key"] || bo?.[getNameProperty(element)];
};

export default function TranslationProps({
  element,
  bpmnModeler,
  index,
  label,
  setDummyProperty = () => {},
}) {
  const [isTranslations, setIsTranslations] = useState(false);
  const [translations, setTranslations] = useState(null);
  const [isVisible, setVisible] = useState(false);
  const { state } = useStore();
  const { element: storeElement, info } = state;
  const { dispatch } = useAlert();
  const setSnackbar = (payload) => {
    dispatch({ type: "OPEN_ALERT", payload });
  };

  const setDiagramValue = (val) => {
    if (!element) return;
    const modelProperty = getNameProperty(element);
    let elementRegistry = bpmnModeler?.get("elementRegistry");
    let modeling = bpmnModeler?.get("modeling");
    let shape = elementRegistry.get(element.id);
    if (!shape) return;
    modeling?.updateProperties(shape, {
      [modelProperty]: val,
    });
    setDummyProperty();
  };

  const showTranslations = React.useCallback(
    (translations) => {
      const bo = getBusinessObject(element);
      if (translations?.length <= 0) {
        const diagramValue =
          bo?.$attrs["camunda:key"] || bo?.[getNameProperty(element)];
        if (!diagramValue) return;
        setDiagramValue(diagramValue);
        return;
      }
      const language = info?.user?.lang;
      if (!language) return;
      const selectedTranslation = translations?.find(
        (t) => t.language === language.split("-")?.[0]
      );
      const diagramValue =
        selectedTranslation?.message ||
        bo?.$attrs["camunda:key"] ||
        bo?.[getNameProperty(element)];
      if (!diagramValue) return;
      setDiagramValue(diagramValue);
    },
    [element]
  );

  const onConfirm = async (translationsData) => {
    const res = await addTranslations(
      translationsData?.map((t) => ({
        ...t,
        key: t.key || `value:${getKey(element)}`,
      }))
    );
    setTranslations(res?.length ? res : translations);
    showTranslations(translationsData);
  };

  const addTranslation = () => {
    setTranslations([
      ...(translations || []),
      {
        message: "",
        language: "",
      },
    ]);
  };

  const removeTranslation = async (index) => {
    const cloneTranslations = [...(translations || [])];
    const removedTranslations = [cloneTranslations[index]];
    if (removedTranslations?.length > 0) {
      cloneTranslations.splice(index, 1);
      const res =
        removedTranslations?.[0]?.id &&
        (await removeAllTranslations(removedTranslations));
      if (res || !removedTranslations?.[0]?.id) {
        setDummyProperty();
        setTranslations(cloneTranslations);
        showTranslations(cloneTranslations);
      }
    }
  };

  const setProperty = (index, label, value, { message, language }) => {
    const cloneTranslations = [...(translations || [])];
    cloneTranslations[index] = {
      ...cloneTranslations[index],
      [label]: value,
    };
    setTranslations(cloneTranslations);
    if (message && language) {
      onConfirm(cloneTranslations);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    async function getAllTranslations() {
      if (!element) return;
      const bo = getBusinessObject(element);
      if (!bo) return;
      const value = bo?.$attrs["camunda:key"] || bo[getNameProperty(element)];
      const translations = await getTranslations(value);
      if (isSubscribed) {
        setTranslations(translations);
        showTranslations(translations);
      }
    }
    isTranslations && getAllTranslations();
    return () => (isSubscribed = false);
  }, [element, isTranslations]);

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

    if (
      (element && element.id) !== (rootElement && rootElement.id) &&
      getValue(storeElement)
    ) {
      if (isSubscribed) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
    return () => (isSubscribed = false);
  }, [element, bpmnModeler, getValue(storeElement)]);

  return (
    isVisible && (
      <div>
        <Title divider={index > 0} label={label} />
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
                setDummyProperty();
                const bo = getBusinessObject(element);
                if (!bo) return;
                if (bo.$attrs) {
                  bo.$attrs["camunda:isTranslations"] = isTranslations;
                } else {
                  bo.$attrs = { "camunda:isTranslations": isTranslations };
                }
                if (isTranslations) {
                  bo.$attrs["camunda:key"] = bo[getNameProperty(element)];
                } else {
                  bo[getNameProperty()] = bo?.$attrs["camunda:key"];
                  setDiagramValue(bo?.[getNameProperty()]);
                  delete bo.$attrs["camunda:key"];
                }
              },
            }}
          />
          {isTranslations && (
            <Box color="body">
              <IconButton
                className={styles.iconButton}
                onClick={addTranslation}
              >
                <MaterialIcon icon="add" fontSize="1rem" />
              </IconButton>
            </Box>
          )}
        </div>
        {isTranslations && translations && translations.length > 0 && (
          <Box
            rounded={2}
            bgColor="body"
            shadow
            style={{ margin: "10px 0" }}
            overflow="auto"
          >
            <Table size="sm" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell textAlign="center" className={styles.tableHead}>
                    {translate("Translation")}
                  </TableCell>
                  <TableCell textAlign="center" className={styles.tableHead}>
                    {translate("Language")}
                  </TableCell>
                  <TableCell
                    textAlign="center"
                    className={styles.tableHead}
                  ></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {translations &&
                  translations.length > 0 &&
                  translations.map((translateKey, index) => (
                    <TableRow key={index}>
                      <TableCell as="th" className={styles.tableCell}>
                        <TextField
                          rootClass={styles.textRoot}
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
                              setProperty(index, "message", values.message, {
                                ...translateKey,
                                message: values?.message,
                              });
                            },
                          }}
                          updateXMLProperty={false}
                          isLabel={false}
                        />
                      </TableCell>
                      <TableCell as="th" className={styles.tableCell}>
                        <TranslationSelect
                          translations={translations}
                          translateKey={translateKey}
                          setProperty={setProperty}
                          setSnackbar={setSnackbar}
                          index={index}
                        />
                      </TableCell>
                      <TableCell as="th" className={styles.tableCell}>
                        <Box color="body">
                          <IconButton
                            className={styles.iconButton}
                            onClick={() => removeTranslation(index)}
                          >
                            <MaterialIcon
                              icon="close"
                              className={styles.clear}
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
