import React, { useState, useEffect } from 'react';
import { Box, Button, TextField } from '@axelor/ui';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';
import { translate } from '../common/utils';
import styles from './parameter-builder.module.css';
import { useDialog } from '../views';

const ParameterBuilder = ({
  id,
  multiArg,
  parametersTrans,
  open,
  onClose,
  handleChange,
}) => {
  const [parameters, setParemeters] = useState();
  const { DialogBox } = useDialog();

  useEffect(() => {
    setParemeters(parametersTrans);
  }, [parametersTrans]);

  const renderComponent = (e, id) => {
    switch (e?.type) {
      case 'Decimal':
        return (
          <TextField
            placeholder={e?.name}
            value={parameters[id].value}
            type={e?.type}
            className={styles.param}
            onChange={e => {
              const p = Object.assign([], [...parameters]);
              p[id].value = e.target.value;
            }}
          />
        );
      default:
        return (
          <TextField
            placeholder={e?.name || 'value'}
            value={parameters[id].value}
            type={e?.type}
            className={styles.param}
            onChange={e => {
              let newP = null;
              const p = Object.assign([], [...parameters]);
              newP = { ...p[id] };
              newP.value = e.target.value;
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
      title={'Parameters'}
      handleSave={() => {
        handleChange(parameters, id);
        onClose();
      }}
      className={styles.dialog}
      handleClose={onClose}
      children={
        <Box className={styles.dialogContent}>
          <Box d="flex" flexDirection="row" my="3">
            {multiArg && (
              <Button
                className={styles.addButton}
                d="flex"
                variant="primary"
                onClick={() =>
                  setParemeters([...parameters, { value: null, name: null }])
                }
              >
                <MaterialIcon icon="add" />
                {translate('Add Parameters')}
              </Button>
            )}
          </Box>
          <Box d="flex" flexDirection="column">
            <Box d="flex" flexDirection="column">
              {parameters?.map((param, index) => {
                return (
                  <Box
                    d="flex"
                    flexDirection="row"
                    alignItems={'baseline'}
                    key={index}
                  >
                    <Box
                      as="p"
                      style={{
                        fontSize: 16,
                        width: '30%',
                        marginRight: '10px',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Parameter {index + 1} :{' '}
                      {param.isOptional ? '(optional)' : ''}
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
