import React, { useEffect, useState } from "react";
import { translate } from "@studio/shared/i18n";
import { Box, Table, TableCell, TableHead, TableRow, TableBody } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { IconButton } from "@studio/shared/components";
import { getTranslations } from "../../../../../../shared/services";
import { TextField } from "../../../../../../components/properties/components";
import type { PropertiesPanelComponentProps } from "../../../property-types";


interface ProcessConfigTitleTranslationProps extends PropertiesPanelComponentProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configKey?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: any;
}
import styles from "./process-config-title.module.css";

export default function ProcessConfigTitleTranslation({
  configKey,
  element,
  onChange,
  _bpmnModeler,
}: ProcessConfigTitleTranslationProps) {
  const [translations, setTranslations] = useState<any>(null);
  const [removedTranslations, setRemovedTranslations] = useState<any>(null);

  const addTranslation = () => {
    setTranslations([
      ...(translations || []),
      {
        message: "",
        language: "",
        key: `value:${configKey}`,
      },
    ]);
  };

  const removeTranslation = async (index: any) => {
    const cloneTranslations = [...(translations || [])];
    const remove = [...(removedTranslations || []), cloneTranslations[index]];
    cloneTranslations.splice(index, 1);
    setRemovedTranslations(remove);
    onChange(cloneTranslations, remove);
    setTranslations(cloneTranslations);
  };

  const setProperty = (index: any, label: any, value: any, callConfirm = false) => {
    const cloneTranslations = [...(translations || [])];
    cloneTranslations[index] = {
      ...cloneTranslations[index],
      [label]: value,
    };
    setTranslations(cloneTranslations);
    if (callConfirm) {
      onChange(cloneTranslations);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    async function getAllTranslations() {
      const translations = await getTranslations(configKey);
      if (isSubscribed) {
        setTranslations(translations);
      }
    }
    getAllTranslations();
    return () => { isSubscribed = false; };
  }, [configKey]);

  return (
    <Box w={100}>
      <React.Fragment>
        <Box bgColor="body" shadow rounded={2} className={styles.table}>
          <Table size="sm" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell className={styles.tableHead}>{translate("Translation")}</TableCell>
                <TableCell className={styles.tableHead}>
                  {translate("Language")} ({translate("Hint")}: en, fr)
                </TableCell>
                <TableCell className={styles.tableHead}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {translations &&
                translations.length > 0 &&
                translations.map((translateKey: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell as="th" textAlign="center">
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
                            setProperty(
                              index,
                              "message",
                              values.message,
                              translateKey.id ? true : false,
                            );
                          },
                        }}
                        isLabel={false}
                      />
                    </TableCell>
                    <TableCell as="th" textAlign="center">
                      <TextField
                        rootClass={styles.textRoot}
                        element={element}
                        entry={{
                          id: "language",
                          modelProperty: "language",
                          get: function () {
                            return {
                              language: translateKey.language,
                            };
                          },
                          set: function (e: any, values: any) {
                            if (translateKey.language === values.language) return;
                            setProperty(index, "language", values.language, true);
                          },
                        }}
                        isLabel={false}
                      />
                    </TableCell>
                    <TableCell as="th" textAlign="center">
                      <Box color="body">
                        <IconButton
                          className={styles.iconButton}
                          onClick={(e: any) => {
                            e.stopPropagation();
                            removeTranslation(index);
                          }}
                        >
                          <MaterialIcon icon="close" fontSize={16} className={styles.clear} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </React.Fragment>
      <Box d="flex" alignItems="center" color="body">
        <IconButton className={styles.iconButton} onClick={addTranslation} disabled={!configKey}>
          <MaterialIcon icon="add" fontSize={14} />
        </IconButton>
      </Box>
    </Box>
  );
}
