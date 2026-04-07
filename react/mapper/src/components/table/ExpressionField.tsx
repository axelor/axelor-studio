import React from "react";
import { ExpressionBuilder } from "generic-builder";
import { fetchModelByFullName } from "@studio/shared/services";
import {   Box, Button, Input } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { translate } from "../../utils";
import { IconButton } from "@studio/shared/components";
import DialogBox from "../Dialog";

import styles from "./expression-field.module.css";

function ExpressionBuilderDummy() {
  return <p>Integrate Generic builder</p>;
}

interface ExpressionFieldProps {
  parameters?: Record<string, unknown>;
  target?: string;
  selected: string | null | undefined;
  onSelectedChange: (val: unknown) => void;
  expression: unknown;
  onExpressionChange: (val: unknown) => void;
  error?: boolean;
}

export default function ExpressionField({
  parameters,
  target,
  selected,
  onSelectedChange,
  expression,
  onExpressionChange,
  error,
}: ExpressionFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [defaultModel, setDefaultModel] = React.useState<Record<string, unknown> | null>(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleExpression = (val: unknown, exprVal: unknown) => {
    if (val && exprVal) {
      onSelectedChange(val);
      onExpressionChange(exprVal);
      handleClose();
    }
  };

  const handleRemove = () => {
    onSelectedChange(null);
    onExpressionChange(null);
  };

  React.useEffect(() => {
    if (target) {
      (async () => {
        const data = await fetchModelByFullName(target);
        setDefaultModel(data ?? null);
      })();
    }
  }, [target]);

  return (
    <Box color="body" d="flex" alignItems="center" gap={4}>
      <Input
        type="text"
        value={selected || ""}
        flex={1}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e?.target?.value;
          onSelectedChange(value);
          onExpressionChange(null);
        }}
        readOnly={!!parameters}
        disabled={!!parameters}
        invalid={!!error && (!selected || selected?.trim() === "")}
      />
      {selected && parameters && (
        <IconButton size="small" onClick={handleRemove}>
          <MaterialIcon icon="close" color="body" fontSize={16} />
        </IconButton>
      )}
      <IconButton size="small" onClick={handleClickOpen} style={{ color: "inherit" }}>
        <MaterialIcon icon="edit" fontSize={16} />
      </IconButton>
      {ExpressionBuilder ? (
        <ExpressionBuilder
          open={open}
          DialogBox={DialogBox}
          parameters={parameters}
          defaultModel={defaultModel}
          onSave={handleExpression}
          exprVal={expression}
          isMapper={true}
          dialogActionButton={
            <Button onClick={handleClose} variant="secondary" className={styles.cancelButton}>
              {translate("Cancel")}
            </Button>
          }
        />
      ) : (
        <ExpressionBuilderDummy />
      )}
    </Box>
  );
}
