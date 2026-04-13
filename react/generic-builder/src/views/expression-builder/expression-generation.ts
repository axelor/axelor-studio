/**
 * Core expression generation functions extracted from views/index.jsx.
 *
 * WARNING: Any change to string output WILL break backend integration.
 *
 * Pure utilities (getDateTimeValue, getListOfTree) live in ./expression-helpers.ts.
 * Validation (checkValidation) lives in ./expression-validation.ts.
 * Both are re-exported below for backward compatibility.
 */
import {
  MAP_OPERATOR,
  JOIN_OPERATOR,
  MAP_COMBINATOR,
  MAP_BPM_COMBINATOR,
  MANY_TO_ONE_TYPES,
  RELATIONAL_TYPES,
} from "../../common/constants";
import { isBPMQuery, lowerCaseFirstLetter, jsStringEscape } from "../../common/utils";
import { getDateTimeValue } from "./expression-helpers";

// Re-export extracted functions for backward compatibility
export { getDateTimeValue, getListOfTree } from "./expression-helpers";
export { checkValidation } from "./expression-validation";

interface Counters {
  paramCount: number;
  count: number;
}

interface BPMConditionOptions {
  parentType: string;
  withParam?: boolean;
  isCondition?: boolean;
  counters: Counters;
  setAlert?: (val: boolean) => void;
}

interface ConditionResult {
  condition: string;
  values?: unknown[];
}

interface CriteriaResult {
  condition: string;
  values: unknown[];
}

interface RuleContext {
  rule: Record<string, unknown>;
  fieldName: string;
  field: Record<string, unknown>;
  operator: string;
  type: string;
  isBPM: boolean;
  isParam: boolean;
  isJsonField: boolean | unknown;
  isNumber: boolean;
  isDateTime: boolean;
  isRelational: boolean;
  isRelatedModalSame: boolean;
  isRelatedElseModalSame: boolean;
  isObjectValue: boolean;
  prefix: string;
  jsonFieldName: Record<string, unknown>;
  nameField: string;
  fieldValue: unknown;
  fieldValue2: unknown;
  mapOperators: Record<string, string>;
  mapType: Record<string, string>;
  withParam?: boolean;
  isCondition?: boolean;
  counters: Counters;
  selectionList: unknown;
  targetName: unknown;
}

function isRelationalCustomField(
  field: Record<string, unknown>,
  parentFieldName: string | undefined,
  parentType: string,
): boolean | undefined {
  if (
    isBPMQuery(parentType) &&
    parentFieldName &&
    field &&
    field.allField &&
    (field.allField as Record<string, unknown>[]).find(
      (f: Record<string, unknown>) =>
        f.name === parentFieldName &&
        RELATIONAL_TYPES.includes(f.type as string) &&
        (f.modelField ||
          f.model === "com.axelor.meta.db.MetaJsonRecord" ||
          f.target === "com.axelor.meta.db.MetaJsonRecord"),
    )
  ) {
    return true;
  }
}

// --- DRY Helpers ---

function buildFieldPath(ctx: RuleContext, suffix: string = ""): string {
  return ctx.isJsonField
    ? `${ctx.prefix}.${ctx.jsonFieldName.modelField}.${ctx.fieldName}${suffix}`
    : `${ctx.prefix}.${ctx.fieldName}${suffix}`;
}

// --- Operator Handlers ---

function buildInCondition(ctx: RuleContext): ConditionResult {
  let value: unknown = (
    ((ctx.rule)?.fieldValue as Record<string, unknown>[]) || []
  )
    ?.map((f: Record<string, unknown>) => {
      const targetFields = f["targetName"] || f["fullName"] || f["name"];
      return targetFields ? (ctx.isNumber ? targetFields : `'${targetFields}'`) : f["id"];
    })
    .filter((f: unknown) => f !== "");

  value = ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : value;

  const nameField = ctx.selectionList ? "" : `.${ctx.targetName || "id"}`;
  return {
    condition: `${buildFieldPath(ctx, nameField)} ${ctx.mapOperators[ctx.operator]} ${
      ctx.isRelatedModalSame
        ? ctx.withParam
          ? ctx.isJsonField
            ? value
            : ctx.fieldValue
          : `(${value})`
        : `(?${ctx.counters.count})`
    }`,
    values: ctx.isRelatedModalSame
      ? undefined
      : [[ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : value]],
  };
}

