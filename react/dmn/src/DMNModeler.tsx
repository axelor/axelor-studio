import React, { useMemo } from "react";
import { DmnPropertiesPanelModule, DmnPropertiesProviderModule } from "dmn-js-properties-panel";
import camundaModdleDescriptor from "camunda-dmn-moddle/resources/camunda";
import Ids from "ids";

import decisionTableHeadEditorModule from "./custom-modeler/dmn-js-decision-table/lib/features/decision-table-head/editor";
import simpleModeModule from "./custom-modeler/dmn-js-decision-table/lib/features/simple-mode";
import propertiesCustomProviderModule from "./custom-provider";
import { DmnModelerProvider } from "./context/DmnModelerContext";
import DmnModelerInner from "./DmnModelerInner";

// CSS imports -- style the whole DMN tree
import "dmn-js/dist/assets/dmn-js-decision-table-controls.css";
import "dmn-js/dist/assets/dmn-js-decision-table.css";
import "dmn-js/dist/assets/dmn-js-drd.css";
import "dmn-js/dist/assets/dmn-js-literal-expression.css";
import "dmn-js/dist/assets/dmn-js-shared.css";
import "dmn-js/dist/assets/diagram-js.css";
import "dmn-js/dist/assets/dmn-font/css/dmn.css"; // @font-face for dmn icon font (per D-01, D-03)
import "./css/dmnModeler.css";

function nextId(prefix: string): string {
  const ids = new Ids([32, 32, 1]);
  return ids.nextPrefixed(`${prefix}_`);
}

const decisionId = nextId("Decision");
const definitionId = nextId("Definitions");

export const defaultDMNDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd" xmlns:biodi="http://bpmn.io/schema/dmn/biodi/1.0" id="${definitionId}" name="DRD" namespace="http://camunda.org/schema/1.0/dmn">
  <decision id="${decisionId}" name="Decision 1">
    <extensionElements>
      <biodi:bounds x="157" y="81" width="180" height="80" />
    </extensionElements>
    <decisionTable id="decisionTable_1">
      <input id="input_1">
        <inputExpression id="inputExpression_1" typeRef="string" expressionLanguage="feel">
          <text></text>
        </inputExpression>
      </input>
      <output id="output_1" typeRef="string" />
    </decisionTable>
  </decision>
</definitions>`;

function DMNModeler() {
  const modelerConfig = useMemo(
    () => ({
      // Deferred attach pattern: no container or propertiesPanel.parent
      // The modeler starts "headless" -- attachTo() is called after React renders the target divs
      drd: {
        additionalModules: [
          DmnPropertiesPanelModule,
          DmnPropertiesProviderModule,
          propertiesCustomProviderModule,
        ],
      },
      decisionTable: {
        additionalModules: [decisionTableHeadEditorModule, simpleModeModule],
      },
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    }),
    [],
  );

  return (
    <DmnModelerProvider config={modelerConfig}>
      <DmnModelerInner />
    </DmnModelerProvider>
  );
}

export default DMNModeler;
