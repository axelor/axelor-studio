/**
 * Data loading hook for ExpressionBuilder.
 */
import React, { useEffect } from "react";

import { isBPMQuery } from "../../common/utils";
import { getRecord } from "../../services/data-service";
import { getModels } from "../../services/model-service";
import type { ExpressionComponent } from "../../stores/useExpressionStore";

interface UseExpressionDataParams {
  queryModel?: string;
  parentType: string;
  isPackage?: boolean;
  exprVal?: Record<string, unknown>;
  getExpression?: () => Record<string, unknown>;
  model?: string;
  id?: string | number;
  resultMetaField?: string;
  setExpressionComponents: (
    v: ExpressionComponent[] | ((draft: ExpressionComponent[]) => void),
  ) => void;
  setCombinator: (val: string) => void;
  setDefaultExpressionValue: (val: unknown) => void;
  setRecord: (val: Record<string, unknown> | null) => void;
  setSingleResult: (val: boolean) => void;
  setGenerateWithId: (val: boolean) => void;
}

export function useExpressionData({
  queryModel,
  parentType,
  isPackage,
  exprVal,
  getExpression,
  model,
  id,
  resultMetaField,
  setExpressionComponents,
  setCombinator,
  setDefaultExpressionValue,
  setRecord,
  setSingleResult,
  setGenerateWithId,
}: UseExpressionDataParams) {
  const setQueryModel = React.useCallback(async () => {
    if (!queryModel || !isBPMQuery(parentType)) return;
    const expressionComponents: ExpressionComponent[] = [];
    const modelName = queryModel.split(".") || [];
    const length = modelName.length;
    const criteria = {
      criteria: [
        {
          fieldName: "name",
          operator: "=",
          value: length > 1 ? modelName[length - 1] : queryModel,
        },
      ],
      operator: "and",
    };
    const metaModels = await getModels(criteria, length > 1 ? "metaModel" : "metaJsonModel");
    if (!metaModels) return;
    const value = {
      metaModals: metaModels?.[0] ?? null,
      rules: [
        {
          id: 0,
          parentId: -1,
          combinator: "and",
          rules: [{}],
        },
      ],
    };
    expressionComponents.push({
      value,
    });
    setDefaultExpressionValue(value);
    setExpressionComponents(expressionComponents);
  }, [queryModel, parentType, setDefaultExpressionValue, setExpressionComponents]);

  const setData = React.useCallback(
    async (resultMetaFieldValues: Record<string, unknown>) => {
      const { values, combinator } = resultMetaFieldValues || {};
      const expressionComponents: ExpressionComponent[] = [];
      const valuesArr = Array.isArray(values) ? (values as Record<string, unknown>[]) : [];
      if (valuesArr.length === 0) {
        await setQueryModel();
        return;
      }
      for (let i = 0; i < valuesArr.length; i++) {
        const element = valuesArr[i];
        const { metaModalName, metaModalType } = element;
        if (!metaModalName && !isPackage) return;
        const criteria = {
          criteria: [
            {
              fieldName: "name",
              operator: "=",
              value: metaModalName,
            },
          ],
          operator: "and",
        };
        const metaModels = await getModels(criteria, metaModalType as string);
        if (!metaModels && !isPackage) return;
        const value = {
          metaModals: metaModels?.[0] ?? null,
          rules: element.rules,
        };
        expressionComponents.push({
          value,
        });
      }
      setExpressionComponents(expressionComponents);
      setCombinator((combinator as string) || "and");
    },
    [isPackage, setQueryModel, setExpressionComponents, setCombinator],
  );

  useEffect(() => {
    if (exprVal) {
      setData(exprVal);
    }
    if (getExpression) {
      const { checked, ...restObj } = getExpression();
      setData(restObj);
      if (isBPMQuery(parentType)) {
        setSingleResult(checked as boolean);
      } else {
        setGenerateWithId(checked as boolean);
      }
    }
  }, [exprVal, setData, getExpression, parentType, setSingleResult, setGenerateWithId]);

  useEffect(() => {
    async function fetchValue() {
      if (!model || !id) {
        await setQueryModel();
        return;
      }
      const record = await getRecord(model, id);
      setRecord(record as Record<string, unknown> | null);
      if (!record) {
        await setQueryModel();
        return;
      }
      const resultMetaFieldValues =
        record && (record as Record<string, unknown>)[resultMetaField || ""];
      setData(JSON.parse((resultMetaFieldValues as string) || "{}"));
    }
    fetchValue();
  }, [resultMetaField, id, model, setQueryModel, setData, setRecord]);
}
