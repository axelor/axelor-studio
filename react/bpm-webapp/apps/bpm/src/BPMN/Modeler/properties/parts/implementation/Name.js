import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

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
export default function Name(element, options, translate, bpmnModeler) {
  options = options || {};
  let id = options.id || "name",
    label = options.label || translate("Name"),
    modelProperty = options.modelProperty || "name";

  const get = () => {
    const bo = getBusinessObject(element);
    if (!bo || !modelProperty) return null;
    return { [modelProperty]: bo.get(modelProperty) };
  };

  const set = function (element, values) {
    if (!bpmnModeler || !element) return;
    let elementRegistry = bpmnModeler.get("elementRegistry");
    let modeling = bpmnModeler.get("modeling");
    let shape = elementRegistry.get(element.id);
    if (!shape) return;
    if (element.businessObject) {
      element.businessObject[modelProperty] = values[modelProperty];
    } else {
      element[modelProperty] = values[modelProperty];
    }
    modeling &&
      modeling.updateProperties(shape, {
        [modelProperty]: values[modelProperty],
      });
  };

  let nameEntry = {
    id: id,
    label: label,
    modelProperty: modelProperty,
    widget: "textBox",
    get: options.get || get,
    set: options.set || set,
    description:
      "Disable 'Add translations' property or add respective language translation to change label",
  };

  return [nameEntry];
}
