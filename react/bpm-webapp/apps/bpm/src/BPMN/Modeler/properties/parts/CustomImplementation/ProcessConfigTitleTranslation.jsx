import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Table,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  IconButton,
} from "@material-ui/core";
import { Close, Add } from "@material-ui/icons";

import { getTranslations } from "../../../../../services/api";
import { TextField } from "../../../../../components/properties/components";
import { translate } from "../../../../../utils";
import { setDummyProperty } from "./utils";

const useStyles = makeStyles({
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  divider: {
    marginTop: 15,
    borderTop: "1px dotted #ccc",
  },
  tableCell: {
    textAlign: "left",
  },
  tableHead: {
    fontWeight: 600,
    fontSize: 12,
    textAlign: "left",
  },
  iconButton: {
    margin: "5px 0px 5px 5px",
    borderRadius: 0,
    padding: 2,
    color: "black",
    width: "fit-content",
    border: "1px solid #ccc",
  },
  clear: {
    fontSize: "1rem",
  },
  table: {
    margin: "10px 0px",
    background: "#F8F8F8",
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

export default function ProcessConfigTitleTranslation({
  configKey,
  element,
  onChange,
  bpmnModeler,
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
    <div>
      <React.Fragment>
        <TableContainer component={Paper} className={classes.table}>
          <Table size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableHead} align="center">
                  {translate("Translation")}
                </TableCell>
                <TableCell className={classes.tableHead} align="center">
                  {translate("Language")} ({translate("Hint")}: en, fr)
                </TableCell>
                <TableCell
                  className={classes.tableHead}
                  align="center"
                ></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {translations &&
                translations.length > 0 &&
                translations.map((translateKey, index) => (
                  <TableRow key={index}>
                    <TableCell
                      component="th"
                      scope="row"
                      align="center"
                      className={classes.tableCell}
                    >
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
                    <TableCell
                      component="th"
                      scope="row"
                      align="center"
                      className={classes.tableCell}
                    >
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
                    <TableCell
                      component="th"
                      scope="row"
                      align="center"
                      className={classes.tableCell}
                    >
                      <IconButton
                        className={classes.iconButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTranslation(index);
                        }}
                      >
                        <Close className={classes.clear} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </React.Fragment>
      <div style={{ display: "flex", alignItems: "center" }}>
        <IconButton
          className={classes.iconButton}
          onClick={addTranslation}
          disabled={!configKey}
        >
          <Add fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}
