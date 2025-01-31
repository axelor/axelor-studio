import React, { useState } from 'react';
import { Box, Button } from '@axelor/ui';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';
import { Selection, Tooltip } from '../components';
import { IconButton } from '../components';
import ParameterBuilder from './parameter-builder';
import { getLibraries, getParams, getTransformations } from '../services/api';
import { translate } from '../common/utils';
import styles from './transformation-builder.module.css';

const Filter = ({ id, trans, handleChange, deleteTransformation }) => {
  const [transformation, setTransformation] = useState(trans);
  const [showParam, setShowParam] = useState(false);

  const fetchParams = async e => {
    const res = await getParams(e?.id);
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
          onChange={e => {
            const updatedTransformation = { ...transformation, library: e };
            if (!e) {
              updatedTransformation.operation = null;
            }
            setTransformation(updatedTransformation);
            handleChange(updatedTransformation, id);
          }}
          value={transformation?.library}
        />
        <MaterialIcon icon="arrow_forward" className={styles.arrowIcon} />
        <Selection
          className={styles.select}
          name="operation"
          title="Operation"
          placeholder="Operation"
          optionLabelKey="name"
          value={transformation?.operation}
          fetchAPI={() => getTransformations(transformation?.library?.id)}
          onChange={async e => {
            setTransformation({ ...transformation, operation: e });
            let params = await fetchParams(e);
            setTransformation({
              ...trans,
              operation: { ...e, parameters: params },
            });
            handleChange(
              { ...trans, operation: { ...e, parameters: params } },
              id
            );
            if (e?.parameters?.length !== 0) setShowParam(true);
          }}
        />
        <Button
          className={styles.paramsButton}
          d="flex"
          disabled={
            !(
              transformation?.operation?.parameters &&
              transformation?.operation?.parameters?.length !== 0
            )
          }
          onClick={() => {
            setShowParam(true);
          }}
          alignItems={'center'}
          border={0}
        >
          {translate('Parameters')}
          <MaterialIcon icon="edit" fontSize={'1.5rem'} />
        </Button>
        <IconButton
          className={styles.deleteButton}
          onClick={() => {
            deleteTransformation(id);
          }}
        >
          <Tooltip title={translate('Delete filter')}>
            <MaterialIcon icon="delete" fontSize={'1.5rem'} />
          </Tooltip>
        </IconButton>
      </Box>
      {showParam && transformation?.operation?.parameters && (
        <ParameterBuilder
          id={id}
          open={showParam}
          parametersTrans={transformation?.operation?.parameters}
          handleChange={(params, id) => {
            setTransformation(
              {
                ...trans,
                operation: { ...transformation.operation, parameters: params },
              },
              id
            );
            handleChange(
              {
                ...trans,
                operation: { ...transformation.operation, parameters: params },
              },
              id
            );
          }}
          multiArg={transformation?.operation?.multiArg}
          onClose={() => {
            setShowParam(false);
          }}
        />
      )}
    </React.Fragment>
  );
};

export default Filter;
