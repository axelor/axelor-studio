function getBO(bo: Record<string, unknown>): Record<string, unknown> {
  if (bo && (bo.$type === "bpmn:SubProcess" || bo.$type === "bpmn:Transaction")) {
    return getBO(bo.$parent as Record<string, unknown>);
  }
  return bo;
}

export function getProcessConfig(
  element: Record<string, unknown> | null,
  processConfigs?: string[],
) {
  if (processConfigs) {
    return {
      criteria: [
        {
          fieldName: "name",
          operator: "IN",
          value: processConfigs && processConfigs.length > 0 ? processConfigs : [""],
        },
      ],
      operator: "or",
    };
  }
  if (!element) return null;
  let bo = getBO((element as Record<string, Record<string, unknown>>)?.businessObject);
  bo = bo && (bo.$parent as Record<string, unknown>);
  if (element && element.type === "bpmn:Process") {
    bo = element.businessObject as Record<string, unknown>;
  } else if (bo && (bo.$type === "bpmn:SubProcess" || bo.$type === "bpmn:Transaction")) {
    bo = getBO(bo.$parent as Record<string, unknown>);
  } else if (
    (element && (element.businessObject as Record<string, unknown>)?.["$type"]) === "bpmn:Participant"
  ) {
    bo = element && (element.businessObject as Record<string, Record<string, unknown>>)?.processRef;
  }
  const extensionElements = bo && (bo.extensionElements as { values?: Record<string, unknown>[] } | undefined);
  const noOptions = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: [""],
      },
    ],
  };
  if (!extensionElements || !extensionElements.values) return noOptions;
  const processConfigurations = extensionElements.values.find(
    (e: Record<string, unknown>) => e.$type === "camunda:ProcessConfiguration",
  );
  const metaModels: string[] = [],
    metaJsonModels: string[] = [];
  if (!processConfigurations || !(processConfigurations).processConfigurationParameters)
    return noOptions;
  (
    (processConfigurations as Record<string, Record<string, unknown>[]>)
      .processConfigurationParameters
  ).forEach((config: Record<string, unknown>) => {
    if (config.metaModel) {
      metaModels.push(config.metaModel as string);
    } else if (config.metaJsonModel) {
      metaJsonModels.push(config.metaJsonModel as string);
    }
  });
  const value = [...metaModels, ...metaJsonModels];
  const data = {
    criteria: [
      {
        fieldName: "name",
        operator: "IN",
        value: value && value.length > 0 ? value : [""],
      },
    ],
    operator: "or",
  };
  return data;
}
