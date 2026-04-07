import { is } from "bpmn-js/lib/util/ModelUtil";
import { translate } from "@studio/shared/i18n";

import processProps from "./parts/ProcessProps";
import idProps from "./parts/IdProps";
import nameProps from "./parts/NameProps";
import executableProps from "./parts/ExecutableProps";
import colorProps from "./parts/CustomImplementation/ColorProps";
import { TranslationProps, Comments } from "./parts/CustomImplementation";

const PROCESS_KEY_HINT = translate("This maps to the process definition key.");
const TASK_KEY_HINT = translate("This maps to the task definition key.");

export function createGeneralTabGroups(
  element: any,
  canvas: any,
  bpmnFactory: any,
  elementRegistry: any,
  translate: (s: string) => string,
  bpmnModeler: any,
) {
  // refer to target element for external labels
  element = element && (element.labelTarget || element);

  const generalGroup = {
    id: "general",
    label: translate("General"),
    entries: [],
  };

  let idOptions: any;
  let processOptions: any;

  if (is(element, "bpmn:Process")) {
    idOptions = { description: PROCESS_KEY_HINT };
  }

  if (is(element, "bpmn:UserTask")) {
    idOptions = { description: TASK_KEY_HINT };
  }

  if (is(element, "bpmn:Participant")) {
    processOptions = { processIdDescription: PROCESS_KEY_HINT };
  }

  idProps(generalGroup, element, translate, idOptions, bpmnModeler);
  nameProps(generalGroup, element, bpmnFactory, canvas, translate, bpmnModeler);
  processProps(generalGroup, element, translate, processOptions, bpmnModeler);
  executableProps(generalGroup, element, translate, bpmnModeler);
  colorProps(generalGroup, element, translate, bpmnModeler);

  const translationGroup = {
    id: "translations",
    label: translate("Translations"),
    entries: [],
    component: TranslationProps,
  };
  const commentsGroup = {
    id: "comments",
    label: translate("Comments"),
    entries: [],
    component: Comments,
  };

  const groups: any[] = [];
  groups.push(generalGroup);
  groups.push(commentsGroup);
  groups.push(translationGroup);
  return groups;
}
