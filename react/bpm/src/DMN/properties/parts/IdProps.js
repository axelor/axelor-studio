import { getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";
import { isIdValid } from "dmn-js-properties-panel/lib/Utils.js";

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
      if (idValue === "__implicitroot") return;
      let bo = getBusinessObject(element);
      let idError = isIdValid(bo, idValue, translate);
      return idError ? { id: idError } : {};
    },
  });
}
