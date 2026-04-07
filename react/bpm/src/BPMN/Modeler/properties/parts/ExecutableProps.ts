import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { getProcessBusinessObject } from "../../extra";

export default function ExecutableProps(
  group: any,
  element: any,
  translate: (s: string) => string,
  _bpmnModeler?: any,
) {
  const bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && bo && bo.get("processRef"))
  ) {
    const executableEntry: Record<string, any> = {
      id: "process-is-executable",
      label: translate("Executable"),
      modelProperty: "isExecutable",
      widget: "checkbox",
    };

    executableEntry.get = function (element: any) {
      const bo = getBusinessObject(element),
        res: Record<string, unknown> = {};
      res["isExecutable"] = bo && bo.get("isExecutable");
      return res;
    };

    executableEntry.set = function (element: any, values: any) {
      if (element && getBusinessObject(element)) {
        getBusinessObject(element).isExecutable = !values["isExecutable"];
      }
    };

    // in participants we have to change the default behavior of set and get
    if (is(element, "bpmn:Participant")) {
      executableEntry.get = function (element: any) {
        return getProcessBusinessObject(element, "isExecutable");
      };

      executableEntry.set = function (element: any, values: any) {
        if (!is(element, "bpmn:Participant")) {
          return {};
        }
        const processRef = getBusinessObject(element).get("processRef");
        processRef["isExecutable"] = !values["isExecutable"];
        getBusinessObject(element).processRef = processRef;
      };
    }

    group.entries.push(executableEntry);
  }
}
