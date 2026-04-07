import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { forEach } from "min-dash";
import { translate } from "@studio/shared/i18n";

// Element params are loosely typed diagram-js elements with dynamic properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DiagramElement = any;

/** The shape of a ReplaceMenuProvider instance (duck-typed) */
 
interface MenuProviderLike {
  _bpmnFactory: any;
  _popupMenu: any;
  _modeling: any;
  _moddle: any;
  _bpmnReplace: any;
  _rules: any;
  _translate: any;
}

/**
 * Creates an array of menu entry objects for a given element and filters the replaceOptions
 * according to a filter function.
 */
export function createEntries(
  self: MenuProviderLike,
  element: DiagramElement,
  replaceOptions: Record<string, unknown>[],
): Record<string, unknown>[] {
  const menuEntries: Record<string, unknown>[] = [];

  forEach(replaceOptions, function (definition: Record<string, unknown>) {
    const entry = createMenuEntry(self, definition, element);

    menuEntries.push(entry);
  });

  return menuEntries;
}

/**
 * Creates an array of menu entry objects for a given sequence flow.
 */
export function createSequenceFlowEntries(
  self: MenuProviderLike,
  element: DiagramElement,
  replaceOptions: Record<string, unknown>[],
): Record<string, unknown>[] {
  const businessObject = getBusinessObject(element);

  const menuEntries: Record<string, unknown>[] = [];

  const modeling = self._modeling,
    moddle = self._moddle;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forEach(replaceOptions, function (entry: any) {
    switch (entry.actionName) {
      case "replace-with-default-flow":
        if (
          (businessObject as Record<string, unknown>).sourceRef &&
          businessObject.sourceRef.default !== businessObject &&
          (is(businessObject.sourceRef, "bpmn:ExclusiveGateway") ||
            is(businessObject.sourceRef, "bpmn:InclusiveGateway") ||
            is(businessObject.sourceRef, "bpmn:ComplexGateway") ||
            is(businessObject.sourceRef, "bpmn:Activity"))
        ) {
          menuEntries.push(
            createMenuEntry(self, entry, element, function () {
              modeling.updateProperties(element.source as unknown, { // safety: bpmn-js modeling.updateProperties accepts any element
                default: businessObject,
              });
            }),
          );
        }
        break;
      case "replace-with-conditional-flow":
        if (!businessObject.conditionExpression && is(businessObject.sourceRef, "bpmn:Activity")) {
          menuEntries.push(
            createMenuEntry(self, entry, element, function () {
              const conditionExpression = moddle.create("bpmn:FormalExpression");
              conditionExpression.body = "";

              modeling.updateProperties(element, {
                conditionExpression: conditionExpression,
              });
            }),
          );
        }
        break;
      default:
        // default flows
        if (is(businessObject.sourceRef, "bpmn:Activity") && businessObject.conditionExpression) {
          menuEntries.push(
            createMenuEntry(self, entry, element, function () {
              modeling.updateProperties(element, {
                conditionExpression: undefined,
              });
            }),
          );
          return;
        }

        // conditional flows
        if (
          (is(businessObject.sourceRef, "bpmn:ExclusiveGateway") ||
            is(businessObject.sourceRef, "bpmn:InclusiveGateway") ||
            is(businessObject.sourceRef, "bpmn:ComplexGateway") ||
            is(businessObject.sourceRef, "bpmn:Activity")) &&
          businessObject.sourceRef.default === businessObject
        ) {
          menuEntries.push(
            createMenuEntry(self, entry, element, function () {
              modeling.updateProperties(element.source, { default: undefined });
            }),
          );
          return;
        }
    }
  });

  return menuEntries;
}

/**
 * Creates and returns a single menu entry item.
 */
export function createMenuEntry(
  self: MenuProviderLike,
  definition: Record<string, unknown>,
  element: DiagramElement,
  action?: () => unknown,
): Record<string, unknown> {
  const replaceElement = self._bpmnReplace.replaceElement;

  const replaceAction = function () {
    return replaceElement(element, (definition).target);
  };

  let label = definition.label;
  if (label && typeof label === "function") {
    label = (label as (el: DiagramElement) => string)(element);
  }

  action = action || replaceAction;

  const menuEntry = {
    label: translate(label as string),
    className: definition.className,
    id: definition.actionName,
    action: action,
  };

  return menuEntry;
}

/**
 * Get a list of menu items containing buttons for multi instance markers
 */
