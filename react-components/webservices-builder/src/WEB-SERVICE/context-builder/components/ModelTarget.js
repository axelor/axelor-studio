import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/styles';
import {Paper} from '@material-ui/core';
import {Delete} from '@material-ui/icons';
import {getModels, getRecords} from '../../../services/api';
import { Selection } from '../../components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  paperParams: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 10,
    marginRight: 10,
    padding: 10,
    resize: 'both',
    width: '90%',
  },
  inputSelect: {
    marginLeft: '2%',
    marginRight: '2%',
    width: '96%',
    marginBottom: 10,
  },
  line: {
    width: '10%',
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

export default function ModelTarget({
  deleteModelTarget,
  modelTarget,
  id,
  handleChange,
}) {
  const classes = useStyles();
  const [metaModal, setMetaModal] = useState(modelTarget.model);
  const [target, setTarget] = useState(modelTarget.target);

  async function fetchModels() {
    return getModels();
  }

  return (
    <div className={classes.root}>
      <Paper variant="outlined" className={classes.paperParams}>
        <Selection
          name="metaModal"
          title="Model"
          placeholder="meta modal"
          fetchAPI={fetchModels}
          optionLabelKey="name"
          onChange={(e) => {
            setMetaModal(e);
            handleChange({...modelTarget, model: e}, id);
          }}
          value={metaModal}
          classes={{root: classes.inputSelect}}
        />
        <Selection
          name="name"
          title="name"
          placeholder="Target"
          optionLabelKey="name"
          classes={{root: classes.inputSelect}}
          value={target}
          onChange={(e) => {
            setTarget(e);
            handleChange({...modelTarget, target: e}, id);
          }}
          fetchAPI={() =>
           getRecords(metaModal)
          }
        />
      </Paper>
      <Delete onClick={() => deleteModelTarget(id)} className={classes.icon} />
    </div>
  );
}
