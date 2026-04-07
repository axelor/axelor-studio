export default function JobPriority(
  element: any,
  bpmnFactory: any,
  options: any,
  translate: (s: string) => string,
) {
  const getBusinessObject = options.getBusinessObject;

  const jobPriorityEntry: Record<string, any> = {
    id: "jobPriority",
    label: translate("Job priority"),
    modelProperty: "jobPriority",
    widget: "textField",
    get: function (element: any, _node: any) {
      const bo = getBusinessObject(element);
      return {
        jobPriority: bo && bo.get("camunda:jobPriority"),
      };
    },

    set: function (element: any, values: any) {
      if (element && getBusinessObject(element)) {
        getBusinessObject(element).jobPriority = values.jobPriority || undefined;
      }
      if (element && getBusinessObject(element) && getBusinessObject(element).processRef) {
        getBusinessObject(element).processRef.jobPriority = values.jobPriority || undefined;
      }
    },
  };

  return [jobPriorityEntry];
}