export function getLoopEntries(
  self: MenuProviderLike,
  element: DiagramElement,
): Record<string, unknown>[] {
  function toggleLoopEntry(_event: unknown, entry: Record<string, unknown>) {
    let loopCharacteristics: unknown;

    if (entry.active) {
      loopCharacteristics = undefined;
    } else {
      const options = entry.options as Record<string, unknown>;
      loopCharacteristics = self._moddle.create(options.loopCharacteristics as string);

      if (options.isSequential) {
        (loopCharacteristics as Record<string, unknown>).isSequential = options.isSequential;
      }
    }
    self._modeling.updateProperties(element, {
      loopCharacteristics: loopCharacteristics,
    });
  }

  const businessObject = getBusinessObject(element),
    loopCharacteristics = (businessObject as Record<string, unknown>).loopCharacteristics as
      | Record<string, unknown>
      | undefined;

  let isSequential: boolean | undefined,
    isLoop: boolean | undefined,
    isParallel: boolean | undefined;

  if (loopCharacteristics) {
    isSequential = loopCharacteristics.isSequential as boolean | undefined;
    isLoop = loopCharacteristics.isSequential === undefined;
    isParallel =
      loopCharacteristics.isSequential !== undefined && !loopCharacteristics.isSequential;
  }

  const loopEntries: Record<string, unknown>[] = [
    {
      id: "toggle-parallel-mi",
      className: "bpmn-icon-parallel-mi-marker",
      title: translate("Parallel multi instance"),
      active: isParallel,
      action: toggleLoopEntry,
      options: {
        loopCharacteristics: "bpmn:MultiInstanceLoopCharacteristics",
        isSequential: false,
      },
    },
    {
      id: "toggle-sequential-mi",
      className: "bpmn-icon-sequential-mi-marker",
      title: translate("Sequential multi instance"),
      active: isSequential,
      action: toggleLoopEntry,
      options: {
        loopCharacteristics: "bpmn:MultiInstanceLoopCharacteristics",
        isSequential: true,
      },
    },
    {
      id: "toggle-loop",
      className: "bpmn-icon-loop-marker",
      title: translate("Loop"),
      active: isLoop,
      action: toggleLoopEntry,
      options: {
        loopCharacteristics: "bpmn:StandardLoopCharacteristics",
      },
    },
  ];
  return loopEntries;
}

/**
 * Get a list of menu items containing a button for the collection marker
 */
export function getDataObjectIsCollection(
  self: MenuProviderLike,
  element: DiagramElement,
): Record<string, unknown>[] {
  const dataObject = ((element as Record<string, unknown>).businessObject as Record<string, unknown>)
      .dataObjectRef as Record<string, unknown>,
    isCollection = dataObject.isCollection;

  function toggleIsCollection(_event: unknown, entry: Record<string, unknown>) {
    self._modeling.updateModdleProperties(element, dataObject, {
      isCollection: !entry.active,
    });
  }

  const dataObjectEntries: Record<string, unknown>[] = [
    {
      id: "toggle-is-collection",
      className: "bpmn-icon-parallel-mi-marker",
      title: translate("Collection"),
      active: isCollection,
      action: toggleIsCollection,
    },
  ];
  return dataObjectEntries;
}

/**
 * Get a list of menu items containing a button for the participant multiplicity marker
 */
export function getParticipantMultiplicity(
  self: MenuProviderLike,
  element: DiagramElement,
): Record<string, unknown>[] {
  const bpmnFactory = self._bpmnFactory;

  function toggleParticipantMultiplicity(_event: unknown, entry: Record<string, unknown>) {
    const isActive = entry.active;
    let participantMultiplicity: unknown;

    if (!isActive) {
      participantMultiplicity = bpmnFactory.create("bpmn:ParticipantMultiplicity");
    }

    self._modeling.updateProperties(element, {
      participantMultiplicity: participantMultiplicity,
    });
  }

  const participantMultiplicity = (
    (element as Record<string, unknown>).businessObject as Record<string, unknown>
  ).participantMultiplicity;

  const participantEntries: Record<string, unknown>[] = [
    {
      id: "toggle-participant-multiplicity",
      className: "bpmn-icon-parallel-mi-marker",
      title: translate("Participant multiplicity"),
      active: !!participantMultiplicity,
      action: toggleParticipantMultiplicity,
    },
  ];
  return participantEntries;
}

/**
 * Get the menu items containing a button for the ad hoc marker
 */
export function getAdHocEntry(
  self: MenuProviderLike,
  element: DiagramElement,
): Record<string, unknown> {
  const businessObject = getBusinessObject(element);

  const isAdHoc = is(businessObject, "bpmn:AdHocSubProcess");

  const replaceElement = self._bpmnReplace.replaceElement;

  const adHocEntry: Record<string, unknown> = {
    id: "toggle-adhoc",
    className: "bpmn-icon-ad-hoc-marker",
    title: translate("Ad-hoc"),
    active: isAdHoc,
    action: function (_event: unknown, _entry: unknown) {
      if (isAdHoc) {
        return replaceElement(
          element,
          { type: "bpmn:SubProcess" },
          {
            autoResize: false,
            layoutConnection: false,
          },
        );
      } else {
        return replaceElement(
          element,
          { type: "bpmn:AdHocSubProcess" },
          {
            autoResize: false,
            layoutConnection: false,
          },
        );
      }
    },
  };

  return adHocEntry;
}
