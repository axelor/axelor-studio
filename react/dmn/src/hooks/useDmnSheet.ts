import { useCallback } from "react";
import type { DmnModeler } from "dmn-js/lib/Modeler";

import useDmnSelectionStore from "../stores/useDmnSelectionStore";


interface InputExpression {
  expressionLanguage: string;
  [key: string]: unknown;
}

interface DmnInput {
  id: string;
  inputExpression: InputExpression;
  [key: string]: unknown;
}

interface DmnOutput {
  id: string;
  [key: string]: unknown;
}

interface DmnRule {
  id: string;
  label?: string;
  [key: string]: unknown;
}

interface DmnCell {
  id: string;
  col: { id: string; [key: string]: unknown };
  row: { id: string; [key: string]: unknown };
  businessObject?: { text?: string; [key: string]: unknown };
  [key: string]: unknown;
}

interface DmnRow {
  cells: DmnCell[];
  [key: string]: unknown;
}

interface UseDmnSheetOptions {
  openPropertyPanel: () => void;
}

/**
 * Hook that encapsulates decision table sheet event wiring.
 * Called from useDmnDiagram when a decision table view is opened.
 *
 * Handles: commandStack.row.add.executed, input.edit, output.edit, cell.click
 */
export function useDmnSheet(
  dmnModeler: DmnModeler | null,
  { openPropertyPanel }: UseDmnSheetOptions,
): { setupSheet: () => void } {
  const setInput = useDmnSelectionStore((s) => s.setInput);
  const setOutput = useDmnSelectionStore((s) => s.setOutput);
  const setInputIndex = useDmnSelectionStore((s) => s.setInputIndex);
  const setOutputIndex = useDmnSelectionStore((s) => s.setOutputIndex);
  const setRule = useDmnSelectionStore((s) => s.setRule);
  const setInputRule = useDmnSelectionStore((s) => s.setInputRule);

  const getInput = (event: { input: DmnInput; [key: string]: unknown }) => {
    const clone = { ...event };
    const {
      input: { inputExpression },
    } = clone;
    inputExpression.expressionLanguage = inputExpression.expressionLanguage || "feel";
    return { ...clone };
  };

  const setupSheet = useCallback(() => {
    if (!dmnModeler) return;
    const activeEditor = dmnModeler.getActiveViewer();
    if (!activeEditor) return;
    const sheet = activeEditor.get("sheet");
    if (!sheet) return;
    const eventBus = activeEditor.get("eventBus");

    eventBus.on("commandStack.row.add.executed", (event: Record<string, unknown>) => {
      const { context } = event || {};
      const { newRoot, row } = (context as Record<string, unknown>) || {};
      const { cells } = (row as Record<string, unknown>) || {};
      if (!newRoot || !cells) return;
      const businessObject = (newRoot as Record<string, unknown>).businessObject as Record<string, unknown> | undefined;
      const predefinedValues = [
        ...((businessObject?.input as Array<Record<string, unknown>>) || []),
        ...((businessObject?.output as Array<Record<string, unknown>>) || []),
      ];
      const cellsArray = cells as Array<Record<string, unknown>>;
      if (cellsArray.length > 0) {
        cellsArray.forEach((cell, i) => {
          if (cell && cell.businessObject) {
            const predefined = predefinedValues[i];
            const attrs = predefined?.$attrs as Record<string, unknown> | undefined;
            const value = attrs?.["camunda:defaultValue"] as string | undefined;
            if (value) {
              (cell.businessObject as Record<string, unknown>).text = value;
            }
          }
        });
      }
    });

    eventBus.on("input.edit", (event: { input: DmnInput; [key: string]: unknown }) => {
      const input = getInput(event);
      setInput(input.input);
      setOutput(null);
      setRule(null);
      setInputRule(null);
      openPropertyPanel();
    });

    eventBus.on("output.edit", (event: { output: DmnOutput; [key: string]: unknown }) => {
      setOutput(event.output);
      setInput(null);
      setRule(null);
      setInputRule(null);
      openPropertyPanel();
    });

    eventBus.on("cell.click", (event: { id: string; [key: string]: unknown }) => {
      const { id } = event;
      const element = sheet.getRoot();
      const rows: DmnRow[] = element.rows;
      const selectedRow =
        rows &&
        rows.find((product: DmnRow) => {
          return product.cells.some((item: DmnCell) => {
            return item.id === id;
          });
        });
      if (!selectedRow) {
        setInput(null);
        setRule(null);
        setInputRule(null);
        setOutput(null);
        return;
      }
      const cell = selectedRow.cells.find((item: DmnCell) => item.id === id);
      const decision = useDmnSelectionStore.getState().decision;
      const definitions = dmnModeler?.getDefinitions();
      const latestDecision = definitions?.drgElement?.find(
        (d: Record<string, unknown>) => d.id === decision?.id,
      );
      const {
        input: inputs,
        output: outputs,
        rule: elementRules,
      } = (latestDecision?.decisionLogic as Record<string, unknown> | undefined) || {};
      const { col, row } = cell || {};
      if (!col || !row) return;
      let column = (inputs as DmnInput[] | undefined)?.find(
        (i: DmnInput) => i.id === col.id,
      );
      const rules =
        (elementRules as DmnRule[] | undefined) &&
        (elementRules as DmnRule[]).map((obj: DmnRule, index: number) => {
          const clone = Object.assign({}, obj) as DmnRule & { label: string };
          clone.label = `Rule ${index + 1}`;
          return clone;
        });
      if (!rules) return;
      const rule = rules.find((r: DmnRule) => r.id === row.id);
      let columnIndex = (inputs as DmnInput[] | undefined)?.findIndex(
        (i: DmnInput) => i.id === col.id,
      );
      if (!column) {
        const outputsArr = outputs as DmnOutput[] | undefined;
        columnIndex = outputsArr?.findIndex((i: DmnOutput) => i.id === col.id);
        column = outputsArr?.find((i: DmnOutput) => i.id === col.id) as DmnInput | undefined;
        if (!column) return;
        setOutput(column);
        setOutputIndex(columnIndex ?? null);
        setRule(rule ?? null);
        setInput(null);
        setInputIndex(null);
        setInputRule(null);
      } else {
        setInput(column);
        setInputIndex(columnIndex ?? null);
        setInputRule(rule ?? null);
        setOutput(null);
        setOutputIndex(null);
        setRule(null);
      }
      openPropertyPanel();
    });
  }, [dmnModeler, openPropertyPanel]);

  return { setupSheet };
}
