import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import {
  Checkbox,
  DialogTitle,
  FormControlLabel,
  TextField,
} from '@material-ui/core';
import { Add, ArrowRightAlt, Clear, Edit } from '@material-ui/icons';
import { SelectionField } from '../../components';
import PayloadBuilder from '../payload-builder';
import { TransformationBuilder } from '../../transformation-builder/index';
import { getMetaModels } from '../../../services/api';
import { getSubMetaField } from '../../expression-builder/services/api';
import FieldEditor from './FieldEditor';

const useStyles = makeStyles({
  modelParams: {
    display: 'flex',
    height: '3.6rem' ,
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
    alignItems:"end"
  },
  textField: {
    justifyContent: 'end',
    minWidth: '300px',
  },
  Checkbox: {
    color: '#0274d7',
  },
  dialogTitle: {
    'color': '#0274d7',
    'paddingLeft': 0,
    'paddingRight': 3,
    'display': 'flex',
    'flexDirection': 'row',
    'fontSize': 15,
    'alignItems': 'end',
    '& #simple-dialog-title': {
      cursor: 'pointer',
      width: 'auto',
      padding:0
    },
    '& .MuiTypography-h6': {
      fontSize: '0.8em',
    },
  },
  icon: {
    color: '#0274d7',
    marginTop: 20,
    marginBottom: 20,
    fontSize: 30,
  },
  options:{
    display:"flex",
    justifyContent:"space-evenly",
    alignItems:"end",
    width:"350px",
    marginLeft:"auto"
  },
  delete: {
    color: '#0274d7',
    fontSize: 25,
  },
  fieldSelect: {
    width: '300px !important',
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
    //width: '100%',
  },
  addBaseModelParams: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
   // width: '100%',
  },
  line: {
    width: '10%',
  },
});

export default function Payload({
  deletePayload,
  handleChange,
  payload,
  getMetaFields,
  isModelSelected,
  id,
}) {
  const classes = useStyles();
  const [showTransformation, setShowTransformation] = useState(false);
  const [payload_, setPayload] = useState(payload);
  const [embedded, setShowEmbeeded] = useState(false);
  const [showSubFields, setShowSubFields] = useState(false);
  useEffect(() => {
    setPayload(payload);
  }, [payload]);

  const closeEmbedded = () => {
    setShowEmbeeded(false);
  };

  const handleSaveEmbedded = (e) => {
    setPayload({ ...payload_, wsValue: e });
    handleChange({ ...payload_, wsValue: e }, id);
  };
  const fetchSubFields = React.useCallback(() => {
    return getSubMetaField();
  }, []);

  return (
    <>
      <div className={classes.modelParams}>
        {embedded && (
          <PayloadBuilder
            handleClose={closeEmbedded}
            open={embedded}
            onSave={(e) => handleSaveEmbedded(e)}
            initialData={
              Array.isArray(payload.wsValue) && payload_?.wsValue ?
                payload_?.wsValue :
                []
            }
            action={'EDIT'}
          />
        )}
        <TextField
          value={payload_?.wsKey}
          InputLabelProps="Payload"
          onChange={(e) => {
            setPayload({ ...payload_, wsKey: e.target.value });
          }}
          onBlur={(e) =>
            handleChange({ ...payload_, wsKey: e.target.value }, id)
          }
          className={classes.textField}
          style={{ marginRight: 20 }}
          placeholder="Payalod key"
        />
        {isModelSelected && !payload_?.isList && (
          <FieldEditor
          getMetaFields={getMetaFields}
          onChange={(e)=>{ handleChange({ ...payload_, wsValue: e }, id)} }
          value={payload_.wsValue}
          />
        )}

        {!isModelSelected && !payload_.isList && (
          <TextField
            value={payload_?.wsValue}
            InputLabelProps="Payload"
            onChange={(e) => {
              setPayload({ ...payload_, wsValue: e.target.value });
            }}
            onBlur={(e) =>
              handleChange({ ...payload_, wsValue: e.target.value }, id)
            }
            className={classes.textField}
            placeholder="Payalod value"
          />
          
        )}
        {!payload_?.isList && showSubFields && (
          <ArrowRightAlt  className={classes.icon} style={{ width: '7%', cursor: "pointer" }} />
        )}

        {payload_?.isList && (
          <div className={classes.dialogTitle}>
            <>
              <DialogTitle
                id="simple-dialog-title"
                onClick={() => setShowEmbeeded(true)}
                className={classes.dialogTitle}
              >
                Add embedded payloads
              </DialogTitle>
              {payload_?.wsValue == null ||
                payload_?.wsValue?.length === 0 ||
                !Array.isArray(payload_?.wsValue) ? (
                <Add />
              ) : (
                <Edit />
              )}
            </>
          </div>
        )}
        {showSubFields  && !payload_?.isList && (
          <SelectionField
            name="name"
            title="Subfield"
            placeholder="Model"
            value={payload_?.wsValue?.subField}
            optionLabelKey="name"
            fetchAPI={fetchSubFields}
            onChange={(e) => {
              handleChange({ ...payload_, wsValue: { ...payload_, subField: e } }, id);
              setPayload({ ...payload_, wsValue: { ...payload_, subField: e } });
            }}
            className={classes.fieldSelect}
          />
        )}
        <div className={classes.options}>
        <div className={classes.dialogTitle}>
          {(payload_?.transformations == null ||
            payload_?.transformations?.length === 0) &&
            !payload_?.isList && (
              <>
                <DialogTitle
                  id="simple-dialog-title"
                  onClick={() => setShowTransformation(true)}
                  className={classes.dialogTitle}
                >
                  Add data transformation
                </DialogTitle>
                <Add style={{ width: '10%' }} />
              </>
            )}
          {payload_?.transformations &&
            payload_?.transformations?.length !== 0 && (
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
        <FormControlLabel
          className={classes.Checkbox}
          control={
            <Checkbox
              style={{ color: "#0274d7",padding:"2px" }}
              onClick={() => {
                handleChange({ ...payload_, isList: !payload_?.isList }, id);
                setPayload({ ...payload_, isList: !payload_?.isList });
              }}
              checked={payload_?.isList}
            />
          }
          label="List"
        />
        <Clear onClick={() => deletePayload(id)} className={classes.delete} />
      {showTransformation && (
        <TransformationBuilder
          open={showTransformation}
          handleClose={() => setShowTransformation(false)}
          action={true}
          onSave={(trans) => {
            handleChange({ ...payload_, transformations: trans }, id);
            setPayload({ ...payload_, transformations: trans }, id);
          }}
          initialData={payload?.transformations}
        />
      )}
        </div>
    </div>
    </>
  );
}