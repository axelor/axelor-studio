import React, { useState, useEffect } from "react";
import find from "lodash/find";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import classnames from "classnames";
import { translate } from "@studio/shared/i18n";
import { Box, Button, InputLabel } from "@axelor/ui";
import type { ModdleElement } from "@studio/shared/types";

import Select from "../../Select";
import { findRootElementsByType, nextId, getRoot } from "../../../utils/ElementUtil";

import styles from "./custom-selectbox.module.css";

interface SelectOption {
  name: string;
  value: string;
  id: string;
  [key: string]: unknown;
}

interface CustomSelectBoxEntry {
  label?: string;
  canBeHidden?: boolean;
  id?: string;
  referenceProperty?: string;
  set?: (id: string, element: ModdleElement | undefined) => void;
  elementType?: string;
  newElementIdPrefix?: string;
  get?: () => Record<string, unknown>;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BpmnModdleLike = { create: (type: string, attrs: Record<string, unknown>) => ModdleElement; [k: string]: any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BpmnModelerLike = { get: (name: string) => any; [k: string]: any };

interface CustomSelectBoxProps {
  entry: CustomSelectBoxEntry;
  bpmnModdle?: BpmnModdleLike;
  definition: ModdleElement;
  bpmnModeler?: BpmnModelerLike;
  defaultOptions?: SelectOption[];
  endAdornment?: React.ReactNode;
  [key: string]: unknown;
}

function findElementById(eventDefinition: ModdleElement, type: string, id: string): ModdleElement | undefined {
  const elements = findRootElementsByType(eventDefinition, type);
  return find(elements, function (element: ModdleElement) {
    return element.id === id;
  });
}

export default function CustomSelectBox({
  entry,
  bpmnModdle,
  definition,
  bpmnModeler,
  defaultOptions = [],
  endAdornment = null,
  ..._rest
}: CustomSelectBoxProps) {
  const { label, canBeHidden, id, referenceProperty, set, elementType, newElementIdPrefix, get } =
    entry || {};
  const [selectedOption, setSelectedOption] = useState("");
  const [options, setOptions] = useState<SelectOption[]>([
    {
      name: "",
      value: "",
      id: "",
    },
  ]);

  const setSelectedElement = React.useCallback(
    (option: SelectOption | null) => {
      const { id } = option || {};
      const rootElements =
        bpmnModeler?.get("canvas").getRootElement().businessObject.$parent.rootElements;
      const element = rootElements && rootElements.find((r: ModdleElement) => r.id === id);
      if (definition && referenceProperty) {
        definition[referenceProperty] = element;
      }
      setSelectedOption(id ?? "");
      set?.(id ?? "", element);
    },
    [set, bpmnModeler, referenceProperty, definition],
  );

  const addElement = () => {
    const prefix = newElementIdPrefix || "elem_";
    const newId = nextId(prefix);
    const name = nextId(prefix);
    const props: Record<string, unknown> = {};
    if (!name) {
      props[referenceProperty ?? ""] = undefined;
    }
    let selectedElement = findElementById(definition, elementType ?? "", name);
    if (!selectedElement) {
      const root = getRoot(definition);
      const created = bpmnModdle?.create(elementType ?? "", {
        id: newId,
        name,
      });
      if (created) {
        selectedElement = created;
        const rootElement =
          bpmnModeler?.get("canvas").getRootElement().businessObject.$parent.rootElements;
        rootElement?.push(selectedElement);
        selectedElement.$parent = root;
      }
      if (definition && referenceProperty) {
        definition[referenceProperty] = selectedElement;
      }
    }
    const opt: SelectOption = {
      name: `${name} (id=${newId})`,
      value: name,
      id: newId,
    };
    setOptions([...(options || []), opt]);
    setSelectedElement(opt);
  };

  useEffect(() => {
    const selectedOption = get?.() ?? {};
    setSelectedOption(String(selectedOption[referenceProperty ?? ""] ?? ""));
  }, [get, referenceProperty]);

  useEffect(() => {
    setOptions(defaultOptions);
  }, [defaultOptions]);

  return (
    <div className={styles.root}>
      <div data-show={canBeHidden ? "hideElements" : ""}>
        <InputLabel htmlFor={`cam-extensionElements-${id}`} color="body" className={styles.label}>
          {translate(label ?? "")}
        </InputLabel>
        <Box position="relative" d="flex" gap={5}>
          <Select
            name="selectedExtensionElement"
            optionLabel="name"
            optionLabelSecondary="title"
            value={options?.find((o) => o?.id === selectedOption) || null}
            className={styles.select}
            update={(value: SelectOption | null) => setSelectedElement(value)}
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
            className={classnames(styles.add, Boolean(endAdornment) && styles.endAdornment)}
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
