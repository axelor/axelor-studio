/**
 * Test fixtures for characterization tests of expression generation functions.
 *
 * These fixtures exercise all 14 operator branches of getBPMCondition,
 * covering string, number, date, datetime, relational, json/custom, and enum/selection field types,
 * plus isField modes: none (literal), self, context, param.
 *
 * IMPORTANT: The expected output values in the characterization tests are captured from
 * the ACTUAL function output. Do not "correct" them -- they represent current behavior.
 */

// ============================================================
// Helper: create a rule object for getBPMCondition
// ============================================================
export function makeRule(overrides = {}) {
  return {
    fieldName: "name",
    field: {
      type: "string",
      targetName: null,
      selectionList: null,
      model: null,
      target: null,
      jsonField: null,
    },
    operator: "=",
    fieldValue: "test",
    fieldValue2: undefined,
    isField: "none",
    allField: [],
    isRelationalValue: undefined,
    relatedValueModal: {},
    relatedElseValueModal: {},
    ...overrides,
  };
}

// ============================================================
// Default options for _getBPMCondition (BPM query mode, no withParam)
// ============================================================
export function makeOptions(overrides = {}) {
  return {
    parentType: "bpmQuery",
    withParam: false,
    isCondition: false,
    counters: { paramCount: 0, count: 0 },
    setAlert: () => {},
    ...overrides,
  };
}

// ============================================================
// Operator fixtures: one fixture per operator branch
// ============================================================

// --- EQUALS (=) on string field ---
export const equalsStringRule = makeRule({
  fieldName: "name",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "=",
  fieldValue: "test",
});

// --- NOT EQUALS (!=) on string field ---
export const notEqualsStringRule = makeRule({
  fieldName: "name",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "!=",
  fieldValue: "hello",
});

// --- IN on relational (many-to-one) field ---
export const inRelationalRule = makeRule({
  fieldName: "partner",
  field: { type: "many-to-one", targetName: "fullName", selectionList: null },
  operator: "in",
  fieldValue: [
    { targetName: undefined, fullName: undefined, name: "Partner1", id: 1 },
    { targetName: undefined, fullName: undefined, name: "Partner2", id: 2 },
  ],
});

// --- NOT IN on relational field ---
export const notInRelationalRule = makeRule({
  fieldName: "partner",
  field: { type: "many-to-one", targetName: "fullName", selectionList: null },
  operator: "notIn",
  fieldValue: [{ name: "PartnerA", id: 10 }],
});

// --- BETWEEN on integer field ---
export const betweenIntegerRule = makeRule({
  fieldName: "amount",
  field: { type: "integer", targetName: null, selectionList: null },
  operator: "between",
  fieldValue: 100,
  fieldValue2: 500,
});

// --- NOT BETWEEN on integer field ---
export const notBetweenIntegerRule = makeRule({
  fieldName: "amount",
  field: { type: "integer", targetName: null, selectionList: null },
  operator: "notBetween",
  fieldValue: 10,
  fieldValue2: 99,
});

// --- IS NULL ---
export const isNullRule = makeRule({
  fieldName: "description",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "isNull",
  fieldValue: undefined,
});

// --- IS NOT NULL ---
export const isNotNullRule = makeRule({
  fieldName: "description",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "isNotNull",
  fieldValue: undefined,
});

// --- IS TRUE on boolean field ---
export const isTrueRule = makeRule({
  fieldName: "active",
  field: { type: "boolean", targetName: null, selectionList: null },
  operator: "isTrue",
  fieldValue: undefined,
});

// --- IS FALSE on boolean field ---
export const isFalseRule = makeRule({
  fieldName: "active",
  field: { type: "boolean", targetName: null, selectionList: null },
  operator: "isFalse",
  fieldValue: undefined,
});

// --- LIKE on string field ---
export const likeStringRule = makeRule({
  fieldName: "name",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "like",
  fieldValue: "test",
});

// --- NOT LIKE on string field ---
export const notLikeStringRule = makeRule({
  fieldName: "name",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "notLike",
  fieldValue: "test",
});

// --- CONTAINS on many-to-many field ---
export const containsRule = makeRule({
  fieldName: "tags",
  field: { type: "many-to-many", targetName: "name", selectionList: null },
  operator: "contains",
  fieldValue: { name: "TagA" },
});

