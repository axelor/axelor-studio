export default function Tasklist(element, bpmnFactory, options, translate) {
  let getBusinessObject = options.getBusinessObject;

  let isStartableInTasklistEntry = {
    id: "isStartableInTasklist",
    label: translate("Startable"),
    modelProperty: "isStartableInTasklist",
    widget: "checkbox",
    get: function (element, node) {
      let bo = getBusinessObject(element);
      let isStartableInTasklist = bo && bo.get("camunda:isStartableInTasklist");

      return {
        isStartableInTasklist: isStartableInTasklist
          ? isStartableInTasklist
          : "",
      };
    },

    set: function (element, values) {
      if (
        element &&
        element.businessObject &&
        element.businessObject.processRef
      ) {
        element.businessObject.processRef.isStartableInTasklist =
          !values.isStartableInTasklist || undefined;
      }
    },
  };

  return [isStartableInTasklistEntry];
}
