export default function JobPriority(element, bpmnFactory, options, translate) {
  let getBusinessObject = options.getBusinessObject;

  let jobPriorityEntry = {
    id: "jobPriority",
    label: translate("Job priority"),
    modelProperty: "jobPriority",
    widget: "textField",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      return {
        jobPriority: bo && bo.get("camunda:jobPriority"),
      };
    },

    set: function (element, values) {
      if (element && element.businessObject) {
        element.businessObject.jobPriority = values.jobPriority || undefined;
      }
      if (
        element &&
        element.businessObject &&
        element.businessObject.processRef
      ) {
        element.businessObject.processRef.jobPriority =
          values.jobPriority || undefined;
      }
    },
  };

  return [jobPriorityEntry];
}
