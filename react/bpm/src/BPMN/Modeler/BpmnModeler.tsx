import React, { useMemo } from "react";
import minimapModule from "diagram-js-minimap";
import { BpmnPropertiesProviderModule, BpmnPropertiesPanelModule } from "bpmn-js-properties-panel";
import TokenSimulationModule from "bpmn-js-token-simulation/lib/modeler";
import lintModule from "bpmn-js-bpmnlint";

import bpmnlintConfig from "../../../bundled-config";

import propertiesCustomProviderModule from "./custom-provider";
import camundaModdleDescriptor from "./resources/camunda.json";
import { ModelerProvider } from "./context/ModelerContext";
import BpmnModelerInner from "./BpmnModelerInner";

function BpmnModelerComponent() {
  const modelerConfig = useMemo(
    () => ({
      // Deferred attach pattern: no container or propertiesPanel.parent
      // The modeler starts "headless" — attachTo() is called after React renders the target divs
      linting: {
        bpmnlint: bpmnlintConfig,
        active: false, // LINT-01: linting starts deactivated, activated on first user action
      },
      additionalModules: [
        lintModule,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        propertiesCustomProviderModule,
        minimapModule,
        TokenSimulationModule,
        {
          elementColors: [
            "value",
            {
              add() {},
              remove() {},
            },
          ],
        },
      ],
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
    }),
    [],
  );

  return (
    <ModelerProvider config={modelerConfig}>
      <BpmnModelerInner />
    </ModelerProvider>
  );
}

export default BpmnModelerComponent;
