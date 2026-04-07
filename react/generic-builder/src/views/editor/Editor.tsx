import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Timeline, Select, Button, IconButton } from "../../components";
import { COMBINATOR } from "../../common/constants";
import { isBPMQuery, translate  } from "../../common/utils";

import Rule from "./Rule";
import styles from "./editor.module.css";

interface EditorRule {
  [key: string]: unknown;
}

interface EditorData {
  id: number;
  rules?: EditorRule[];
  combinator?: string;
  parentId?: number;
  [key: string]: unknown;
}

interface EditorProps {
  onAddGroup: (id: number) => void;
  isRemoveGroup?: boolean;
  onRemoveGroup: (id: number) => void;
  onAddRule: (id: number) => void;
  onRemoveRule: (editorId: unknown, index: number) => void;
  editor?: EditorData;
  getChildEditors: (id: number) => EditorData[];
  onChange: (e: Record<string, unknown>, editor: Record<string, unknown>, i?: number) => void;
  getMetaFields: () => Promise<Record<string, unknown>[]>;
  isDisable?: boolean;
  expression?: string;
  type?: string;
  parentMetaModal?: Record<string, unknown>;
  element?: unknown;
  isCondition?: boolean;
  isParameterShow?: boolean;
  fetchModels?: (filter: unknown) => Promise<Record<string, unknown>[]>;
  isAllowButtons?: boolean;
  isBPMN?: boolean;
  isMapper?: boolean;
}

export default function Editor({
  onAddGroup,
  isRemoveGroup,
  onRemoveGroup,
  onAddRule,
  onRemoveRule,
  editor = {} as EditorData,
  getChildEditors,
  onChange,
  getMetaFields,
  isDisable,
  expression,
  type,
  parentMetaModal,
  element,
  isCondition,
  isParameterShow,
  fetchModels,
  isAllowButtons = false,
  isBPMN = false,
  isMapper,
}: EditorProps) {
  const [isBPM, setBPM] = useState(false);
  const { id, rules = [] } = editor;
  const childEditors = getChildEditors(editor.id);

  useEffect(() => {
    const isBPM = isBPMQuery(type);
    setBPM(isBPM);
  }, [type]);
  return (
    <Box
      data-testid="editor"
      d="flex"
      className={classNames(styles.paper, isDisable && styles.disabled)}
      border
    >
      <Box d="flex">
        <Timeline
          align="alternate"
          title={
            <Select
              name="combinator"
              className={styles.combinator}
              disableUnderline
              options={COMBINATOR as { name: string; title: string }[]}
              value={editor?.combinator}
              onChange={(value: unknown) => {
                onChange({ name: "combinator", value }, editor);
              }}
            />
          }
        >
          <Box d="flex" alignItems="center" gap={4}>
            <Button title="Add group" icon="add" onClick={() => onAddGroup(id)} />
            {isRemoveGroup && (
              <IconButton
                title={translate("Remove group")}
                size="small"
                onClick={() => onRemoveGroup(id)}
                style={{ display: "flex" }}
              >
                <MaterialIcon icon="delete" fontSize={18} />
              </IconButton>
            )}
          </Box>
          {rules.map((rule: EditorRule, i: number) => (
            <Rule
              key={i}
              index={i}
              value={rule}
              editor={editor}
              element={element}
              expression={expression}
              isBPM={isBPM}
              isBPMN={isBPMN}
              isCondition={isCondition}
              parentType={type}
              parentMetaModal={parentMetaModal}
              getMetaFields={getMetaFields}
              onChange={onChange}
              onRemove={onRemoveRule}
              isParameterShow={isParameterShow}
              fetchModels={fetchModels}
              isAllowButtons={isAllowButtons}
              isMapper={isMapper}
            />
          ))}
          <Button title="Add rule" icon="add" onClick={() => onAddRule(id)} />
          {childEditors.map((editor: EditorData) => (
            <React.Fragment key={editor.id}>
              <Editor
                isRemoveGroup
                onAddGroup={onAddGroup}
                onRemoveGroup={onRemoveGroup}
                onAddRule={onAddRule}
                onRemoveRule={onRemoveRule}
                getChildEditors={getChildEditors}
                getMetaFields={getMetaFields}
                onChange={(
                  e: Record<string, unknown>,
                  editor: Record<string, unknown>,
                  i?: number,
                ) => onChange(e, editor, i)}
                editor={editor}
                type={type}
                element={element}
                expression={expression}
                isCondition={isCondition}
                parentMetaModal={parentMetaModal}
                isParameterShow={isParameterShow}
                fetchModels={fetchModels}
                isMapper={isMapper}
                isBPMN={isBPMN}
              />
            </React.Fragment>
          ))}
        </Timeline>
      </Box>
    </Box>
  );
}
