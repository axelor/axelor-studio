import { is, getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import { getProcessBusinessObject } from "../../extra";

export default function ExecutableProps(group, element, translate) {
  let bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (
    is(element, "bpmn:Process") ||
    (is(element, "bpmn:Participant") && bo && bo.get("processRef"))
  ) {
    let executableEntry = {
      id: "process-is-executable",
      label: translate("Executable"),
      modelProperty: "isExecutable",
      widget: "checkbox",
    };

    executableEntry.get = function (element) {
      var bo = getBusinessObject(element),
        res = {};
      res["isExecutable"] = bo && bo.get("isExecutable");
      return res;
    };

    executableEntry.set = function (element, values) {
      if (element && element.businessObject) {
        element.businessObject.isExecutable = !values["isExecutable"];
      }
    };

    // in participants we have to change the default behavior of set and get
    if (is(element, "bpmn:Participant")) {
      executableEntry.get = function (element) {
        return getProcessBusinessObject(element, "isExecutable");
      };

      executableEntry.set = function (element, values) {
        if (!is(element, "bpmn:Participant")) {
          return {};
        }
        var processRef = getBusinessObject(element).get("processRef");
        processRef["isExecutable"] = !values["isExecutable"];
        element.businessObject.processRef = processRef;
      };
    }

    group.entries.push(executableEntry);
  }
}
