import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import { isEventSubProcess, isExpanded } from "bpmn-js/lib/util/DiUtil";
import { isDifferentType } from "bpmn-js/lib/features/popup-menu/util/TypeUtil";
import { filter } from "min-dash";
import type { BpmnElement } from "@studio/shared/types";

import * as replaceOptions from "../features/replace/ReplaceOptions";

import {
  createEntries,
  createSequenceFlowEntries,
  createMenuEntry,
  getLoopEntries,
  getDataObjectIsCollection,
  getParticipantMultiplicity,
  getAdHocEntry,
} from "./menu-entry-builders";


export default class ReplaceMenuProvider {
  static $inject = [
    "bpmnFactory",
    "popupMenu",
    "modeling",
    "moddle",
    "bpmnReplace",
    "rules",
    "translate",
  ];

  _bpmnFactory: unknown;
  _popupMenu: { registerProvider: (key: string, provider: unknown) => void };
  _modeling: unknown;
  _moddle: unknown;
  _bpmnReplace: { replaceElement: (element: unknown, target: unknown, hints?: unknown) => unknown };
  _rules: { allowed: (action: string, context: Record<string, unknown>) => boolean };
  _translate: (text: string) => string;

  constructor(
    bpmnFactory: unknown,
    popupMenu: { registerProvider: (key: string, provider: unknown) => void },
    modeling: unknown,
    moddle: unknown,
    bpmnReplace: {
      replaceElement: (element: unknown, target: unknown, hints?: unknown) => unknown;
    },
    rules: { allowed: (action: string, context: Record<string, unknown>) => boolean },
    translate: (text: string) => string,
  ) {
    this._bpmnFactory = bpmnFactory;
    this._popupMenu = popupMenu;
    this._modeling = modeling;
    this._moddle = moddle;
    this._bpmnReplace = bpmnReplace;
    this._rules = rules;
    this._translate = translate;

    this.register();
  }

  /**
   * Register replace menu provider in the popup menu
   */
  register(): void {
    this._popupMenu.registerProvider("bpmn-replace", this);
  }

