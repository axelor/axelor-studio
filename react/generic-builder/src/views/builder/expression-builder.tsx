import React from "react";
import classNames from "classnames";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import Editor from "../editor/Editor";
import { Selection, Tooltip } from "../../components";
import { getButtons, getMetaFields, getPackageFields } from "../../services/field-service";
import { getModelFilter, useMetaModelSearch } from "../utils";
import { isBPMQuery, translate } from "../../common/utils";
import { ALLOWED_TYPES } from "../../common/constants";

import styles from "./expression-builder.module.css";

let id = 1;

const defaultRules = {
  id,
  parentId: -1,
  combinator: "and",
  rules: [{}],
};

const defaultState = {
  rules: [defaultRules],
};

interface ExpressionBuilderProps {
  index: number;
  value: Record<string, unknown> | undefined;
  onChange: (value: unknown, index: number) => void;
  element: unknown;
  type?: string;
  queryModel?: string;
  isCondition?: boolean;
  isPackage?: boolean;
  isParameterShow?: boolean;
  defaultModel?: Record<string, unknown>;
  fetchModels?: (filter: unknown) => Promise<Record<string, unknown>[]>;
  isAllowButtons?: boolean;
  isBPMN?: boolean;
  isMapper?: boolean;
}

function ExpressionBuilder(props: ExpressionBuilderProps) {
  const {
    index,
    value,
    onChange,
    element,
    type,
    queryModel,
    isCondition,
    isPackage = false,
    isParameterShow,
    defaultModel,
    fetchModels,
    isAllowButtons = false,
    isBPMN,
    isMapper,
  } = props;
  const { metaModals, rules } = (value as Record<string, unknown>) || defaultState;
  const expression = "GROOVY";

  const update = React.useCallback(
    (updater: (draft: Record<string, unknown>) => void) => {
      onChange(updater, index);
    },
    [onChange, index],
  );

  const setMetaModal = (metaModals: unknown) => {
    update((draft) => {
      draft.metaModals = metaModals;
      draft.rules = [defaultRules];
    });
  };

  const setRules = React.useCallback(
    (cb: (rules: Record<string, unknown>[]) => void) =>
      update((draft) => cb(draft.rules as Record<string, unknown>[])),
    [update],
  );

  const handleGroupAdd = React.useCallback(
    function handleGroupAdd(parentId: number) {
      setRules((rules) => {
        rules.push({
          id: (id = (rules ? rules.length : id) + 1),
          parentId,
          combinator: "and",
          rules: [{ ...(defaultRules || {}), id, parentId }],
        });
      });
    },
    [setRules],
  );

  const handleGroupRemove = React.useCallback(
    function handleGroupRemove(id: number) {
      setRules((rules) => {
        const index = rules.findIndex((r: Record<string, unknown>) => r?.id === id);
        if (index < 0) return;
        rules.splice(index, 1);
      });
    },
    [setRules],
  );

  const handleRuleAdd = React.useCallback(
    function handleRuleAdd(editorId: number, rule: Record<string, unknown> = {}) {
      setRules((draft) => {
        const editorIndex = draft.findIndex((i: Record<string, unknown>) => i?.id === editorId);
        if (editorIndex < 0) return;
        (draft[editorIndex].rules as Record<string, unknown>[]).push(rule);
      });
    },
    [setRules],
  );

  const handleRuleRemove = React.useCallback(
    function handleRuleRemove(editorId: unknown, index: number) {
      setRules((draft) => {
        const editorIndex = draft.findIndex((i: Record<string, unknown>) => i?.id === editorId);
        if (editorIndex < 0) return;
        (draft[editorIndex].rules as Record<string, unknown>[]).splice(index, 1);
      });
    },
    [setRules],
  );

  const handleEditorChange = React.useCallback(
    function handleEditorChange(
      { name, value, values }: Record<string, unknown>,
      editor: Record<string, unknown>,
      index?: number,
    ) {
      // editor is optional in the widget chain (RenderWidget → RenderRelationalWidget)
      // but required here to locate the rule group. Skip when absent
      // (happens when widget is used outside expression-builder context).
      // Note: editor.id can be 0 (first rule group) — never use truthiness check on id.
      if (editor == null || editor.id == null) return;
      setRules((draft) => {
        const editorIndex = draft.findIndex((i: Record<string, unknown>) => i?.id === editor.id);
        if (editorIndex < 0) return;
        if (
          draft[editorIndex] &&
          (draft[editorIndex].rules as Record<string, unknown>[])[index as number]
        ) {
          const apply = (values: Record<string, unknown>) => {
            Object.keys(values).forEach((key) => {
              (draft[editorIndex].rules as Record<string, unknown>[])[index as number][key] =
                values[key];
            });
          };
          apply({
            ...(values ? (values as Record<string, unknown>) : {}),
            ...(name ? { [name as string]: value } : {}),
            ...(["fieldName", "operator"].includes(name as string)
              ? {
                  ...(name === "fieldName" ? { operator: "" } : {}),
                  fieldValue: null,
                  fieldValue2: null,
                  isRelationalValue: null,
                  relatedValueFieldName: null,
                  relatedValueModal: null,
                }
              : {}),
          });
        } else {
          (draft[editorIndex])[name as string] = value;
        }
      });
    },
    [setRules],
  );

  const fetchMetaModels = useMetaModelSearch(
    element,
    isBPMQuery(type) || isMapper ? null : "metaModel",
  );

  const fetchField = React.useCallback(async () => {
    const isQuery = isBPMQuery(type);
    if (isPackage && isQuery && queryModel) {
      const { fields } = ((await getPackageFields(queryModel)) || {}) as {
        fields?: Record<string, unknown>[];
      };
      return (
        (fields &&
          fields.filter((a: Record<string, unknown>) => {
            return (
              ALLOWED_TYPES.includes(((a.type as string) || "").toLowerCase()) &&
              (isQuery ? !a.json : true)
            );
          })) ||
        []
      );
    }
    let allFields = (await getMetaFields(metaModals as Record<string, unknown>, isQuery)) || [];
    if (metaModals && isAllowButtons) {
      const metaModalsObj = metaModals as Record<string, unknown>;
      const buttons = await getButtons([
        {
          model: metaModalsObj.name as string,
          type: metaModalsObj.type as string,
          modelFullName: `${metaModalsObj.packageName}.${metaModalsObj.name}`,
        },
      ]);
      allFields = [...(allFields || []), ...(buttons || [])];
    }

    return allFields.filter((a: Record<string, unknown>) => {
      return (
        (isAllowButtons ? [...ALLOWED_TYPES, "button", "menu-item"] : ALLOWED_TYPES).includes(
          ((a.type as string) || "").toLowerCase(),
        ) &&
        (isQuery ? !a.json : true) &&
        a.name
      );
    });
  }, [type, isPackage, queryModel, metaModals, isAllowButtons]);

  React.useEffect(() => {
    update((draft) => {
      if (((draft.rules as Record<string, unknown>[]) || []).length === 0) {
        draft.rules = [defaultRules];
      }
    });
  }, [update]);

  React.useEffect(() => {
    if (!defaultModel) return;
    update((draft) => {
      draft.metaModals = defaultModel;
    });
  }, [defaultModel, update]);

  const getChildEditors = (parentId: number) =>
    (rules as Record<string, unknown>[]) &&
    (rules as Record<string, unknown>[]).filter(
      (editor: Record<string, unknown>) => editor.parentId === parentId,
    );

  const fetchAPI = React.useCallback(
    async (e: { search?: string }) => {
      let data: Record<string, unknown>[] = [];
      if (fetchModels && !isBPMQuery(type)) {
        data = await fetchModels(getModelFilter(element, e));
      } else {
        data = await fetchMetaModels(e);
      }
      return data;
    },
    [fetchModels, type, fetchMetaModels, element],
  );

  return (
    <div className={styles.container}>
      <Box border={true} className={styles.paper}>
        <div className={styles.content}>
          <div className={styles.flex}>
            {(isBPMQuery(type) ? (index === 0 ? true : false) : true) && (
              <Box d="flex" alignItems="center">
                <Selection
                  name="metaModal"
                  title="Meta model"
                  placeholder="Meta model"
                  fetchAPI={fetchAPI}
                  className={classNames({
                    [styles.hide]: (isCondition && isBPMQuery(type)) || isPackage,
                  })}
                  optionLabelKey="name"
                  onChange={setMetaModal}
                  value={metaModals}
                  classes={{ root: styles.MuiAutocompleteRoot }}
                  readOnly={
                    (queryModel && isBPMQuery(type)) || (isBPMN && defaultModel) ? true : false
                  }
                />
                {type === "expressionBuilder" && (
                  <Box className={styles.info}>
                    <Tooltip
                      title={translate(
                        "If you select a MetaModel not configured in the process parameters, ensure a variable with the MetaModel's name has been defined prior to executing this script.",
                      )}
                      className={styles.tooltip}
                    >
                      <MaterialIcon icon="info" color="primary" fontSize="1rem" />
                    </Tooltip>
                  </Box>
                )}
              </Box>
            )}
          </div>
        </div>

        {(
          ((rules as Record<string, unknown>[]) &&
            (rules as Record<string, unknown>[]).filter(
              (e: Record<string, unknown>) => e.parentId === -1,
            )) ||
          []
        ).map((editor: Record<string, unknown>) => (
          <Editor
            key={editor.id as number}
            type={type}
            element={element}
            expression={expression}
            editor={
              editor as {
                id: number;
                rules?: Record<string, unknown>[];
                combinator?: string;
                parentId?: number;
              }
            }
            isBPMN={isBPMN}
            isMapper={isMapper}
            onChange={handleEditorChange}
            getChildEditors={
              getChildEditors as (id: number) => {
                id: number;
                rules?: Record<string, unknown>[];
                combinator?: string;
                parentId?: number;
                [key: string]: unknown;
              }[]
            }
            getMetaFields={fetchField}
            isDisable={!Boolean(metaModals) && !isPackage}
            isCondition={isCondition}
            parentMetaModal={metaModals as Record<string, unknown>}
            onAddGroup={handleGroupAdd}
            onRemoveGroup={handleGroupRemove}
            onAddRule={handleRuleAdd}
            onRemoveRule={handleRuleRemove}
            isParameterShow={isParameterShow}
            fetchModels={fetchModels}
            isAllowButtons={isAllowButtons}
          />
        ))}
      </Box>
    </div>
  );
}

export default React.memo(ExpressionBuilder);