// --- NOT CONTAINS on many-to-many field ---
export const notContainsRule = makeRule({
  fieldName: "tags",
  field: { type: "many-to-many", targetName: "name", selectionList: null },
  operator: "notContains",
  fieldValue: { name: "TagB" },
});

// ============================================================
// Field type fixtures (non-string types)
// ============================================================

// --- Number (long) with equals ---
export const equalsLongRule = makeRule({
  fieldName: "sequence",
  field: { type: "long", targetName: null, selectionList: null },
  operator: "=",
  fieldValue: 42,
});

// --- Date field with equals ---
export const equalsDateRule = makeRule({
  fieldName: "startDate",
  field: { type: "date", targetName: null, selectionList: null },
  operator: "=",
  fieldValue: "15/03/2026",
});

// --- DateTime field with equals ---
export const equalsDateTimeRule = makeRule({
  fieldName: "createdOn",
  field: { type: "datetime", targetName: null, selectionList: null },
  operator: "=",
  fieldValue: "15/03/2026 10:30",
});

// --- Relational (many-to-one) with equals ---
export const equalsManyToOneRule = makeRule({
  fieldName: "company",
  field: { type: "many-to-one", targetName: "name", selectionList: null },
  operator: "=",
  fieldValue: { name: "Axelor" },
});

// --- Selection/enum field with equals ---
export const equalsSelectionRule = makeRule({
  fieldName: "statusSelect",
  field: { type: "integer", targetName: null, selectionList: [{ value: "1" }, { value: "2" }] },
  operator: "=",
  fieldValue: { name: "1" },
});

// --- JSON/Custom field ---
export const equalsJsonFieldRule = makeRule({
  fieldName: "customField.name",
  field: {
    type: "string",
    targetName: null,
    selectionList: null,
    model: "com.axelor.meta.db.MetaJsonRecord",
    jsonField: null,
  },
  operator: "=",
  fieldValue: "customValue",
});

// ============================================================
// isField mode fixtures
// ============================================================

// --- Param mode ---
export const paramModeRule = makeRule({
  fieldName: "name",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "=",
  fieldValue: "ignored",
  isField: "param",
});

// --- Self mode (same model) ---
export const selfModeRule = makeRule({
  fieldName: "name",
  field: { type: "string", targetName: null, selectionList: null },
  operator: "=",
  fieldValue: "selfVal",
  isField: "self",
  relatedValueModal: { name: "Account" },
});

// ============================================================
// BETWEEN on date (BPM query) -- uses BETWEEN syntax
// ============================================================
export const betweenDateBpmRule = makeRule({
  fieldName: "startDate",
  field: { type: "date", targetName: null, selectionList: null },
  operator: "between",
  fieldValue: "01/01/2026",
  fieldValue2: "31/12/2026",
});

// ============================================================
// getListOfTree fixtures
// ============================================================
export const flatRuleList = [
  { id: 0, parentId: -1, combinator: "and", rules: [{ fieldName: "name", operator: "=" }] },
  { id: 1, parentId: 0, combinator: "or", rules: [{ fieldName: "code", operator: "!=" }] },
  { id: 2, parentId: -1, combinator: "and", rules: [{ fieldName: "status", operator: "isNull" }] },
];

// ============================================================
// checkValidation fixtures
// ============================================================
export const validExpressionComponents = [
  {
    value: {
      metaModals: { name: "Account", type: "metaModel" },
      rules: [
        {
          id: 0,
          parentId: -1,
          combinator: "and",
          rules: [
            {
              fieldName: "name",
              field: { type: "string" },
              operator: "=",
              fieldValue: "test",
            },
          ],
        },
      ],
    },
  },
];

export const invalidExpressionComponents_noFieldName = [
  {
    value: {
      metaModals: { name: "Account", type: "metaModel" },
      rules: [
        {
          id: 0,
          parentId: -1,
          combinator: "and",
          rules: [
            {
              fieldName: "",
              field: { type: "string" },
              operator: "=",
              fieldValue: "test",
            },
          ],
        },
      ],
    },
  },
];

export const invalidExpressionComponents_noValue = [
  {
    value: {
      metaModals: { name: "Account", type: "metaModel" },
      rules: [
        {
          id: 0,
          parentId: -1,
          combinator: "and",
          rules: [
            {
              fieldName: "name",
              field: { type: "string" },
              operator: "=",
              fieldValue: "",
            },
          ],
        },
      ],
    },
  },
];
