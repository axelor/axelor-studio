import React, { useState, useEffect } from "react";
import { Box, Button, TextField } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { translate } from "../common/utils";
import { useDialog } from "../views";

import styles from "./parameter-builder.module.css";

interface ParameterItem {
  name?: string | null;
  type?: string;
  value?: string | null;
  isOptional?: boolean;
  [key: string]: unknown;
}

interface ParameterBuilderProps {
  id: number;
  multiArg?: boolean;
  parametersTrans: ParameterItem[];
  open: boolean;
  onClose: () => void;
  handleChange: (params: ParameterItem[], id: number) => void;
}

const ParameterBuilder = ({
  id,
  multiArg,
  parametersTrans,
  open,
  onClose,
  handleChange,
}: ParameterBuilderProps) => {
  const [parameters, setParemeters] = useState<ParameterItem[] | undefined>();
  const { DialogBox } = useDialog();

  useEffect(() => {
    setParemeters(parametersTrans);
  }, [parametersTrans]);

  const renderComponent = (e: ParameterItem, id: number) => {
    switch (e?.type) {
      case "Decimal":
        return (
          <TextField
            placeholder={e?.name || ""}
            value={parameters?.[id]?.value || ""}
            type={e?.type}
            className={styles.param}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const p = [...(parameters || [])];
              p[id] = { ...p[id], value: e.target.value };
              setParemeters(p);
            }}
          />
        );
      default:
        return (
          <TextField
            placeholder={e?.name || "value"}
            value={parameters?.[id]?.value || ""}
            type={e?.type}
            className={styles.param}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const p = [...(parameters || [])];
              const newP = { ...p[id], value: e.target.value };
              p[id] = newP;
              setParemeters(p);
            }}
          />
        );
    }
  };

  return (
    <DialogBox
      fullscreen={false}
      open={open}
      title={"Parameters"}
      handleSave={() => {
        handleChange(parameters || [], id);
        onClose();
      }}
      className={styles.dialog}
      handleClose={onClose}
      children={
        <Box className={styles.dialogContent}>
          <Box d="flex" flexDirection="row" my={3}>
            {multiArg && (
              <Button
                className={styles.addButton}
                d="flex"
                variant="primary"
                onClick={() => setParemeters([...(parameters || []), { value: null, name: null }])}
              >
                <MaterialIcon icon="add" />
                {translate("Add Parameters")}
              </Button>
            )}
          </Box>
          <Box d="flex" flexDirection="column">
            <Box d="flex" flexDirection="column">
              {parameters?.map((param, index) => {
                return (
                  <Box d="flex" flexDirection="row" alignItems={"baseline"} key={index}>
                    <Box
                      as="p"
                      style={{
                        fontSize: 16,
                        width: "30%",
                        marginRight: "10px",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Parameter {index + 1} : {param.isOptional ? "(optional)" : ""}
                    </Box>
                    {renderComponent(param, index)}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      }
    />
  );
};

export default ParameterBuilder;