function buildBetweenCondition(ctx: RuleContext): ConditionResult {
  const values =
    ctx.isRelatedModalSame && ctx.isRelatedElseModalSame
      ? undefined
      : ctx.isRelatedModalSame
        ? [ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : ctx.fieldValue2]
        : ctx.isRelatedElseModalSame
          ? [ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : ctx.fieldValue]
          : [
              ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : ctx.fieldValue,
              ctx.isParam ? (ctx.isCondition ? `?` : `:param${++ctx.counters.paramCount}`) : ctx.fieldValue2,
            ];
  if (ctx.isDateTime && ctx.isBPM) {
    return {
      condition: `${buildFieldPath(ctx)} ${ctx.operator === "notBetween" ? "NOT BETWEEN" : "BETWEEN"} ${
        ctx.isRelatedModalSame
          ? ctx.isParam
            ? ctx.isCondition
              ? `?`
              : `:param${ctx.counters.paramCount}`
            : ctx.fieldValue
          : `?${ctx.counters.count}`
      } ${ctx.mapType["and"]} ${
        ctx.isRelatedElseModalSame
          ? ctx.isParam
            ? ctx.isCondition
              ? `?`
              : `:param${++ctx.counters.paramCount}`
            : ctx.fieldValue2
          : `?${++ctx.counters.count}`
      }`,
      values,
    };
  } else {
    return {
      condition: `${ctx.operator === "notBetween" ? "NOT " : ""}${buildFieldPath(ctx)} >= ${
        ctx.isRelatedModalSame
          ? ctx.isParam
            ? ctx.isCondition
              ? `?`
              : `:param${ctx.counters.paramCount}`
            : ctx.fieldValue
          : `?${ctx.counters.count}`
      } ${ctx.mapType["and"]} ${buildFieldPath(ctx)} <= ${
        ctx.isRelatedElseModalSame
          ? ctx.isParam
            ? ctx.isCondition
              ? `?`
              : `:param${++ctx.counters.paramCount}`
            : ctx.fieldValue2
          : `?${++ctx.counters.count}`
      }`,
      values,
    };
  }
}

function buildNullCondition(ctx: RuleContext): ConditionResult {
  return {
    condition: `${buildFieldPath(ctx)} ${ctx.mapOperators[ctx.operator]}`,
  };
}

function buildBoolCondition(ctx: RuleContext): ConditionResult {
  let value: unknown = ctx.operator === "isTrue" ? true : false;

  value = ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : `${value}`;

  return {
    condition: `${buildFieldPath(ctx)} ${ctx.mapOperators[ctx.operator]} ${
      ctx.isRelatedModalSame
        ? ctx.withParam
          ? ctx.isParam
            ? ctx.isCondition
              ? `?`
              : `:param${ctx.counters.paramCount}`
            : ctx.fieldValue
          : value
        : `?${ctx.counters.count}`
    }`,
    values: ctx.isRelatedModalSame
      ? undefined
      : [ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : value],
  };
}

function buildContainsCondition(ctx: RuleContext): ConditionResult {
  const value = ctx.isObjectValue
    ? (ctx.fieldValue as Record<string, unknown>)[
        (ctx.field).targetName as string
      ]
      ? `'${jsStringEscape((ctx.fieldValue as Record<string, unknown>)[(ctx.field).targetName as string], ctx.withParam)}'`
      : `'${jsStringEscape((ctx.fieldValue as Record<string, unknown>)["name"] || "", ctx.withParam)}'`
    : ctx.fieldValue;
  return {
    condition: `${
      ctx.isRelatedModalSame
        ? ctx.withParam
          ? ctx.isParam
            ? ctx.isCondition
              ? `?`
              : `:param${ctx.counters.paramCount}`
            : ctx.fieldValue
          : value
        : `?${ctx.counters.count}`
    } ${ctx.mapOperators[ctx.operator]} ${buildFieldPath(ctx)}`,
    values: ctx.isRelatedModalSame
      ? undefined
      : [ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : value],
  };
}

