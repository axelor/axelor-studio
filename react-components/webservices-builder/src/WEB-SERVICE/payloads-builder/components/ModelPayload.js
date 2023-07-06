import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import { DialogTitle, Paper, TextField } from '@material-ui/core';
import { Add, Delete } from '@material-ui/icons';
import Line from '../../components/Line';
import { getModels } from '../../../services/api';
import { Selection } from '../../components';
import Payload from './Payload';
import { isBPMQuery } from '../../expression-builder/extra/util';
import { getMetaFields } from '../../expression-builder/services/api';

const useStyles = makeStyles({
  modelPayload: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  paperParams: {
    marginTop: 10,
    resize: 'both',
    width: '100%',
    display:"flex",
    flexDirection:'row',
    //marginRight: 10,
    //paddingLeft:'2%'
  },
  textField: {
    justifyContent: 'center',
    marginBottom: 11,
    width: '47%',
  },
  inputSelect: {
   // marginLeft: '2%',
   // marginRight: '2%',
    width: '80%',
    marginBottom: 10,
  },
  line: {
    width: '40px',
  },
  block: {
    width: '100%',
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
    '& .MuiTypography-h6': {
      fontSize: '0.9em',
    },
  },
  icon: {
    color: '#0274d7',
   // margin: 20,
    fontSize: 30,
  },
});

export default function ModelPayload({
  handleChangePayload,
  deleteModelPayload,
  modelPayload,
  addPayload,
  id,
}) {
  const classes = useStyles();
  const [metaModal, setMetaModal] = useState(modelPayload?.model);

  const handelAddPayload = () => {
    const newModelPayload = Object.assign(
      {},
      { ...modelPayload, model: metaModal },
    );
    const payloads = Object.assign([], newModelPayload.payloads);
    payloads.push({ wsKey: null, wsValue: null, isList: false, type: 'Basic' });
    handleChangePayload(
      { ...modelPayload, model: metaModal, payloads: payloads },
      id,
    );
  };
  const handelAddEmbeddedPayload = () => {
    const newModelPayload = Object.assign(
      {},
      { ...modelPayload, model: metaModal },
    );
    const payloads = Object.assign([], newModelPayload.payloads);
    payloads.push({
      wsKey: null,
      model: {},
      type: 'Embedded',
      payloads: [{ wsKey: null, wsValue: null, isList: false, type: 'Basic' }],
    });
    handleChangePayload(
      { ...modelPayload, model: metaModal, payloads: payloads },
      id,
    );
  };

  const handlePayloadChange = (payload, idPayload) => {
    const newModelPayload = Object.assign(
      {},
      { ...modelPayload, model: metaModal },
    );
    const payloads = Object.assign([], newModelPayload.payloads);
    payloads[idPayload] = payload;
    handleChangePayload(
      { ...modelPayload, model: metaModal, payloads: payloads },
      id,
    );
  };

  const handleEmbeddedPayloadChange = (emPayload, idPayload) => {
    const newModelPayload = Object.assign(
      {},
      { ...modelPayload, model: metaModal },
    );
    const payloads = Object.assign([], newModelPayload.payloads);
    payloads[idPayload] = emPayload;
    handleChangePayload(
      { ...modelPayload, model: metaModal, payloads: payloads },
      id,
    );
  };
  const resetCorrespondingFields = (e) => {
    const newModelPayload = Object.assign(
      {},
      { ...modelPayload, model: metaModal },
    );
    const payloads = Object.assign([], newModelPayload.payloads);
    payloads.forEach(payload => {
      if (payload?.wsValue?.name) payload.wsValue = null
    });
    handleChangePayload(
      { ...modelPayload, model: e, payloads: payloads },
      id,
    );
  }

  const handleDelete = (idPay) => {
    let newModelPayload = [...modelPayload.payloads];
    newModelPayload = newModelPayload.filter((pay, index) => index !== idPay);
    handleChangePayload({ ...modelPayload, payloads: newModelPayload }, id);
  };
  async function fetchModels() {
    return getModels();
  }
  async function fetchField() {
    let allFields = (await getMetaFields(metaModal)) || [];
    return allFields;
  }

  return (
    <div className={classes.modelPayload}>
      <Paper variant="outlined" className={classes.paperParams}>
      <Line className={classes.line} />
      <div style={{display:"flex",flexDirection:"column",marginLeft:"10px"}}>
        <div>
          <Selection
            name="metaModal"
            title="Model"
            placeholder="meta modal"
            fetchAPI={fetchModels}
            optionLabelKey="name"
            onChange={(e) => {
              setMetaModal(e);
              resetCorrespondingFields(e);
            }}
            value={metaModal}
            classes={{ root: classes.inputSelect }}
          />
        </div>
        <div className={classes.modelParams}>
          <div className={classes.block}>
            <div>
              {modelPayload?.payloads?.map((payload, index) => {
                if (!payload.payloads) {
                  return (
                    <Payload
                      handleChange={handlePayloadChange}
                      key={index}
                      isModelSelected={Object.keys(metaModal ? metaModal : {})?.length !== 0}
                      getMetaFields={fetchField}
                      deletePayload={handleDelete}
                      payload={payload}
                      id={index}
                    />
                  );
                } else {
                  return (
                    <div style={{marginBottom:30}}>
                      <TextField
                        InputLabelProps="Payload"
                        className={classes.textField}
                        placeholder="Key"
                        value={payload.wsKey}
                        onChange={(e) =>
                          handleEmbeddedPayloadChange(
                            { ...payload, wsKey: e.target.value },
                            index,
                          )
                        }
                      />
                      <ModelPayload
                        key={index}
                        addPayload={addPayload}
                        modelPayload={payload}
                        id={index}
                        handleChangePayload={handleEmbeddedPayloadChange}
                        deleteModelPayload={handleDelete}
                      />
                    </div>
                  );
                }
              })}
            </div>
            <div className={classes.dialogTitle} style={{ marginTop: 20 }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 20,
                }}
              >
                <DialogTitle
                  id="simple-dialog-title"
                  onClick={() => handelAddPayload()}
                  className={classes.dialogTitle}
                >
                  Add payload
                </DialogTitle>
                <Add />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 20,
                }}
              >
                <DialogTitle
                  id="simple-dialog-title"
                  onClick={() => handelAddEmbeddedPayload()}
                  className={classes.dialogTitle}
                >
                  Add embedded payload
                </DialogTitle>
                <Add />
              </div>
            </div>
          </div>
        </div>
        </div>
      </Paper>
      <Delete onClick={() => deleteModelPayload(id)} className={classes.icon} />
    </div>
  );
}
