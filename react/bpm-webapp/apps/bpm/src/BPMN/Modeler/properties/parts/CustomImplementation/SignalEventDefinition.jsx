import React, { useState, useEffect } from "react";
import Edit from "@material-ui/icons/Edit";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Button,
} from "@material-ui/core";
import BpmnModeler from "bpmn-js/lib/Modeler";
import { makeStyles } from "@material-ui/core/styles";

import Select from "../../../../../components/Select";
import {
  TextField,
  CustomSelectBox,
} from "../../../../../components/properties/components";
import { getWkfModels } from "../../../../../services/api";
import { translate } from "../../../../../utils";
import { setDummyProperty } from "./utils";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    padding: 5,
    minWidth: 450,
    overflow: "auto",
  },
  button: {
    margin: theme.spacing(1),
    backgroundColor: "#0275d8",
    borderColor: "#0267bf",
    textTransform: "none",
    color: "white",
    "&:hover": {
      backgroundColor: "#025aa5",
      borderColor: "#014682",
      color: "white",
    },
  },
  label: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    margin: "3px 0px",
  },
  select: {
    width: "100%",
  },
  newIcon: {
    color: "#58B423",
    cursor: "pointer",
  },
}));

export default function SignalEventProps({
  element,
  bpmnFactory,
  signalEventDefinition,
  bpmnModdle,
  bpmnModeler,
  id: wkfId
}) {
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [signalOptions, setSignalOptions] = useState([]);
  const [ele, setEle] = useState(null);
  const [open, setOpen] = useState(false);
  const [catchSignalObj, setSignalObj] = useState(null);
  const classes = useStyles();

  const getModels = React.useCallback((options) => {
    return getWkfModels(options, ["diagramXml", "code"]);
  }, []);

  const setInfo = async () => {
    let code;
    const id = signalEventDefinition?.signalRef?.id
    if (!id) return
    const signalElement = findElementById(id)
    code = signalElement?.$attrs["camunda:modelRefCode"]
    if (!code) return
    const model = await getModels({
      criteria: [{
        fieldName: "code",
        operator: "=",
        value: code
      }]
    })
    if (!model) return
    setSignalObj({
      wkf: model[0],
      signal: signalElement
    })
  }

  const handleClickOpen = () => {
    setOpen(true);
    setInfo()
  };

  const handleClose = () => {
    setSignalObj(null);
    setOpen(false);
  };

  const getSignals = async () => {
    let modeler = {
      keyboard: { bindTo: document },
    };
    let bpmnModelerTest = new BpmnModeler({ ...modeler });
    await bpmnModelerTest.importXML(catchSignalObj?.wkf?.diagramXml);
    const rootElements = bpmnModelerTest?.get("canvas")?.getRootElement()
      ?.businessObject?.$parent.rootElements;
    return rootElements?.filter((r) => (!(r?.$attrs && r.$attrs["camunda:modelRefCode"]) && r.$type === "bpmn:Signal"));
  };

  function findElementById(id) {
    if (!id) return
    const rootElements = bpmnModeler?.get("canvas")?.getRootElement()
      ?.businessObject?.$parent.rootElements;
    return rootElements?.find((r) => (r.$type === "bpmn:Signal" && r.id === id));
  }

  const addElement = ({ wkf, signal: signalElement }) => {
    if (!signalEventDefinition || !signalElement) return
    const { id, name } = signalElement
    if (!findElementById(id)) {
      let rootElement =
        bpmnModeler &&
        bpmnModeler.get("canvas").getRootElement().businessObject.$parent
          .rootElements;
      rootElement.push(signalElement);
      let opt = {
        name: `${name} (id=${id})`,
        value: name,
        id: id,
      };
      setSignalOptions(signalEventDefinition => [...(signalEventDefinition || []), opt]);
    }
    signalElement.$attrs["camunda:modelRefCode"] = wkf?.code;
    signalEventDefinition["signalRef"] = signalElement;
    setEle(signalElement);
    setSelectedSignal(id);
    if (signalEventDefinition?.signalRef) {
      setDummyProperty({
        bpmnModeler,
        element,
        value: name,
      });
      signalEventDefinition.signalRef.name = signalElement.name;
    }
  };

  const getOptions = React.useCallback(() => {
    const rootElements =
      bpmnModeler &&
      bpmnModeler.get("canvas").getRootElement().businessObject.$parent
        .rootElements;
    const elements =
      rootElements && rootElements.filter((r) => r.$type === "bpmn:Signal");
    const options =
      elements &&
      elements.map((element) => {
        return {
          value: element.name,
          name: `${element.name} (id=${element.id})`,
          id: element.id,
        };
      });
    setSignalOptions(options || []);
  }, [bpmnModeler]);

  useEffect(() => {
    let reference = signalEventDefinition.get("signalRef");
    setSelectedSignal(reference && reference.id);
    setEle(reference);
  }, [signalEventDefinition]);

  useEffect(() => {
    getOptions();
  }, [getOptions]);

  return (
    <div>
      <CustomSelectBox
        element={element}
        definition={signalEventDefinition}
        bpmnFactory={bpmnFactory}
        bpmnModdle={bpmnModdle}
        bpmnModeler={bpmnModeler}
        defaultOptions={signalOptions}
        endAdornment={
          <Edit
            className={classes.newIcon}
            onClick={() => {
              handleClickOpen();
            }}
          />
        }
        entry={{
          label: translate("Signal"),
          elementName: "signal",
          elementType: "bpmn:Signal",
          referenceProperty: "signalRef",
          newElementIdPrefix: "Signal_",
          set: function (value, ele) {
            setEle(ele);
            setSelectedSignal(value);
            if (signalEventDefinition && signalEventDefinition.signalRef) {
              setDummyProperty({
                bpmnModeler,
                element,
                value: ele.name,
              });
              signalEventDefinition.signalRef.name = ele.name;
            }
          },
          get: function () {
            return {
              signalRef: selectedSignal,
            };
          },
        }}
      />
      {(selectedSignal || selectedSignal === "") && (
        <TextField
          element={element}
          canRemove={true}
          entry={{
            id: "signal-element-name",
            label: translate("Signal name"),
            referenceProperty: "signalRef",
            modelProperty: "name",
            shouldValidate: true,
            get: function () {
              if (!signalEventDefinition) return;
              let reference = signalEventDefinition.get("signalRef");
              return {
                name: reference && reference.name,
              };
            },
            set: function (e, value) {
              if (signalEventDefinition && signalEventDefinition.signalRef) {
                signalEventDefinition.signalRef.name = value.name;
                setDummyProperty({
                  bpmnModeler,
                  element,
                  value: value.name,
                });
                getOptions();
                setSelectedSignal(ele && ele.id);
              }
            },
            validate: function (e, values) {
              if (!values.name && selectedSignal) {
                return { name: translate("Must provide a value") };
              }
            },
          }}
        />
      )}
      {open && (
        <Dialog
          open={open}
          onClose={(event, reason) => {
            if (reason !== "backdropClick") {
              handleClose();
            }
          }}
          aria-labelledby="form-dialog-title"
          maxWidth="sm"
          classes={{
            paper: classes.dialogPaper,
          }}
        >
          <DialogTitle id="form-dialog-title">
            {translate("Select Signal")}
          </DialogTitle>
          <DialogContent>
            <label className={classes.label}>{translate("BPM model")}</label>
            <Select
              className={classes.select}
              disableClearable={true}
              update={(value) => {
                setSignalObj(signalObj => ({ ...(signalObj || {}), wkf: value }));
              }}
              name="wkf"
              value={catchSignalObj?.wkf || ""}
              optionLabel="name"
              optionLabelSecondary="description"
              isLabel={false}
              fetchMethod={(options = {}) => getModels({
                ...options,
                criteria: wkfId ? [
                  {
                    fieldName: "id",
                    operator: "!=",
                    value: wkfId
                  },
                  ...(options?.criteria || [])
                ] : [...(options?.criteria || [])]
              })}
              disableUnderline={true}
              isOptionEllipsis={true}
            />
            {catchSignalObj?.wkf &&
              <>
                <label className={classes.label}>{translate("Signals")}</label>
                <Select
                  className={classes.select}
                  disableClearable={true}
                  update={(value) => {
                    setSignalObj(signalObj => ({ ...(signalObj || {}), signal: value }));
                  }}
                  name="signal"
                  value={catchSignalObj?.signal}
                  optionLabel="name"
                  optionLabelSecondary="description"
                  isLabel={false}
                  fetchMethod={getSignals}
                  disableUnderline={true}
                  isOptionEllipsis={true}
                />
              </>

            }
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleClose}
              className={classes.button}
              color="primary"
              variant="outlined"
            >
              {translate("Cancel")}
            </Button>
            <Button
              onClick={() => {
                addElement(catchSignalObj)
                setSignalObj(null);
                handleClose();
              }}
              className={classes.button}
              color="primary"
              variant="outlined"
            >
              {translate("OK")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
