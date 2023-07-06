import React, { useState, useEffect } from "react";
import produce from "immer";
import { makeStyles } from "@material-ui/core/styles";
import { Paper } from "@material-ui/core";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";

import Editor from "./editor";
import { Selection } from "../components";
import { getMetaFields } from "./services/api";
import {
  getButtons,
  getModels,
  getDMNModels,
  getDMNFields,
} from "../../services/api";
import { allowed_types } from "./extra/data";
import { getProcessConfig, isBPMQuery } from "./extra/util";



const useStyles = makeStyles((theme) => ({
  Container: {
    display: "flex",
  },
  rulesGroupHeader: {
    display: "flex",
  },
  paper: {
    margin: theme.spacing(1),
    padding: theme.spacing(3, 2),
  },
  rules: {
    display: "flex",
  },
  MuiAutocompleteRoot: {
    width: "100%",
    marginRight: "10px",
  },
  MuiAutocompleteRoot1: {
    width: "500px",
  },
  title: {
    flexGrow: 1,
  },
  disabled: {
    pointerEvents: "none",
    opacity: 0.5,
  },
  popoverContainer: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(2),
  },
  typography: {
    display: "flex",
  },
  popoverHeader: {
    display: "flex",
    alignItems: "center",
    borderBottom: "solid 1px #DDD",
  },
}));

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
    bpmnModeler,
    allowAllModels,
    defaultModel,
  } = props;

  const { metaModals: model, rules: r } = value;
  const [expression] = useState("GROOVY");
  const [metaModals, setMetaModals] = useState(model || defaultModel);
  const [rules, setRules] = useState(r);
  const classes = useStyles();

  const getDMNValues = async () => {
    const refs = [];
    const elementRegistry = bpmnModeler.get("elementRegistry");
    const elementProcessId =
      element.type === "bpmn:Process" || element.type === "bpmn:Participant"
        ? element.id
        : element && element.parent && element.parent.id;
    const elements = elementRegistry.filter((ele) => {
      const bo = getBusinessObject(ele);
      if (
        bo.decisionRef &&
        (ele && ele.parent && ele.parent.id) === elementProcessId
      ) {
        refs.push(bo.decisionRef);
      }
      return (
        bo.decisionRef &&
        (ele && ele.parent && ele.parent.id) === elementProcessId
      );
    });
    if (!refs || refs.length <= 0) return;
    const dmnTables = await getDMNModels([
      {
        fieldName: "decisionId",
        operator: "IN",
        value: refs,
      },
    ]);
    const tables =
      elements &&
      dmnTables &&
      elements.map((element) => {
        const table = dmnTables.find(
          (t) =>
            t.decisionId ===
            (element.businessObject && element.businessObject.decisionRef)
        );
        return {
          ...table,
          dmnNodeId: element.id,
          dmnNodeNameId: element.businessObject.name,
          resultVariable: element.businessObject.resultVariable,
        };
      });
    return tables && tables.filter((t) => t.id);
  };

  const isDMNAllow = () => {
    if (!bpmnModeler) return;
    const elementRegistry = bpmnModeler.get("elementRegistry");
    const elementProcessId =
      element.type === "bpmn:Process" || element.type === "bpmn:Participant"
        ? element.id
        : element && element.parent && element.parent.id;
    const elements = elementRegistry.filter((ele) => {
      const bo = getBusinessObject(ele);
      return (
        is(ele, "bpmn:BusinessRuleTask") &&
        bo &&
        bo.resultVariable &&
        bo.decisionRef &&
        (ele && ele.parent && ele.parent.id) === elementProcessId
      );
    });
    if (elements.length > 0) {
      return true;
    }
  };

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
    const isDMN = isBPMQuery(type) ? false : isDMNAllow();
    const dmnModels = isDMN ? await getDMNValues() : undefined;
    return getModels(
      isBPMQuery(type) || allowAllModels
        ? null
        : getProcessConfig(element, processConfigs),
      undefined,
      dmnModels
    );
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
      <Paper variant="outlined" className={classes.paper}>
        <div
          style={{ display: "flex", width: "100%", flexDirection: "column" }}
        >
          <div style={{ display: "flex" }}>
            <Selection
              name="metaModal"
              title="Model"
              placeholder="meta modal"
              fetchAPI={fetchModels}
              optionLabelKey="name"
              onChange={(e) => {
                setMetaModals(e);
                setRules([defaultRules]);
              }}
              readOnly={defaultModel ? true : false}
              value={metaModals}
              classes={{ root: classes.MuiAutocompleteRoot }}
            />
          </div>
        </div>
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
      </Paper>
    </div>
  );
}

export default ExpressionBuilder;
