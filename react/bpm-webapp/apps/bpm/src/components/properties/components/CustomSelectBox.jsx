import React, { useState, useEffect } from "react";
import utils from "bpmn-js-properties-panel/lib/Utils";
import find from "lodash/find";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { makeStyles } from "@material-ui/core/styles";
import classnames from "classnames";

import Select from "../../Select";
import { translate } from "../../../utils";
import { Box, Button, InputLabel } from "@axelor/ui";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
  extensionElements: {
    width: "100%",
  },
  label: {
    display: "inline-block",
    verticalAlign: "middle",
    marginBottom: 3,
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(----ax-theme-panel-header-font-size, 1rem)",
  },
  add: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    borderBottom: "none",
    right: 0,
    borderRadius: 0,
    padding: 0,
    background: "var(--bs-body-bg)",
    border: "none",
  },
  endAdornment: {
    right: 23,
  },
  container: {
    position: "relative",
  },
  select: {
    width: "100%",
  },
});

function findElementById(eventDefinition, type, id) {
  var elements = utils.findRootElementsByType(eventDefinition, type);
  return find(elements, function (element) {
    return element.id === id;
  });
}

export default function CustomSelectBox({
  entry,
  bpmnModdle,
  definition,
  bpmnModeler,
  defaultOptions = [],
  endAdornment,
}) {
  const classes = useStyles();
  const {
    label,
    canBeHidden,
    id,
    referenceProperty,
    set,
    elementType,
    newElementIdPrefix,
    get,
  } = entry || {};
  const [selectedOption, setSelectedOption] = useState("");
  const [options, setOptions] = useState([
    {
      name: "",
      value: "",
      id: "",
    },
  ]);

  const setSelectedElement = React.useCallback(
    (option) => {
      const { id } = option || {};
      let rootElements =
        bpmnModeler &&
        bpmnModeler.get("canvas").getRootElement().businessObject.$parent
          .rootElements;
      let element = rootElements && rootElements.find((r) => r.id === id);
      definition[referenceProperty] = element;
      setSelectedOption(id);
      set(id, element);
    },
    [set, bpmnModeler, referenceProperty, definition]
  );

  const addElement = () => {
    let prefix = newElementIdPrefix || "elem_";
    let id = utils.nextId(prefix);
    let name = utils.nextId(prefix);
    let props = {};
    if (!name) {
      props[referenceProperty] = undefined;
    }
    let selectedElement = findElementById(definition, elementType, name);
    if (!selectedElement) {
      let root = utils.getRoot(definition);
      selectedElement = bpmnModdle.create(elementType, {
        id,
        name,
      });
      let rootElement =
        bpmnModeler &&
        bpmnModeler.get("canvas").getRootElement().businessObject.$parent
          .rootElements;
      rootElement.push(selectedElement);
      selectedElement.$parent = root;
      definition[referenceProperty] = selectedElement;
    }
    let opt = {
      name: `${name} (id=${id})`,
      value: name,
      id: id,
    };
    setOptions([...(options || []), opt]);
    setSelectedElement(opt);
  };

  useEffect(() => {
    let selectedOption = get();
    setSelectedOption(selectedOption[referenceProperty]);
  }, [get, referenceProperty]);

  useEffect(() => {
    setOptions(defaultOptions);
  }, [defaultOptions]);

  return (
    <div className={classes.root}>
      <div data-show={canBeHidden ? "hideElements" : ""}>
        <InputLabel
          htmlFor={`cam-extensionElements-${id}`}
          color="body"
          className={classes.label}
        >
          {translate(label)}
        </InputLabel>
        <Box position="relative" d="flex" gap={5}>
          <Select
            name="selectedExtensionElement"
            optionLabel="name"
            optionLabelSecondary="title"
            value={options?.find((o) => o?.id === selectedOption) || null}
            className={classes.select}
            update={(value) => setSelectedElement(value)}
            isLabel={true}
            options={options}
            index={`cam-extensionElements-${id}`}
            endAdornment={endAdornment}
          />
          <Button
            variant="secondary"
            outline
            d="flex"
            alignItems="center"
            justifyContent="center"
            className={classnames(
              classes.add,
              endAdornment && classes.endAdornment
            )}
            onClick={addElement}
          >
            <MaterialIcon icon="add" fontSize={16} />
          </Button>
          {endAdornment}
        </Box>
      </div>
    </div>
  );
}
