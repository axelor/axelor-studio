/**
 * Validation logic extracted from expression-generation.ts.
 *
 * checkValidation: validates expression components before generation.
 */
import { flattenDeep, isEmpty } from "lodash";

interface ValidationOptions {
  isPackage?: boolean;
  isCondition?: boolean;
}

export function checkValidation(
  expressionComponents: Record<string, unknown>[],
  options: ValidationOptions,
): boolean {
  const { isPackage, isCondition } = options;
  let isValid = true;
  const nodes: unknown[] = [];
  for (let i = 0; i < (expressionComponents && expressionComponents.length); i++) {
    const component = expressionComponents[i];
    const { value } = component;
    const { rules, metaModals } = (value as Record<string, unknown>) || {};
    if (!metaModals && !isPackage) {
      return isValid;
    }
    nodes.push(rules);
  }
  const parentNodes = flattenDeep(nodes || []) as Record<string, unknown>[];
  const rules = parentNodes && parentNodes.map((n) => n.rules);
  const allRules = flattenDeep(rules || []) as Record<string, unknown>[];
  for (let i = 0; i < (allRules && allRules.length); i++) {
    const rule = allRules && allRules[i];
    const { fieldName: propFieldName, field = {}, operator } = rule || {};
    const { selectionList } = (field as Record<string, unknown>) || {};
    const type =
      field &&
      (field as Record<string, unknown>).type &&
      ((field as Record<string, unknown>).type as string).toLowerCase();
    const isNumber = [
      "long",
      "integer",
      "decimal",
      "boolean",
      "button",
      "menu-item",
      "double",
    ].includes(type as string);
    let { fieldValue, fieldValue2 } = rule;
    const { isRelationalValue, isField } = rule;
    const fieldName = propFieldName;
    if (isNumber && !selectionList && !isRelationalValue) {
      if (!fieldValue && fieldValue !== false) {
        fieldValue = 0;
      }
      if (["between", "notBetween"].includes(operator as string) && !fieldValue2) {
        fieldValue2 = 0;
      }
    }
    const fValue = isNaN(fieldValue as number) ? fieldValue : `${fieldValue}`;
    if (!fieldName) {
      isValid = false;
      break;
    }
    if (isEmpty(fValue)) {
      if (!["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator as string)) {
        isValid = false;
        break;
      }
    }
    if (
      operator === "" ||
      (selectionList &&
        !fieldValue &&
        !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator as string)) ||
      (isNumber && isRelationalValue && !fieldValue) ||
      (((!isNumber && !fieldValue) ||
        (fieldValue && Array.isArray(fieldValue) && fieldValue.length <= 0) ||
        (((!isNumber && !fieldValue2) ||
          (fieldValue2 && Array.isArray(fieldValue2) && fieldValue2.length <= 0)) &&
          ["between", "notBetween"].includes(operator as string))) &&
        !["isNull", "isNotNull", "isTrue", "isFalse"].includes(operator as string))
    ) {
      if (!isCondition && isField === "param") {
        isValid = true;
      } else {
        isValid = false;
        break;
      }
    }
  }
  return isValid;
}