  /**
   * Get all entries from replaceOptions for the given element and apply filters
   * on them. Get for example only elements, which are different from the current one.
   *
   * @param element
   * @return a list of menu entry items
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEntries(element: any): Record<string, unknown>[] {
    const businessObject = element.businessObject;

    const rules = this._rules;

    let entries;

    if (!rules.allowed("shape.replace", { element: element })) {
      return [];
    }

    const differentType = isDifferentType(element);

    if (is(businessObject, "bpmn:DataObjectReference")) {
      return this._createEntries(element, replaceOptions.DATA_OBJECT_REFERENCE);
    }

    if (is(businessObject, "bpmn:DataStoreReference")) {
      return this._createEntries(element, replaceOptions.DATA_STORE_REFERENCE);
    }

    // start events outside sub processes
    if (is(businessObject, "bpmn:StartEvent") && !is(businessObject.$parent, "bpmn:SubProcess")) {
      entries = filter(replaceOptions.START_EVENT, differentType);

      return this._createEntries(element, entries);
    }

    // expanded/collapsed pools
    if (is(businessObject, "bpmn:Participant")) {
      entries = filter(
        replaceOptions.PARTICIPANT,
        function (entry: { target: { isExpanded: boolean } }) {
          return isExpanded(element) !== entry.target.isExpanded;
        },
      );

      return this._createEntries(element, entries);
    }

    // start events inside event sub processes
    if (is(businessObject, "bpmn:StartEvent") && isEventSubProcess(businessObject.$parent)) {
      entries = filter(
        replaceOptions.EVENT_SUB_PROCESS_START_EVENT,
        function (entry: Record<string, unknown>) {
          const target = entry.target as Record<string, unknown>;

          const isInterrupting = target.isInterrupting !== false;

          const isInterruptingEqual = getBusinessObject(element).isInterrupting === isInterrupting;

          // filters elements which types and event definition are equal but have have different interrupting types
          return differentType(entry) || (!differentType(entry) && !isInterruptingEqual);
        },
      );

      return this._createEntries(element, entries);
    }

    // start events inside sub processes
    if (
      is(businessObject, "bpmn:StartEvent") &&
      !isEventSubProcess(businessObject.$parent) &&
      is(businessObject.$parent as Record<string, unknown>, "bpmn:SubProcess")
    ) {
      entries = filter(replaceOptions.START_EVENT_SUB_PROCESS, differentType);

      return this._createEntries(element, entries);
    }

    // end events
    if (is(businessObject, "bpmn:EndEvent")) {
      entries = filter(replaceOptions.END_EVENT, function (entry: Record<string, unknown>) {
        const target = entry.target as Record<string, unknown>;

        // hide cancel end events outside transactions
        if (
          target.eventDefinitionType === "bpmn:CancelEventDefinition" &&
          !is(businessObject.$parent, "bpmn:Transaction")
        ) {
          return false;
        }

        return differentType(entry);
      });

      return this._createEntries(element, entries);
    }

    // boundary events
    if (is(businessObject, "bpmn:BoundaryEvent")) {
      entries = filter(replaceOptions.BOUNDARY_EVENT, function (entry: Record<string, unknown>) {
        const target = entry.target as Record<string, unknown>;

        if (
          target.eventDefinitionType === "bpmn:CancelEventDefinition" &&
          !is(businessObject.attachedToRef, "bpmn:Transaction")
        ) {
          return false;
        }
        const cancelActivity = target.cancelActivity !== false;

        const isCancelActivityEqual = businessObject.cancelActivity === cancelActivity;

        return differentType(entry) || (!differentType(entry) && !isCancelActivityEqual);
      });

      return this._createEntries(element, entries);
    }

    // intermediate events
    if (
      is(businessObject, "bpmn:IntermediateCatchEvent") ||
      is(businessObject, "bpmn:IntermediateThrowEvent")
    ) {
      entries = filter(replaceOptions.INTERMEDIATE_EVENT, differentType);

      return this._createEntries(element, entries);
    }

    // gateways
    if (is(businessObject, "bpmn:Gateway")) {
      entries = filter(replaceOptions.GATEWAY, differentType);

      return this._createEntries(element, entries);
    }

    // transactions
    if (is(businessObject, "bpmn:Transaction")) {
      entries = filter(replaceOptions.TRANSACTION, differentType);

      return this._createEntries(element, entries);
    }

    // expanded event sub processes
    if (isEventSubProcess(businessObject) && isExpanded(element)) {
      entries = filter(replaceOptions.EVENT_SUB_PROCESS, differentType);

      return this._createEntries(element, entries);
    }

    // expanded sub processes
    if (is(businessObject, "bpmn:SubProcess") && isExpanded(element)) {
      entries = filter(replaceOptions.SUBPROCESS_EXPANDED, differentType);

      return this._createEntries(element, entries);
    }

    // collapsed ad hoc sub processes
    if (is(businessObject, "bpmn:AdHocSubProcess") && !isExpanded(element)) {
      entries = filter(replaceOptions.TASK, function (entry: Record<string, unknown>) {
        const target = entry.target as Record<string, unknown>;

        const isTargetSubProcess = target.type === "bpmn:SubProcess";

        const isTargetExpanded = target.isExpanded === true;

        return isDifferentType(element, target) && (!isTargetSubProcess || isTargetExpanded);
      });

      return this._createEntries(element, entries);
    }

    // sequence flows
    if (is(businessObject, "bpmn:SequenceFlow")) {
      return this._createSequenceFlowEntries(element, replaceOptions.SEQUENCE_FLOW);
    }

    // flow nodes
    if (is(businessObject, "bpmn:FlowNode")) {
      entries = filter(replaceOptions.TASK, differentType);

      // collapsed SubProcess can not be replaced with itself
      if (is(businessObject, "bpmn:SubProcess") && !isExpanded(element)) {
        entries = filter(entries, function (entry: Record<string, unknown>) {
          return entry.label !== "Sub Process (collapsed)";
        });
      }

      return this._createEntries(element, entries);
    }

    return [];
  }

  /**
   * Get a list of header items for the given element. This includes buttons
   * for multi instance markers and for the ad hoc marker.
   *
   * @param element
   * @return a list of menu entry items
   */
  getHeaderEntries(element: BpmnElement): Record<string, unknown>[] {
    let headerEntries: Record<string, unknown>[] = [];

    if (is(element, "bpmn:Activity") && !isEventSubProcess(element)) {
      headerEntries = headerEntries.concat(this._getLoopEntries(element));
    }

    if (is(element, "bpmn:DataObjectReference")) {
      headerEntries = headerEntries.concat(this._getDataObjectIsCollection(element));
    }

    if (is(element, "bpmn:Participant")) {
      headerEntries = headerEntries.concat(this._getParticipantMultiplicity(element));
    }

    if (
      is(element, "bpmn:SubProcess") &&
      !is(element, "bpmn:Transaction") &&
      !isEventSubProcess(element)
    ) {
      headerEntries.push(this._getAdHocEntry(element));
    }

    return headerEntries;
  }

  /**
   * Thin delegation wrappers to menu-entry-builders
   */
  _createEntries(
    element: BpmnElement,
    replaceOpts: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    return createEntries(this, element, replaceOpts);
  }

  _createSequenceFlowEntries(
    element: BpmnElement,
    replaceOpts: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    return createSequenceFlowEntries(this, element, replaceOpts);
  }

  _createMenuEntry(
    definition: Record<string, unknown>,
    element: BpmnElement,
    action?: () => unknown,
  ): Record<string, unknown> {
    return createMenuEntry(this, definition, element, action);
  }

  _getLoopEntries(element: BpmnElement): Record<string, unknown>[] {
    return getLoopEntries(this, element);
  }

  _getDataObjectIsCollection(element: BpmnElement): Record<string, unknown>[] {
    return getDataObjectIsCollection(this, element);
  }

  _getParticipantMultiplicity(element: BpmnElement): Record<string, unknown>[] {
    return getParticipantMultiplicity(this, element);
  }

  _getAdHocEntry(element: BpmnElement): Record<string, unknown> {
    return getAdHocEntry(this, element);
  }
}
