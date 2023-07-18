import React, {useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {DialogTitle, Paper} from '@material-ui/core';
import {Add, Delete} from '@material-ui/icons';
import Line from '../../components/Line';
import Parameter from './Parameter';
import {getModels} from '../../../services/api';
import { Selection } from '../../components';

const useStyles = makeStyles({
  modelParameter: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom:'1.5%'
  },
  paperParams: {
    marginTop: 10,
    resize: 'both',
    width: '100%',
    marginRight: 10,
  },
  inputSelect: {
    marginLeft: '2%',
    marginRight: '2%',
    width: '96%',
    marginBottom: 10,
  },
  modelParams: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  line: {
    width: '10%',
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
  },
  icon: {
    color: '#0274d7',
    margin: 20,
    fontSize: 30,
  },
});

export default function ModelParameter({
  handleChangeParam,
  deleteModelParam,
  modelParameter,
  addParameter,
  id,
}) {
  const classes = useStyles();
  const [metaModal, setMetaModal] = useState(modelParameter?.model);

  const handelAddParameter = () => {
    addParameter(id, {wsKey: '', wsValue: null, transformations: []});
  };

  const handleParameterChange = (param, idParam) => {
    const newModelParameter = Object.assign(
        {},
        {...modelParameter, model: metaModal},
    );
    const b = Object.assign([], newModelParameter.parameters);
    b[idParam] = param;
    handleChangeParam({model: metaModal, parameters: b}, id);
  };

  const handleDelete = (idParam) => {
    let newModelParameter = [...modelParameter.parameters];
    newModelParameter = newModelParameter.filter(
        (par, index) => index !== idParam,
    );
    handleChangeParam({...modelParameter, parameters: newModelParameter}, id);
  };

  async function fetchModels() {
    return getModels();
  }

  return (
    <div className={classes.modelParameter}>
      <Paper variant="outlined" className={classes.paperParams}>
        <Selection
          name="metaModal"
          title="Model"
          placeholder="meta modal"
          fetchAPI={fetchModels}
          optionLabelKey="name"
          onChange={(e) => {
            setMetaModal(e);
          }}
          value={metaModal}
          classes={{root: classes.inputSelect}}
        />
        <div className={classes.modelParams}>
          <Line className={classes.line} />
          <div className={classes.block}>
            <div>
              {modelParameter?.parameters?.map((param, index) => {
                return (
                  <Parameter
                    handleChange={handleParameterChange}
                    key={index}
                    model={modelParameter.model}
                    correspondingFields={metaModal?.type === "metaModel" ? metaModal?.metaFields : (metaModal?.type === "metaJsonModel" ? metaModal?.fields : metaModal?.fields )}
                    deleteParam={handleDelete}
                    parameter={param}
                    id={index}
                  />
                );
              })}
            </div>
            <div className={classes.dialogTitle}>
              <DialogTitle
                id="simple-dialog-title"
                onClick={() => handelAddParameter()}
                className={classes.dialogTitle}
              >
                Add parameter
              </DialogTitle>
              <Add />
            </div>
          </div>
        </div>
      </Paper>
      <Delete onClick={() => deleteModelParam(id)} className={classes.icon} />
    </div>
  );
}