function buildDefaultCondition(ctx: RuleContext): ConditionResult {
  const targetFields =
    ctx.isObjectValue &&
    ((ctx.fieldValue as Record<string, unknown>)[
      (ctx.field).targetName as string
    ] ||
      (ctx.fieldValue as Record<string, unknown>)["name"]);

  let value: unknown = ctx.isObjectValue
    ? targetFields
      ? `'${jsStringEscape(targetFields, ctx.withParam)}'`
      : (ctx.fieldValue as Record<string, unknown>)["id"]
    : ctx.fieldValue;

  value = ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : `${value}`;

  const isRelationalCustom = isRelationalCustomField(
    ctx.rule,
    ctx.nameField.split(JOIN_OPERATOR[ctx.isBPM ? "BPM" : "GROOVY"])[0],
    ctx.isBPM ? "bpmQuery" : "expressionBuilder",
  );

  const relNameField = ctx.isRelational && !ctx.rule.isRelationalValue ? `.${ctx.targetName || "id"}` : "";

  return {
    condition: `${buildFieldPath(ctx, relNameField)} ${ctx.mapOperators[ctx.operator]} ${
      ctx.isRelatedModalSame
        ? ["like", "notLike"].includes(ctx.operator) &&
          (!ctx.isJsonField || (ctx.isJsonField && !isRelationalCustom))
          ? `CONCAT('%',${
              ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : ctx.fieldValue
            },'%')`
          : ctx.withParam
            ? ctx.isJsonField
              ? value
              : ctx.isParam
                ? ctx.isCondition
                  ? `?`
                  : `:param${ctx.counters.paramCount}`
                : ctx.fieldValue
            : value
        : ["like", "notLike"].includes(ctx.operator) &&
            (!ctx.isJsonField || (ctx.isJsonField && !MANY_TO_ONE_TYPES.includes(ctx.operator)))
          ? `CONCAT('%',?${ctx.counters.count},'%')`
          : `?${ctx.counters.count}`
    }`,
    values: ctx.isRelatedModalSame
      ? undefined
      : [ctx.isParam ? (ctx.isCondition ? `?` : `:param${ctx.counters.paramCount}`) : value],
  };
}

// --- Strategy Pattern Dispatcher ---

type OperatorHandler = (ctx: RuleContext) => ConditionResult;

const OPERATOR_HANDLERS: Record<string, OperatorHandler> = {
  in: buildInCondition,
  notIn: buildInCondition,
  between: buildBetweenCondition,
  notBetween: buildBetweenCondition,
  isNull: buildNullCondition,
  isNotNull: buildNullCondition,
  isTrue: buildBoolCondition,
  isFalse: buildBoolCondition,
  contains: buildContainsCondition,
  notContains: buildContainsCondition,
};

interface RuleContextEnv {
  isBPM: boolean;
  expression: string;
  prefix: string;
  mapOperators: Record<string, string>;
  modalName: string;
  withParam?: boolean;
  isCondition?: boolean;
  counters: Counters;
  parentType: string;
}

function resolveJsonField(
  fieldName: string,
  field: Record<string, unknown>,
  allField: Record<string, unknown>[],
  expression: string,
): { isJsonField: boolean | unknown; jsonFieldName: Record<string, unknown> } {
  const { model, target, jsonField } = field || {};
  let isJsonField: boolean | unknown =
    model === "com.axelor.meta.db.MetaJsonRecord" ||
    target === "com.axelor.meta.db.MetaJsonRecord" ||
    jsonField;
  let parentCustomField: Record<string, unknown> | undefined;
  const values = fieldName && fieldName.split(JOIN_OPERATOR[expression]);
  if (values && values.length > 1) {
    const customField =
      allField &&
      allField.find((f: Record<string, unknown>) => {
        const value =
          values &&
          values.find(
            (name: string) =>
              f.name === name &&
              (f.model === "com.axelor.meta.db.MetaJsonRecord" ||
                f.target === "com.axelor.meta.db.MetaJsonRecord" ||
                f.jsonField),
          );
        return value;
      });
    if (customField) {
      isJsonField = true;
      parentCustomField = customField;
    }
  }
  const jsonFieldName = parentCustomField
    ? { ...parentCustomField, targetName: field?.targetName }
    : field;
  return { isJsonField, jsonFieldName };
}

