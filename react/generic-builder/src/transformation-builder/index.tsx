import React, { useState, useEffect } from "react";
import { Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { translate } from "../common/utils";
import { useDialog } from "../views";

import styles from "./index.module.css";
import Filter from "./transformation-builder";

interface TransformationItem {
  library: Record<string, unknown>;
  operation: { name: string; value: string; parameters: unknown[] | null };
  [key: string]: unknown;
}

interface TransformationBuilderProps {
  initialData?: TransformationItem[] | null;
  open: boolean;
  onClose: () => void;
  handleOk: (value: TransformationItem[]) => void;
}

const TransformationBuilder = ({
  initialData = null,
  open,
  onClose,
  handleOk,
}: TransformationBuilderProps) => {
  const [transformation, setTransformation] = useState<TransformationItem[]>([]);

  const addFilter = () => {
    setTransformation([
      ...transformation,
      {
        library: {},
        operation: { name: "", value: "", parameters: null },
      },
    ]);
  };

  const deleteFilter = (id: number) => {
    const newTrans = transformation.filter((_value, index) => index !== id);
    setTransformation([...newTrans]);
  };

  const handleTransformation = (newTrans: TransformationItem, id: number) => {
    const trans = [...transformation];
    trans[id] = newTrans;
    setTransformation(trans);
  };

  useEffect(() => {
    if (initialData == null || initialData?.length === 0) {
      setTransformation([
        {
          library: {},
          operation: { name: "", value: "", parameters: null },
        },
      ]);
    } else setTransformation(initialData);
  }, [initialData]);

  const { DialogBox } = useDialog();

  return (
    <DialogBox
      className={styles.dialogPaper}
      open={open}
      title={"Data transformation"}
      handleSave={() => {
        handleOk(transformation);
        onClose();
      }}
      handleClose={onClose}
      children={
        <>
          <Button onClick={() => addFilter()} d="flex" w={25}>
            <MaterialIcon icon="add" />
            {translate("Add Filter")}
          </Button>
          <div className={styles.dialogContent}>
            {transformation?.map((filter, index) => {
              return (
                <Filter
                  trans={filter}
                  handleChange={(trans: Record<string, unknown>, id: number) =>
                    handleTransformation(trans as TransformationItem, id)
                  }
                  key={index}
                  id={index}
                  deleteTransformation={(id: number) => deleteFilter(id)}
                />
              );
            })}
          </div>
        </>
      }
    />
  );
};

export default TransformationBuilder;
