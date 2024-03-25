import React, { useState, useEffect } from "react";
import produce from "immer";
import Editor from "./editor";
import { getMetaFields } from "./services/api";
import { getButtons, getDMNFields, getModels } from "../../services/api";
import { isBPMQuery } from "./extra/util";
import { allowed_types } from "./extra/data";
import { Selection } from "./components";
import { Box } from "@axelor/ui";

let id = 0;

const defaultRules = {
  id,
  parentId: -1,
  combinator: "and",
  rules: [{}],
};

const defaultState = {
  rules: [defaultRules],
};

function ExpressionBuilder(props) {
  const {
    value = defaultState,
    setValue,
    index,
    element,
    type,
    processConfigs,
    isAllowButtons,
    defaultModel,
  } = props;

  const { metaModals: model, rules: r } = value;
  const [expression] = useState("GROOVY");
  const [metaModals, setMetaModals] = useState(model || defaultModel);
  const [rules, setRules] = useState(r);

  function onAddGroup(parentId) {
    id = (rules ? rules.length : id) + 1;
    setRules((state) => [...state, { id, parentId, rules: [] }]);
  }

  function onRemoveGroup(id) {
    setRules(
      produce((draft) => {
        const index = rules.findIndex((r) => r.id === id);
        draft.splice(index, 1);
      })
    );
  }

  function onAddRule(editorId, rule = {}) {
    setRules(
      produce((draft) => {
        const editorIndex = rules.findIndex((i) => i.id === editorId);
        draft[editorIndex].rules = [...draft[editorIndex].rules, rule];
      })
    );
  }

  function onRemoveRule(editorId, index) {
    setRules(
      produce((draft) => {
        const editorIndex = rules.findIndex((i) => i.id === editorId);
        draft[editorIndex].rules.splice(index, 1);
      })
    );
  }

  const getChildEditors = (parentId) => {
    return rules.filter((editor) => editor.parentId === parentId);
  };

  function onChange({ name, value }, editor, index) {
    setRules(
      produce((draft) => {
        const editorIndex = rules.findIndex((i) => i.id === editor.id);
        if (index >= 0) {
          Object.assign(
            (draft[editorIndex].rules[index] = {
              ...draft[editorIndex].rules[index],
              [name]: value,
              ...(name === "fieldName"
                ? {
                    operator: "",
                    fieldValue: null,
                    fieldValue2: null,
                    isRelationalValue: null,
                    relatedValueFieldName: null,
                    relatedValueModal: null,
                  }
                : {}),
              ...(name === "operator"
                ? {
                    fieldValue: null,
                    fieldValue2: null,
                    isRelationalValue: null,
                    relatedValueFieldName: null,
                    relatedValueModal: null,
                  }
                : {}),
            })
          );
        } else {
          draft[editorIndex][name] = value;
        }
      })
    );
  }

  async function fetchField() {
    if (model && model.type === "dmnModel") {
      const dmnFieldIds = model.outputDmnFieldList.map((f) => f.id);
      if (dmnFieldIds && dmnFieldIds.length > 0) {
        const dmnFields = await getDMNFields({
          data: {
            criteria: [{ fieldName: "id", operator: "IN", value: dmnFieldIds }],
          },
        });
        return (
          dmnFields &&
          dmnFields.map((f) => {
            return { ...f, type: f.fieldType };
          })
        );
      }
    }
    const isQuery = isBPMQuery(type);
    let allFields = (await getMetaFields(metaModals, isQuery)) || [];
    if (metaModals && isAllowButtons) {
      const buttons = await getButtons([
        {
          model: metaModals.name,
          type: metaModals.type,
          modelFullName: `${metaModals.packageName}.${metaModals.name}`,
        },
      ]);
      allFields = [...(allFields || []), ...(buttons || [])];
    }
    return allFields.filter((a) => {
      return (
        (isAllowButtons
          ? [...allowed_types, "button"]
          : allowed_types
        ).includes((a.type || "").toLowerCase()) && (isQuery ? !a.json : true)
      );
    });
  }

  async function fetchModels() {
    return getModels();
  }

  useEffect(() => {
    setMetaModals(model || defaultModel);
    setRules(r);
  }, [r, model, defaultModel]);

  useEffect(() => {
    setValue({ metaModals, rules }, index);
  }, [index, setValue, metaModals, rules]);

  return (
    <div style={{ width: "100%" }}>
      <Box overflow="auto" style={{ width: "100%" }} rounded p={3}>
        {!isBPMQuery(type) && (
          <Box d="flex" flexDirection="column">
            <Box d="flex">
              <Selection
                name="metaModal"
                title="Model"
                placeholder="Meta model"
                fetchAPI={fetchModels}
                optionLabelKey="name"
                onChange={(e) => {
                  setMetaModals(e);
                  setRules([defaultRules]);
                }}
                readOnly={defaultModel ? true : false}
                value={metaModals}
              />
            </Box>
          </Box>
        )}
        {rules
          .filter((e) => e.parentId === -1)
          .map((editor) => {
            return (
              <React.Fragment key={editor.id}>
                <Editor
                  onAddGroup={onAddGroup}
                  onRemoveGroup={onRemoveGroup}
                  onAddRule={onAddRule}
                  onRemoveRule={onRemoveRule}
                  getChildEditors={getChildEditors}
                  getMetaFields={fetchField}
                  onChange={(e, editor, index) => onChange(e, editor, index)}
                  editor={editor}
                  isDisable={!Boolean(metaModals)}
                  expression={expression}
                  type={type}
                  parentMetaModal={metaModals}
                  element={element}
                  processConfigs={processConfigs}
                  isAllowButtons={isAllowButtons}
                />
                <br />
              </React.Fragment>
            );
          })}
      </Box>
    </div>
  );
}

export default ExpressionBuilder;
