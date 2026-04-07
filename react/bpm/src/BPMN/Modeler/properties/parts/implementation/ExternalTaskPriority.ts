export default function ExternalTaskPriority(
  element: any,
  bpmnFactory: any,
  options: any,
  translate: (s: string) => string,
) {
  const getBusinessObject = options.getBusinessObject;

  const externalTaskPriorityEntry: Record<string, any> = {
    id: "externalTaskPriority",
    label: translate("Task priority"),
    modelProperty: "taskPriority",
    widget: "textField",
    get: function (element: any, _node: any) {
      const bo = getBusinessObject(element);
      return {
        taskPriority: bo && bo.get("camunda:taskPriority"),
      };
    },

    set: function (element: any, values: any) {
      if (element && getBusinessObject(element) && getBusinessObject(element).processRef) {
        getBusinessObject(element).processRef.taskPriority = values.taskPriority || undefined;
      }
    },
  };

  return [externalTaskPriorityEntry];
}
