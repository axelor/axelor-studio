import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

import { getBool } from "../../../../../utils";

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

  const get = function () {
    let bo = getBusinessObject(element);
    return { [modelProperty]: bo && bo.get([modelProperty]) };
  };

  const set = function (element, values, readOnly, translations) {
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
    if (!values[modelProperty]) {
      modeling &&
        modeling.updateProperties(shape, { [modelProperty]: undefined });
      return;
    }
    let originalValue = `value:${values[modelProperty]}`;
    let translatedValue = translate(`value:${values[modelProperty]}`);
    let bo = getBusinessObject(element);
    const isTranslation =
      (bo && bo.$attrs && bo.$attrs["camunda:isTranslations"]) || false;
    const isTranslated = getBool(isTranslation);
    let value =
      (translations && translations.length === 0) || !isTranslated
        ? values[modelProperty]
        : !readOnly
        ? values[modelProperty]
        : translatedValue === originalValue
        ? values[modelProperty]
        : translatedValue;
    modeling &&
      modeling.updateProperties(shape, {
        [modelProperty]: value,
      });
  };

  let nameEntry = {
    id: id,
    label: label,
    modelProperty: modelProperty,
    widget: "textBox",
    get: options.get || get,
    set: options.set || set,
  };

  return [nameEntry];
}
