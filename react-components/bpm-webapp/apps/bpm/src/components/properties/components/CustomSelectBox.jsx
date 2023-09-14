import React, { useState, useEffect } from "react";
import utils from "bpmn-js-properties-panel/lib/Utils";
import find from "lodash/find";
import { makeStyles } from "@material-ui/styles";

import { translate } from "../../../utils";

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
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    color: "#666",
    marginBottom: 3,
  },
  add: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 0,
  },
  clear: {
    top: "-23px !important",
    position: "absolute",
    height: 23,
    width: 24,
    overflow: "hidden",
    cursor: "pointer",
    backgroundColor: "#f8f8f8",
    border: "1px solid #ccc",
    borderBottom: "none",
    right: 23,
  },
  container: {
    position: "relative",
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
}) {
  const classes = useStyles();
  const {
    label,
    canBeHidden,
    id,
    referenceProperty,
    set,
    emptyParameter = true,
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
    (id) => {
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

    setOptions([
      ...(options || []),
      {
        name: `${name} (id=${id})`,
        value: name,
        id: id,
      },
    ]);
    setSelectedElement(id);
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
        <label
          htmlFor={`cam-extensionElements-${id}`}
          className={classes.label}
        >
          {translate(label)}
        </label>
        <div className={classes.container}>
          <select
            id={`cam-extensionElements-${id}`}
            className={classes.extensionElements}
            name="selectedExtensionElement"
            data-list-entry-container
            value={selectedOption || ""}
            onChange={(e) => {
              setSelectedElement(e.target.value);
            }}
          >
            {options &&
              options.length > 0 &&
              options.map((option) => (
                <option value={option.id} key={option.value}>
                  {option.name}
                </option>
              ))}
            {emptyParameter && <option value=""></option>}
          </select>
          <button
            className={classes.add}
            id={`cam-extensionElements-create-${id}`}
            onClick={addElement}
          >
            <span>+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
