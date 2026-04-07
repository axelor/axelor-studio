/**
 * Expression generation orchestration extracted from views/index.jsx.
 */
import { MAP_BPM_COMBINATOR } from "../../common/constants";
import { isBPMQuery, lowerCaseFirstLetter } from "../../common/utils";
import { saveRecord } from "../../services/data-service";
import { generateGroovyExpression } from "../../services/expression-service";

import { getBPMCriteria, getListOfTree, checkValidation } from "./expression-generation";

interface SaveOptions {
  model?: string;
  record?: Record<string, unknown> | null;
  resultField?: string;
  resultMetaField?: string;
  onSave?: (expr: unknown, values: unknown) => void;
}

async function save(
  expr: unknown,
  expressionValues: unknown,
  { model, record, resultField, resultMetaField, onSave }: SaveOptions,
) {
  if (onSave) {
    onSave(expr, expressionValues);
  }
  if (!model) return;
  await saveRecord(model, {
    ...(record || {}),
    [resultField || ""]: expr && (expr as string).trim(),
    [resultMetaField || ""]: expressionValues ? JSON.stringify(expressionValues) : expressionValues,
  });
  const closeElementArray =
    window.top && window.top.document && window.top.document.getElementsByClassName("button-close");
  const closeElement = closeElementArray && closeElementArray[closeElementArray.length - 1];
  closeElement && (closeElement as HTMLElement).click && (closeElement as HTMLElement).click();
}

interface GenerateExpressionParams {
  combinator: string;
  parentType: string;
  expressionComponents: Record<string, unknown>[];
  isBPMN: boolean;
  isCreateObject: boolean;
  singleResult: boolean;
  generateWithId: boolean;
  isPackage?: boolean;
  isCondition?: boolean;
  withParam?: boolean;
  queryModel?: string;
  counters: { paramCount: number; count: number };
  setAlert: (val: boolean) => void;
  model?: string;
  record?: Record<string, unknown> | null;
  resultField?: string;
  resultMetaField?: string;
  onSave?: (expr: unknown, values: unknown) => void;
  setProperty?: (val: Record<string, unknown>) => void;
  close?: () => void;
}

export async function generateExpression({
  combinator,
  parentType,
  expressionComponents,
  isBPMN,
  isCreateObject,
  singleResult,
  generateWithId,
  isPackage,
  isCondition,
  withParam,
  queryModel,
  counters,
  setAlert,
  model: saveModel,
  record,
  resultField,
  resultMetaField,
  onSave,
  setProperty,
  close,
}: GenerateExpressionParams) {
  const expressionValues: Record<string, unknown>[] = [];
  let model: string | undefined;
  const vals: unknown[] = [];
  const expressions: string[] = [];
  const isValid = checkValidation(expressionComponents, { isPackage, isCondition });
  if (!isValid) {
    setAlert(true);
    return;
  }
  for (let i = 0; i < expressionComponents.length; i++) {
    const component = expressionComponents[i];
    const { value } = component;
    const { rules, metaModals } = (value as Record<string, unknown>) || {};
    const metaModalsObj = metaModals as Record<string, unknown>;
    const modalName =
      metaModalsObj && metaModalsObj.type === "dmnModel"
        ? (metaModalsObj.resultVariable as string)
        : metaModalsObj && (metaModalsObj.name as string);
    const { fullName, type: modelType } = metaModalsObj || {};
    model = isBPMN
      ? modalName
      : isBPMQuery(parentType)
        ? modelType === "metaJsonModel"
          ? modalName
          : (fullName as string)
        : modalName;
    let str = "";
    const listOfTree = getListOfTree(rules as Record<string, unknown>[]);
    const criteria = getBPMCriteria(listOfTree, lowerCaseFirstLetter(modalName) || "", undefined, {
      parentType,
      withParam,
      isCondition,
      counters,
      setAlert,
    });
    vals.push(
      ...((criteria && ((criteria.values || []).filter((f) => Array.isArray(f)) || [])) || []),
    );
    if (metaModals || isPackage) {
      str += criteria && criteria.condition;
    } else {
      break;
    }
    const expressionValue = {
      metaModalName: modalName,
      metaModalType: metaModalsObj && metaModalsObj.type,
      rules,
    };
    expressionValues.push(expressionValue);
    expressions.push(`${str}`);
  }
  let expr: unknown;
  if (!isBPMQuery(parentType)) {
    expr = await generateGroovyExpression({
      combinator,
      values: expressionValues,
      isBPMN,
      generateWithId,
    });
  } else {
    const map_type = MAP_BPM_COMBINATOR;
    const str = (expressions.filter((e) => e !== "") || [])
      .map((e) => (expressions.length > 1 ? `(${e})` : e))
      .join(" " + map_type[combinator] + " ");

    expr = str;

    const {
      value: {
        metaModals: { type },
      },
    } = (expressionComponents[0] || {}) as { value: { metaModals: { type: string } } };
    let valueParameters = "";
    vals &&
      vals.forEach((v) => {
        if (Array.isArray(v) && Array.isArray(v[0]) && v[0]) {
          valueParameters =
            valueParameters +
            `, ${type === "metaModel" ? `[${v[0]}]` : `(${v[0]})`}`;
        } else {
          let vVal: unknown = v;
          if (Array.isArray(vVal) && vVal.length > 0) {
            vVal = vVal.join(", ");
          }
          valueParameters = valueParameters + ", " + vVal;
        }
      });

    const showBracket = !queryModel || withParam;
    const exp = str
      ? `${showBracket ? "(" : ""}${
          !queryModel ? `${withParam ? `"${model}"` : `${model}`}, ` : ""
        }${withParam ? `"${str}"` : `${str}`}${
          vals && vals.length > 0 ? `${valueParameters}` : ``
        }${showBracket ? ")" : ""}`
      : null;
    const expBPMN = str
      ? `return ${isCreateObject ? `__ctx__.createObject(` : ""}__ctx__.${
          singleResult ? "filterOne" : "filter"
        }("${model}","${str}"${
          vals && vals.length > 0 ? `${valueParameters}` : ``
        })${isCreateObject ? ")" : ""}`
      : undefined;
    expr = isBPMN ? expBPMN : exp;
  }
  counters.paramCount = 0;
  counters.count = 0;
  save(
    expr,
    expr
      ? {
          values: expressionValues,
          combinator,
        }
      : null,
    { model: saveModel, record, resultField, resultMetaField, onSave },
  );
  const checked: boolean | null =
    !expr || expr === "undefined" || expressionValues?.length === 0
      ? null
      : isBPMQuery(parentType)
        ? singleResult
        : generateWithId;
  setProperty &&
    setProperty({
      expression: expr,
      value:
        expressionValues && expressionValues.length > 0
          ? JSON.stringify(expressionValues)
          : undefined,
      checked: checked,

      combinator: combinator,
    });
  close && close();
}