function prepareFieldValues(
  rule: Record<string, unknown>,
  type: string,
  isNumber: boolean,
  isDateTime: boolean,
  isJsonField: boolean | unknown,
  selectionList: unknown,
  operator: string,
  fieldName: string,
  env: RuleContextEnv,
): { fieldValue: unknown; fieldValue2: unknown; earlyNull: boolean } {
  let { fieldValue, fieldValue2 } = rule;
  const { isRelationalValue } = rule;
  if (isNumber && !selectionList && !isRelationalValue) {
    if (!fieldValue) {
      fieldValue = 0;
    }
    if (["between", "notBetween"].includes(operator) && !fieldValue2) {
      fieldValue2 = 0;
    }
    if (!fieldName || fieldName === "") {
      return { fieldValue, fieldValue2, earlyNull: true };
    }
  }
  if (!isRelationalValue && !isNumber && typeof fieldValue !== "object") {
    fieldValue = `'${jsStringEscape(fieldValue, env.withParam)}'`;
    fieldValue2 = `'${jsStringEscape(fieldValue2, env.withParam)}'`;
  }
  if (isDateTime && !isRelationalValue) {
    fieldValue = getDateTimeValue(type, fieldValue, isJsonField, env.parentType);
    fieldValue2 = getDateTimeValue(type, fieldValue2, isJsonField, env.parentType);
  }
  return { fieldValue, fieldValue2, earlyNull: false };
}

function buildRuleContext(
  rule: Record<string, unknown>,
  env: RuleContextEnv,
): RuleContext | null {
  const {
    fieldName,
    field = {},
    operator,
    allField,
    isField,
  } = rule as {
    fieldName: string;
    field: Record<string, unknown>;
    operator: string;
    allField: Record<string, unknown>[];
    isField: string;
  };
  const isParam = isField === "param";
  const { targetName, selectionList } = field || {};
  const type = (field?.type as string)?.toLowerCase()?.replaceAll("-", "_");
  const isNumber = [
    "long", "integer", "decimal", "boolean", "double", "button", "menu-item",
  ].includes(type);
  const isDateTime = ["date", "time", "datetime"].includes(type);
  const isRelational = [
    "many_to_one", "json_many_to_one", "one_to_one", "json_one_to_one",
  ].includes(type);

  const { isJsonField, jsonFieldName } = resolveJsonField(
    fieldName, field, allField, env.expression,
  );

  const { relatedValueModal = {}, relatedElseValueModal = {} } = rule;
  const relatedValueModalName = lowerCaseFirstLetter(
    (relatedValueModal as Record<string, unknown>)?.name as string,
  );
  const relatedElseValueModalName = lowerCaseFirstLetter(
    (relatedElseValueModal as Record<string, unknown>)?.name as string,
  );
  const isRelatedModalSame =
    (relatedValueModalName === env.modalName && isField === "self") || !env.withParam;
  const isRelatedElseModalSame =
    (relatedElseValueModalName === env.modalName && isField === "self") || !env.withParam;

  const { fieldValue, fieldValue2, earlyNull } = prepareFieldValues(
    rule, type, isNumber, isDateTime, isJsonField, selectionList, operator, fieldName, env,
  );
  if (earlyNull) return null;

  if (!["isNotNull", "isNull"].includes(operator) && !isRelatedModalSame) {
    ++env.counters.count;
  }
  if (isParam) {
    ++env.counters.paramCount;
  }

  const mapType = env.isBPM ? MAP_BPM_COMBINATOR : MAP_COMBINATOR;
  const isObjectValue = fieldValue != null && typeof fieldValue === "object";

  return {
    rule, fieldName, field, operator, type,
    isBPM: env.isBPM, isParam, isJsonField, isNumber, isDateTime, isRelational,
    isRelatedModalSame, isRelatedElseModalSame, isObjectValue,
    prefix: env.prefix, jsonFieldName, nameField: fieldName,
    fieldValue, fieldValue2,
    mapOperators: env.mapOperators, mapType,
    withParam: env.withParam, isCondition: env.isCondition, counters: env.counters,
    selectionList, targetName,
  };
}

