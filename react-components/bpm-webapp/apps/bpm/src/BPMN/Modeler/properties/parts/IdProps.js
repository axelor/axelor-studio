import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";
import utils from "bpmn-js-properties-panel/lib/Utils";

export default function IdProps(group, element, translate, options) {
  let description = options && options.description;
  // Id
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
      }
    },
    validate: function (element, values) {
      let idValue = values.id;
      let bo = getBusinessObject(element);
      let idError = utils.isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : {};
    },
  });
}
