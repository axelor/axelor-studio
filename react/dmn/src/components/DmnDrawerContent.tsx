import React, { useMemo, useCallback } from "react";
import classnames from "classnames";
import { Box, InputLabel, NavTabs } from "@axelor/ui";
import { Textbox, TextField, SelectBox, Checkbox } from "@studio/shared/properties";
import { translate } from "@studio/shared/i18n";
import type { DmnModeler } from "dmn-js/lib/Modeler";

import RuleProperties from "../properties/RuleProperties";
import InputHeadProperties from "../properties/InputHeadProperties";
import OutputHeadProperties from "../properties/OutputHeadProperties";
import { Title } from "@studio/shared/components";
import useDmnSelectionStore from "../stores/useDmnSelectionStore";
import type { ModelOption, DmnModeler as PropsDmnModeler  } from "../properties/types";
import styles from "../dmn-modeler.module.css";

interface PropertyEntry {
  id: string;
  widget: string;
  modelProperty?: string;
  [key: string]: unknown;
}

interface PropertyGroup {
  id: string;
  label: string;
  className?: string;
  component?: React.ComponentType<Record<string, unknown>>;
  entries: PropertyEntry[];
  [key: string]: unknown;
}

interface DmnDrawerContentProps {
  dmnModeler: DmnModeler;
  getData: (() => Record<string, unknown>[] | undefined) | null;
  getReadOnly: (entry: Record<string, unknown>) => boolean;
  onSave: () => void;
  nameCol: string | null;
  getNameCol: (nc: string) => void;
}

/**
 * Tab panel + property routing for DMN properties drawer.
 *
 * Reads tabs/tabValue from useDmnSelectionStore.
 * Routes to correct property component based on selection state:
 * - DRD view: propertiesTabs-based rendering
 * - Decision table: InputHeadProperties / OutputHeadProperties / RuleProperties
 */
function DmnDrawerContent({ dmnModeler, getData: rawGetData, getReadOnly, onSave, nameCol, getNameCol }: DmnDrawerContentProps) {
  // Cast cross-boundary types: dmn-js modeler -> properties/types modeler
  const propsModeler = dmnModeler as unknown as PropsDmnModeler; // safety: dmn-js modeler instance lacks typed properties interface
  const getData = rawGetData as (() => ModelOption[]) | null;
  const selectedElement = useDmnSelectionStore((s) => s.selectedElement);
  const decision = useDmnSelectionStore((s) => s.decision);
  const input = useDmnSelectionStore((s) => s.input);
  const output = useDmnSelectionStore((s) => s.output);
  const inputIndex = useDmnSelectionStore((s) => s.inputIndex);
  const outputIndex = useDmnSelectionStore((s) => s.outputIndex);
  const rule = useDmnSelectionStore((s) => s.rule);
  const inputRule = useDmnSelectionStore((s) => s.inputRule);
  const tabs = useDmnSelectionStore((s) => s.tabs);
  const tabValue = useDmnSelectionStore((s) => s.tabValue);
  const setTabValue = useDmnSelectionStore((s) => s.setTabValue);

  const tab = tabs && tabs[tabValue];
  const { groups = [], id: tabId = "" } = tab || {};

  const hasDrawerContent = useMemo(
    () => Boolean(input || inputRule || output || rule),
    [input, inputRule, output, rule],
  );

  const handleChange = useCallback(
    (newValue: { id: string } | null) => {
      const val = tabs?.findIndex((tab) => tab.id === newValue?.id) ?? -1;
      const tabVal = val > -1 ? val : 0;
      setTabValue(tabVal);
    },
    [tabs],
  );

  // Property components from @studio/shared expect specific entry/element types,
  // but the DMN properties system builds these dynamically. Cast at render boundary
  // using `as never` to satisfy all component prop interfaces without typed assertion overhead.
  const anyEntry = (entry: PropertyEntry) => entry as never;
  const anyElement = () => selectedElement as never;

  const renderComponent = (entry: PropertyEntry) => {
    if (!entry || !entry.widget) return null;
    const e = anyEntry(entry);
    const el = anyElement();
    switch (entry.widget) {
      case "textField":
        return (
          <TextField entry={e} element={el} canRemove={true} readOnly={getReadOnly(entry)} />
        );
      case "textBox":
        return <Textbox entry={e} element={el} />;
      case "selectBox":
        return <SelectBox entry={e} element={el} />;
      case "checkbox":
        return <Checkbox entry={e} element={el} />;
      default:
        return <Textbox entry={e} element={el} />;
    }
  };

  function Entry({ entry }: { entry: PropertyEntry }) {
    return <div key={entry.id}>{renderComponent(entry)}</div>;
  }

  const TabPanel = ({ group, index }: { group: PropertyGroup; index: number }) => {
    return (
      <div
        key={group.id}
        data-group={group.id}
        className={classnames(styles.groupContainer, group.className ? styles[group.className] : undefined)}
      >
        {group.component ? (
          <group.component
            element={selectedElement}
            index={index}
            label={group.label}
            onSave={onSave}
          />
        ) : (
          group.entries.length > 0 && (
            <React.Fragment>
              <Title divider={index > 0} label={group.label} />
              <div>
                {group.entries.map((entry, i) => (
                  <Entry entry={entry} key={i} />
                ))}
              </div>
            </React.Fragment>
          )
        )}
      </div>
    );
  };

  return (
    <>
      {selectedElement && selectedElement.id !== "__implicitroot" && (
        <InputLabel fontSize={5} fontWeight="bold">
          {selectedElement && selectedElement.id}
        </InputLabel>
      )}
      <NavTabs
        items={[
          {
            title: translate("General"),
            id: "general",
          },
        ]}
        onItemClick={handleChange}
        active={tabId}
      />
      {selectedElement && selectedElement.id === "__implicitroot" ? (
        decision && (
          <div>
            {decision && (
              <Box className={hasDrawerContent ? styles["drawer-content"] : ""}>
                {input && !inputRule && (
                  <InputHeadProperties
                    element={selectedElement}
                    input={input}
                    dmnModeler={propsModeler}
                    getData={getData}
                  />
                )}
                {inputRule && (
                  <RuleProperties
                    entity={input}
                    element={selectedElement}
                    dmnModeler={propsModeler}
                    rule={inputRule}
                    ruleFieldType="inputEntry"
                    ruleIndex={inputIndex ?? 0}
                    nameCol={nameCol ?? ""}
                    getData={getData}
                  />
                )}
                {output && !rule && (
                  <OutputHeadProperties
                    element={selectedElement}
                    output={output}
                    dmnModeler={propsModeler}
                    getData={getData}
                    getNameCol={getNameCol}
                  />
                )}
                {rule && (
                  <RuleProperties
                    entity={output}
                    element={selectedElement}
                    dmnModeler={propsModeler}
                    rule={rule}
                    ruleFieldType="outputEntry"
                    ruleIndex={outputIndex ?? 0}
                    isOutput={true}
                    nameCol={nameCol ?? ""}
                    getData={getData}
                  />
                )}
              </Box>
            )}
          </div>
        )
      ) : (
        <Box border p={2} pb={3} rounded>
          {(groups as PropertyGroup[]).map((group, index) => (
            <TabPanel key={index} group={group} index={index} />
          ))}
        </Box>
      )}
    </>
  );
}

export default DmnDrawerContent;
