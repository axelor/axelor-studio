import { getBusinessObject } from "dmn-js-shared/lib/util/ModelUtil";

/**
 * Create an entry to modify the name of an an element.
 *
 * @param  {djs.model.Base} element
 * @param  {Object} options
 * @param  {string} options.id the id of the entry
 * @param  {string} options.label the label of the entry
 *
 * @return {Array<Object>} return an array containing
 *                         the entry to modify the name
 */
export default function Name(element, translate, dmnModeler) {
  const get = function () {
    let bo = getBusinessObject(element);
    return { name: bo.get(["name"]) };
  };

  const set = function (element, values) {
    if (element.businessObject) {
      element.businessObject["name"] = values["name"];
    } else {
      element["name"] = values["name"];
    }
    const modeling = dmnModeler._viewers.drd.get("modeling");
    const elementRegistry = dmnModeler._viewers.drd.get("elementRegistry");
    let shape = elementRegistry.get(element.id);
    if (!shape) return;
    modeling &&
      modeling.updateProperties(shape, {
        name: values["name"],
      });
  };

  let nameEntry = {
    id: "name",
    label: translate("Name"),
    modelProperty: "name",
    widget: "textBox",
    get: get,
    set: set,
  };

  return [nameEntry];
}
