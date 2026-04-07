import React, { useEffect, useState } from "react";
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";
import { Box, Table, TableCell, TableHead, TableRow, TableBody } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { IconButton } from "@studio/shared/components";
import {
  getTranslations,
  addTranslations,
  removeAllTranslations,
} from "../../../../../shared/services";
import { TextField, Checkbox } from "../../../../../components/properties/components";
import TranslationSelect from "../../../../../components/TranslationSelect";
import { getBool } from "../../../../../utils";
import { useStore } from "../../../../../store";
import { useAlert } from "../../../../../context/alert-context";
import { getNameProperty } from "../../../extra";
import CollapsePanel from "../components/CollapsePanel";
import type { PropertiesPanelComponentProps } from "../../property-types";

import styles from "./translation-props.module.css";

const getValue = (element: any) => {
  if (!element) return;
  const bo = getBusinessObject(element);
  return bo?.[getNameProperty(element)];
};

const getKey = (element: any) => {
  if (!element) return;
  const bo = getBusinessObject(element);
  return bo?.$attrs["camunda:key"] || bo?.[getNameProperty(element)];
};

export default function TranslationProps({
  element,
  bpmnModeler,
  _index,
  label,
}: PropertiesPanelComponentProps) {
  const [isTranslations, setIsTranslations] = useState(false);
  const [translations, setTranslations] = useState<any>(null);
  const [isVisible, setVisible] = useState(false);
  const { state } = useStore();
  const { element: _storeElement, info } = state;
  const { dispatch } = useAlert();
  const setSnackbar = (payload: any) => {
    dispatch({ type: "OPEN_ALERT", payload });
  };

  const setDiagramValue = (val: any) => {
    if (!element) return;
    const modelProperty = getNameProperty(element);
    const elementRegistry = bpmnModeler?.get("elementRegistry");
    const modeling = bpmnModeler?.get("modeling");
    const shape = element.id ? elementRegistry?.get(element.id) : undefined;
    if (!shape) return;
    modeling?.updateProperties(shape, {
      [modelProperty]: val,
    });
  };

  const showTranslations = React.useCallback(
    (translations: any) => {
      const bo = getBusinessObject(element);
      if (translations?.length <= 0) {
        const diagramValue = bo?.$attrs["camunda:key"] || bo?.[getNameProperty(element)];
        if (!diagramValue) return;
        setDiagramValue(diagramValue);
        return;
      }
      const language = (info as Record<string, Record<string, string>>)?.user?.lang;
      if (!language) return;
      const selectedTranslation = translations?.find(
        (t: any) => t.language === language.split("-")?.[0],
      );
      const diagramValue =
        selectedTranslation?.message || bo?.$attrs["camunda:key"] || bo?.[getNameProperty(element)];
      if (!diagramValue) return;
      setDiagramValue(diagramValue);
    },
    [element],
  );

  const onConfirm = async (translationsData: any) => {
    const res = await addTranslations(
      translationsData?.map((t: any) => ({
        ...t,
        key: t.key || `value:${getKey(element)}`,
      })),
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

  const removeTranslation = async (index: any) => {
    const cloneTranslations = [...(translations || [])];
    const removedTranslations = [cloneTranslations[index]];
    if (removedTranslations?.length > 0) {
      cloneTranslations.splice(index, 1);
      const res =
        removedTranslations?.[0]?.id && (await removeAllTranslations(removedTranslations));
      if (res || !removedTranslations?.[0]?.id) {
        setTranslations(cloneTranslations);
        showTranslations(cloneTranslations);
      }
    }
  };

  const setProperty = (
    index: any,
    label: any,
    value: any,
    { message, language }: PropertiesPanelComponentProps,
  ) => {
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
    return () => { isSubscribed = false; };
  }, [element, isTranslations]);

  useEffect(() => {
    let isSubscribed = true;
    const bo = getBusinessObject(element);
    const isTranslation = (bo && bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    if (isSubscribed) {
      setIsTranslations(getBool(isTranslation));
    }
    return () => { isSubscribed = false; };
  }, [element]);

  useEffect(() => {
    const canvas = bpmnModeler?.get("canvas");
    if (!canvas) return;
    let isSubscribed = true;
    const rootElement = canvas.getRootElement();

    if ((element && element.id) !== (rootElement && rootElement.id) && getValue(element)) {
      if (isSubscribed) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
    }
    return () => { isSubscribed = false; };
  }, [element, bpmnModeler, getValue(element)]);

  return (
    isVisible && (
      <CollapsePanel label={label} badgeCount={translations?.length} hideBadgeOnOpen={true}>
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
              set: function (e: any, value: any) {
                const isTranslations = !value.isTranslations;
                setIsTranslations(isTranslations);

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
              <IconButton className={styles.iconButton} onClick={addTranslation}>
                <MaterialIcon icon="add" fontSize="1rem" />
              </IconButton>
            </Box>
          )}
        </div>
        {isTranslations && translations && translations.length > 0 && (
          <Box rounded={2} bgColor="body" shadow style={{ margin: "10px 0" }} overflow="auto">
            <Table size="sm" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell textAlign="center" className={styles.tableHead}>
                    {translate("Translation")}
                  </TableCell>
                  <TableCell textAlign="center" className={styles.tableHead}>
                    {translate("Language")}
                  </TableCell>
                  <TableCell textAlign="center" className={styles.tableHead}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {translations &&
                  translations.length > 0 &&
                  translations.map((translateKey: any, index: number) => (
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
                            set: function (e: any, values: any) {
                              if (translateKey.message === values.message) return;
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
                            <MaterialIcon icon="close" className={styles.clear} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CollapsePanel>
    )
  );
}
