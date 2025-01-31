import React, { useState, useEffect } from 'react';
import { Button } from '@axelor/ui';
import Filter from './transformation-builder';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';
import { translate } from '../common/utils';
import styles from './index.module.css';
import { useDialog } from '../views';

const TransformationBuilder = ({
  initialData = null,
  open,
  onClose,
  handleOk,
}) => {
  const [transformation, setTransformation] = useState([]);

  const addFilter = () => {
    setTransformation([
      ...transformation,
      {
        library: {},
        operation: { name: '', value: '', parameters: null },
      },
    ]);
  };

  const deleteFilter = id => {
    const newTrans = transformation.filter((value, index) => index !== id);
    setTransformation([...newTrans]);
  };

  const handleTransformation = (newTrans, id) => {
    const trans = [...transformation];
    trans[id] = newTrans;
    setTransformation(trans);
  };

  useEffect(() => {
    if (initialData == null || initialData?.length === 0) {
      setTransformation([
        {
          library: {},
          operation: { name: '', value: '', parameters: null },
        },
      ]);
    } else setTransformation(initialData);
  }, [initialData]);

  const { DialogBox } = useDialog();

  return (
    <DialogBox
      className={styles.dialogPaper}
      open={open}
      title={'Data transformation'}
      handleSave={() => {
        handleOk(transformation);
        onClose();
      }}
      handleClose={onClose}
      children={
        <>
          <Button onClick={() => addFilter()} d="flex" w={25}>
            <MaterialIcon icon="add" />
            {translate('Add Filter')}
          </Button>
          <div className={styles.dialogContent}>
            {transformation?.map((filter, index) => {
              return (
                <Filter
                  trans={filter}
                  handleChange={(trans, id) => handleTransformation(trans, id)}
                  key={index}
                  id={index}
                  deleteTransformation={id => deleteFilter(id)}
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
