import React, { useState, useEffect } from "react";
import {findRootElementsByType,nextId,getRoot} from "../../../utils/ElementUtil";
import find from "lodash/find";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import classnames from "classnames";

import Select from "../../Select";
import { translate } from "../../../utils";
import { Box, Button, InputLabel } from "@axelor/ui";
import styles from "./CustomSelectBox.module.css";

function findElementById(eventDefinition, type, id) {
  var elements = findRootElementsByType(eventDefinition, type);
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
    let id = nextId(prefix);
    let name = nextId(prefix);
    let props = {};
    if (!name) {
      props[referenceProperty] = undefined;
    }
    let selectedElement = findElementById(definition, elementType, name);
    if (!selectedElement) {
      let root = getRoot(definition);
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
    <div className={styles.root}>
      <div data-show={canBeHidden ? "hideElements" : ""}>
        <InputLabel
          htmlFor={`cam-extensionElements-${id}`}
          color="body"
          className={styles.label}
        >
          {translate(label)}
        </InputLabel>
        <Box position="relative" d="flex" gap={5}>
          <Select
            name="selectedExtensionElement"
            optionLabel="name"
            optionLabelSecondary="title"
            value={options?.find((o) => o?.id === selectedOption) || null}
            className={styles.select}
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
              styles.add,
              endAdornment && styles.endAdornment
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
