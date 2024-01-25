import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";

import { getTranslations } from "../../../../../services/api";
import { TextField } from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";

import {
  Box,
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const useStyles = makeStyles({
  tableHead: {
    fontWeight: 600,
    fontSize: 14,
    textAlign: "center",
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    padding: 2,
    color: "inherit !important",
    width: "fit-content",
    border: "1px solid #ccc",
  },
  clear: {
    fontSize: "1rem",
  },
  table: {
    margin: "10px 0px",
    overflow: "auto",
    maxHeight: "65vh",
  },
  textRoot: {
    marginTop: 0,
  },
});

export default function ProcessConfigTitleTranslation({
  configKey,
  element,
  onChange,
  bpmnModeler,
  setDummyProperty = () => {},
}) {
  const [translations, setTranslations] = useState(null);
  const [removedTranslations, setRemovedTranslations] = useState(null);

  const classes = useStyles();

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

  const removeTranslation = async (index) => {
    setDummyProperty({
      bpmnModeler,
      element,
      value: index,
    });
    const cloneTranslations = [...(translations || [])];
    const remove = [...(removedTranslations || []), cloneTranslations[index]];
    cloneTranslations.splice(index, 1);
    setRemovedTranslations(remove);
    onChange(cloneTranslations, remove);
    setTranslations(cloneTranslations);
  };

  const setProperty = (index, label, value, callConfirm = false) => {
    setDummyProperty({
      bpmnModeler,
      element,
      value,
    });
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
    return () => (isSubscribed = false);
  }, [configKey]);

  return (
    <Box w={100}>
      <React.Fragment>
        <Box bgColor="body" shadow rounded={2} className={classes.table}>
          <Table size="sm" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHead}>
                  {translate("Translation")}
                </TableCell>
                <TableCell className={classes.tableHead}>
                  {translate("Language")} ({translate("Hint")}: en, fr)
                </TableCell>
                <TableCell className={classes.tableHead}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {translations &&
                translations.length > 0 &&
                translations.map((translateKey, index) => (
                  <TableRow key={index}>
                    <TableCell as="th" textAlign="center">
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
                            if (translateKey.message === values.message) return;
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
                    <TableCell as="th" textAlign="center">
                      <TextField
                        rootClass={classes.textRoot}
                        element={element}
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
                    <TableCell as="th" textAlign="center">
                      <Box color="body">
                        <IconButton
                          className={classes.iconButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTranslation(index);
                          }}
                        >
                          <MaterialIcon
                            icon="close"
                            fontSize={16}
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
      </React.Fragment>
      <Box d="flex" alignItems="center" color="body">
        <IconButton
          className={classes.iconButton}
          onClick={addTranslation}
          disabled={!configKey}
        >
          <MaterialIcon icon="add" fontSize={14} />
        </IconButton>
      </Box>
    </Box>
  );
}
