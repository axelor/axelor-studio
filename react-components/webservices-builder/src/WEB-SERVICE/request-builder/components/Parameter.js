import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {DialogTitle, TextField} from '@material-ui/core';
import {Add, ArrowRightAlt, Delete, Edit} from '@material-ui/icons';
import {TransformationBuilder} from '../../transformation-builder/index';
import {Selection} from '../../components';

const useStyles = makeStyles({
  modelParams: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  textField: {
    justifyContent: 'center',
    width: '33%',
    marginBottom: 10,
  },
  dialogTitle: {
    'color': '#0274d7',
    'paddingLeft': 0,
    'paddingRight': 3,
    'display': 'flex',
    'flexDirection': 'row',
    'alignItems': 'center',
    '& #simple-dialog-title': {
      cursor: 'pointer',
    },
  },
  icon: {
    color: '#0274d7',
    margin: 20,
    fontSize: 30,
  },
  delete: {
    color: '#0274d7',
    margin: 'auto',
    fontSize: 25,
  },
  fieldSelect: {
    width: '30%',
  },
  paper: {
    margin: 10,
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
  },
  save: {
    'margin': 10,
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'color': 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  dialogPaper: {
    maxWidth: '50%',
    maxHeight: '40%',
    resize: 'both',
    width: '50%',
    height: '40%',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: '100%',
    overflow: 'hidden',
  },
  baseModelParams: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  addBaseModelParams: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  line: {
    width: '10%',
  },
});

export default function Parameter({
  deleteParam,
  correspondingFields,
  handleChange,
  parameter,
  id,
}) {
  const classes = useStyles();
  const [showTransformation, setShowTransformation] = useState(false);
  const [param, setParam] = useState(parameter);
  useEffect(() => {
    setParam(parameter);
  }, [parameter]);
  return (
    <>
      <div className={classes.modelParams}>
        <TextField
          value={param.wsKey}
          InputLabelProps="Parameter name"
          onChange={(e) => {
            setParam({...param, wsKey: e.target.value});
          }}
          onBlur={(e) => handleChange({...param, wsKey: e.target.value}, id)}
          className={classes.textField}
          style={{width: '20%'}}
          placeholder="Parameter name"
        />
        <ArrowRightAlt className={classes.icon} />
        {correspondingFields && (
          <Selection
            name="name"
            title="Corresponding field"
            placeholder="Model"
            value={param.wsValue}
            optionLabelKey="name"
            options={correspondingFields}
            onChange={(e) => {
              handleChange({...param, wsValue: e}, id);
              setParam({...param, wsValue: e});
            }}
            className={classes.fieldSelect}
          />
        )}
        {!correspondingFields && (
          <TextField
            value={param.wsValue}
            InputLabelProps="Payload"
            onChange={(e) => {
              setParam({...param, wsValue: e.target.value});
            }}
            onBlur={(e) =>
              handleChange({...param, wsValue: e.target.value}, id)
            }
            className={classes.textField}
            placeholder="Corresponding"
          />
        )}
        <ArrowRightAlt className={classes.icon} />
        <div className={classes.dialogTitle}>
          {(param.transformations == null ||
            param?.transformations?.length === 0) && (
            <>
              <DialogTitle
                id="simple-dialog-title"
                onClick={() => setShowTransformation(true)}
                className={classes.dialogTitle}
              >
                Add data transformation
              </DialogTitle>
              <Add />
            </>
          )}
          {param?.transformations && param?.transformations?.length !== 0 && (
            <>
              <DialogTitle
                id="simple-dialog-title"
                className={classes.dialogTitle}
                onClick={() => setShowTransformation(true)}
              >
                Transformations
              </DialogTitle>
              <Edit />
            </>
          )}
        </div>
        <Delete onClick={() => deleteParam(id)} className={classes.delete} />
      </div>
      {showTransformation && (
        <TransformationBuilder
          open={showTransformation}
          onSave={(trans) => {
            handleChange({...param, transformations: trans}, id);
            setParam({...param, transformations: trans}, id);
          }}
          handleClose={() => setShowTransformation(false)}
          action={true}
          initialData={param?.transformations}
        />
      )}
    </>
  );
}
