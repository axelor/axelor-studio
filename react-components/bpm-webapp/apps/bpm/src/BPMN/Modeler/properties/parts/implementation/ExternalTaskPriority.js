export default function ExternalTaskPriority(
  element,
  bpmnFactory,
  options,
  translate
) {
  let getBusinessObject = options.getBusinessObject;

  let externalTaskPriorityEntry = {
    id: "externalTaskPriority",
    label: translate("Task priority"),
    modelProperty: "taskPriority",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      return {
        taskPriority: bo && bo.get("camunda:taskPriority"),
      };
    },

    set: function (element, values) {
      if (
        element &&
        element.businessObject &&
        element.businessObject.processRef
      ) {
        element.businessObject.processRef.taskPriority =
          values.taskPriority || undefined;
      }
    },
  };

  return [externalTaskPriorityEntry];
}
