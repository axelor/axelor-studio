import { getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";
import { isIdValid } from "../../../utils/ValidationUtil";

export default function IdProps(group, element, translate, options) {
  let description = options && options.description;
  // Id

  function changeRequiredDecisionIds(element, id) {
    if (!element) return;
    const requiredDecisions = [
      ...(element.incoming || []),
      ...(element.outgoing || []),
    ];

    requiredDecisions?.forEach((decision) => {
      const businessObject = getBusinessObject(decision);

      if (businessObject?.requiredDecision && id) {
        businessObject.requiredDecision.href = id;
      }
    });
  }
  group.entries.push({
    id: "id",
    label: translate("Id"),
    description: description && translate(description),
    modelProperty: "id",
    widget: "textField",
    getProperty: function (element) {
      return getBusinessObject(element).id;
    },
    setProperty: function (element, properties) {
      element = element.labelTarget || element;
      if (element.businessObject) {
        element.businessObject.id = properties["id"];
        changeRequiredDecisionIds(element, properties["id"]);
      }
    },
    validate: function (element, values) {
      let idValue = values.id;
      if (idValue === "__implicitroot") return;
      let bo = getBusinessObject(element);
      let idError = isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : {};
    },
  });
}
