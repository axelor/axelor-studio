import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {TextField} from '@material-ui/core';
import {Delete} from '@material-ui/icons';
import {Selection} from '../../expression-builder/components';
import Service from '../../../services/Service';

const useStyles = makeStyles({
  filter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  fieldSelect: {
    width: '30%',
    marginRight: '2%',
  },
  delete: {
    color: '#0274d7',
    fontSize: 25,
    marginTop: 'auto',
  },
  textField: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginRight: 50,
  },
});
let libraries = [];

export default function Filter({
  id,
  deleteFilter,
  handleTransformation,
  dataTransformation,
}) {
  const classes = useStyles();
  const [trans, setTrans] = useState(
    dataTransformation?.library?.length !== 0 ?
      dataTransformation :
      {id: id, filter: {library: '', operation: ''}},
  );
  const [library, setLibrary] = useState(
    dataTransformation?.library?.length !== 0 ?
      dataTransformation?.library :
      null,
  );

  useEffect(() => {
    handleTransformation(trans);
  }, [handleTransformation, trans]);
  useEffect(() => {
    libraries = [];
    async function fetchData() {
      const trans = await Service.get('wsRequest/transformations');
      trans.forEach((trans) => {
        libraries.push({
          name: trans.library,
          title: trans.library,
          operations: trans.operations,
        });
      });
    }
    fetchData();
  }, []);

  const transferOperations = (operations) => {
    const result = [];
    operations?.forEach((operation) => {
      result.push({name: operation, title: operation});
    });
    return result;
  };

  useEffect(() => {
    setTrans((trans) =>{return {...trans, library: library}});
  }, [library]);

  return (
    <div className={classes.filter}>
      <Selection
        name="library"
        title="Library"
        placeholder="Libary"
        optionLabelKey="name"
        className={classes.fieldSelect}
        value={library}
        onChange={(change) => {
          setLibrary(change);
        }}
        options={libraries}
      />
      <Selection
        name="operation"
        title="Operation"
        placeholder="Operation"
        optionLabelKey="name"
        value={trans?.operation}
        className={classes.fieldSelect}
        onChange={(change) => {
          setTrans({...trans, operation: change});
        }}
        options={transferOperations(library?.operations)}
      />
      {library?.name === 'Math' && (
        <TextField
          value={trans?.value}
          InputLabelProps="Value"
          onChange={(e) => setTrans({...trans, value: e.target.value})}
          className={classes.textField}
          placeholder="Value"
        />
      )}
      <Delete onClick={() => deleteFilter(id)} className={classes.delete} />
    </div>
  );
}
