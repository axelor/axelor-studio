import { is } from "../../util/ModelUtil";

function getLabelAttr(semantic) {
  if (
    is(semantic, "bpmn:FlowElement") ||
    is(semantic, "bpmn:Participant") ||
    is(semantic, "bpmn:Lane") ||
    is(semantic, "bpmn:SequenceFlow") ||
    is(semantic, "bpmn:MessageFlow") ||
    is(semantic, "bpmn:DataInput") ||
    is(semantic, "bpmn:DataOutput")
  ) {
    return "name";
  }

  if (is(semantic, "bpmn:TextAnnotation")) {
    return "text";
  }

  if (is(semantic, "bpmn:Group")) {
    return "categoryValueRef";
  }
}

function getCategoryValue(semantic) {
  let categoryValueRef = semantic["categoryValueRef"];

  if (!categoryValueRef) {
    return "";
  }

  return categoryValueRef.value || "";
}

export function getLabel(element) {
  let semantic = element.businessObject,
    attr = getLabelAttr(semantic);

  if (attr) {
    if (attr === "categoryValueRef") {
      return getCategoryValue(semantic);
    }

    return semantic[attr] || "";
  }
}

export function setLabel(element, text, isExternal) {
  let semantic = element.businessObject,
    attr = getLabelAttr(semantic);

  if (attr) {
    if (attr === "categoryValueRef") {
      semantic["categoryValueRef"].value = text;
    } else {
      semantic[attr] = text;
    }
  }

  return element;
}
