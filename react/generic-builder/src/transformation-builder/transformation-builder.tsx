import React, { useState } from "react";
import { Box, Button } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { Selection, Tooltip, IconButton  } from "../components";
import { getLibraries, getParams, getTransformations } from "../services/transformation-service";
import { translate } from "../common/utils";

import ParameterBuilder from "./parameter-builder";
import styles from "./transformation-builder.module.css";

interface FilterProps {
  id: number;
  trans: Record<string, unknown>;
  handleChange: (trans: Record<string, unknown>, id: number) => void;
  deleteTransformation: (id: number) => void;
}

const Filter = ({ id, trans, handleChange, deleteTransformation }: FilterProps) => {
  const [transformation, setTransformation] = useState(trans);
  const [showParam, setShowParam] = useState(false);

  const fetchParams = async (e: Record<string, unknown> | undefined) => {
    const res = await getParams(e?.id as number | undefined);
    return res;
  };

  return (
    <React.Fragment>
      <Box d="flex" mx={3} my={4} flexWrap="wrap">
        <Selection
          className={styles.select}
          name="library"
          title="Library"
          placeholder="Library"
          optionLabelKey="name"
          fetchAPI={getLibraries}
          onChange={(e: unknown) => {
            const updatedTransformation: Record<string, unknown> = {
              ...transformation,
              library: e,
            };
            if (!e) {
              updatedTransformation.operation = null;
            }
            setTransformation(updatedTransformation);
            handleChange(updatedTransformation, id);
          }}
          value={(transformation)?.library}
        />
        <MaterialIcon icon="arrow_forward" className={styles.arrowIcon} />
        <Selection
          className={styles.select}
          name="operation"
          title="Operation"
          placeholder="Operation"
          optionLabelKey="name"
          value={(transformation)?.operation}
          fetchAPI={() =>
            getTransformations(
              (transformation?.library as Record<string, unknown>)?.id as number | undefined,
            )
          }
          onChange={async (e: unknown) => {
            const eObj = e as Record<string, unknown>;
            setTransformation({ ...transformation, operation: eObj });
            const params = await fetchParams(eObj);
            setTransformation({
              ...trans,
              operation: { ...eObj, parameters: params },
            });
            handleChange({ ...trans, operation: { ...eObj, parameters: params } }, id);
            if (
              Array.isArray(eObj?.parameters) &&
              eObj.parameters.length !== 0
            )
              setShowParam(true);
          }}
        />
        <Button
          className={styles.paramsButton}
          d="flex"
          disabled={(() => {
            const params = (transformation?.operation as Record<string, unknown> | undefined)?.parameters;
            return !(transformation?.operation && Array.isArray(params) && params.length !== 0);
          })()}
          onClick={() => {
            setShowParam(true);
          }}
          alignItems={"center"}
          border={false}
        >
          {translate("Parameters")}
          <MaterialIcon icon="edit" fontSize={"1.5rem"} />
        </Button>
        <IconButton
          className={styles.deleteButton}
          onClick={() => {
            deleteTransformation(id);
          }}
        >
          <Tooltip title={translate("Delete filter")}>
            <MaterialIcon icon="delete" fontSize={"1.5rem"} />
          </Tooltip>
        </IconButton>
      </Box>
      {!!(
        showParam &&
        (transformation)?.operation &&
        ((transformation).operation as Record<string, unknown>)
          ?.parameters
      ) && (
        <ParameterBuilder
          id={id}
          open={showParam}
          parametersTrans={
            ((transformation).operation as Record<string, unknown>)
              .parameters as Record<string, unknown>[]
          }
          handleChange={(params: Record<string, unknown>[], id: number) => {
            setTransformation({
              ...trans,
              operation: {
                ...((transformation).operation as Record<
                  string,
                  unknown
                >),
                parameters: params,
              },
            });
            handleChange(
              {
                ...trans,
                operation: {
                  ...((transformation).operation as Record<
                    string,
                    unknown
                  >),
                  parameters: params,
                },
              },
              id,
            );
          }}
          multiArg={
            ((transformation).operation as Record<string, unknown>)
              ?.multiArg as boolean
          }
          onClose={() => {
            setShowParam(false);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default Filter;