export function getBPMCondition(
  rules: Record<string, unknown>[],
  modalName: string,
  options: BPMConditionOptions,
): (ConditionResult | null)[] {
  const { parentType, withParam, isCondition, counters, setAlert: _setAlert } = options;
  const isBPM = isBPMQuery(parentType);
  const expression = isBPM ? "BPM" : "GROOVY";
  const env: RuleContextEnv = {
    isBPM,
    expression,
    prefix: isBPM ? "self" : modalName,
    mapOperators: MAP_OPERATOR[isBPM ? "BPM" : expression],
    modalName,
    withParam,
    isCondition,
    counters,
    parentType,
  };
  const returnValues: (ConditionResult | null)[] = [];
  for (let i = 0; i < (rules && rules.length); i++) {
    const ctx = buildRuleContext(rules[i], env);
    if (ctx === null) {
      if (_setAlert) _setAlert(true);
      returnValues.push(null);
      return returnValues;
    }
    const handler = OPERATOR_HANDLERS[ctx.operator] ?? buildDefaultCondition;
    returnValues.push(handler(ctx));
  }
  return returnValues;
}

export function getBPMCriteria(
  rule: Record<string, unknown>[],
  modalName: string,
  isChildren: boolean | undefined,
  options: BPMConditionOptions,
): CriteriaResult {
  const { parentType } = options;
  const {
    rules,
    combinator = "and",
    children,
  } = ((rule && rule[0]) as {
    rules: Record<string, unknown>[];
    combinator: string;
    children: Record<string, unknown>[];
  }) || {};
  const bpmConditions = getBPMCondition(rules, modalName, options);
  const condition = (bpmConditions && bpmConditions.filter((f) => f)) || [];
  const childrenConditions: { condition: string; values: unknown[] | undefined }[] = [];
  children &&
    children.length > 0 &&
    children.forEach((child: Record<string, unknown>) => {
      const { condition: conditions, values } =
        getBPMCriteria([child], modalName, true, options) || {};
      const newValues = Array.isArray(values) ? values.flat() : [];
      childrenConditions.push({
        condition: conditions,
        values: newValues && newValues.length > 0 ? newValues : undefined,
      });
    });
  const map_type = isBPMQuery(parentType) ? MAP_BPM_COMBINATOR : MAP_COMBINATOR;
  const c = condition && condition.map((co) => co && co.condition);
  const childConditions =
    childrenConditions &&
    (childrenConditions.map((co) => co && co.condition) || []).filter((f) => f);
  const childValues = childrenConditions && childrenConditions.filter((val) => val !== null);

  if (children.length > 0) {
    const isChild = childConditions && childConditions.length > 0;
    return {
      condition: `${isChild ? "(" : ""}${c ? c.join(" " + map_type[combinator] + " ") : ""}${
        isChild
          ? ` ${map_type[combinator]} ${childConditions.join(" " + map_type[combinator] + " ")}`
          : ""
      }${isChild ? ")" : ""}`,
      values: [
        ...((condition && condition.map((co) => co && co.values).filter((f) => f)) || []),
        ...((childValues && childValues.map((co) => co && co.values).filter((f) => f)) || []),
      ],
    };
  } else if (isChildren && condition && c && c.length !== 0) {
    return {
      condition: `(${c.join(" " + map_type[combinator] + " ")})`,
      values: condition && condition.map((co) => co && co.values).filter((f) => f),
    };
  } else {
    return {
      condition: c.join(" " + map_type[combinator] + " "),
      values: condition && condition.map((co) => co && co.values).filter((f) => f),
    };
  }
}
