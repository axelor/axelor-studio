import React, {useEffect, useState} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Tooltip,
} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import {Edit, NotInterested} from '@material-ui/icons';
import {translate} from '../../utils';
import {Textbox} from '../components';
import ExpressionBuilder from '../expression-builder';
import { getAllModels, getMetaModels } from '../../services/api';

const useStyles = makeStyles((theme) => ({
  expressionBuilder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newIcon: {
    color: '#58B423',
    marginLeft: 5,
  },
  new: {
    cursor: 'pointer',
    marginTop: 18.6,
    display: 'flex',
  },
  textbox: {
    width: '100%',
    color:'white'
  },
  dialog: {
    minWidth: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  save: {
    'margin': theme.spacing(1),
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'textTransform': 'none',
    'color': 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
}));

export default function ScriptProps({element, bpmnModeler,entry}) {
  const [openAlert, setAlert] = useState(false);
  const [openMapper, setMapper] = useState(false);
  const [alertTitle, setAlertTitle] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const {name,label} = entry;
  const [isReadOnly, setReadOnly] = useState(element?.businessObject[name]?.value ? true : false);
  const classes = useStyles();
  const handleMapperOpen = () => {
    setMapper(true);
  };
  useEffect(()=>{
    if(element.businessObject[name]?.value) setReadOnly(true)
    else setReadOnly(false);
  },[element.businessObject, name, openMapper]);

  return (
    <React.Fragment>
      <div className={classes.expressionBuilder}>
        <Textbox
          element={element}
          className={classes.textbox}
          rows={1}
          readOnly={isReadOnly}
          bpmnModeler={bpmnModeler}
          entry={{
            id: 'script',
            label: translate(label),
            modelProperty: 'script',
            name: name,
          }}
        />
        <div className={classes.new}>
          <Tooltip title="Enable" aria-label="enable">
            <NotInterested
              className={classes.newIcon}
              onClick={() => {
                if (element.businessObject[name].value) {
                  setAlertMessage(
                      'Script can\'t be managed using builder once changed manually.',
                  );
                  setAlertTitle('Warning');
                  setAlert(true);
                }
              }}
            />
          </Tooltip>
          <Edit
            className={classes.newIcon}
            onClick={() => {
              handleMapperOpen();
            }}
          />
          {openAlert && (
            <Dialog
              open={openAlert}
              onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                  setAlert(false);
                }
              }}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              classes={{
                paper: classes.dialog,
              }}
            >
              <DialogTitle id="alert-dialog-title">
                <label className={classes.title}>{translate(alertTitle)}</label>
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  {translate(alertMessage)}
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    setAlert(false);
                    setAlertMessage(null);
                    setAlertTitle(null);
                    setReadOnly(false);
                    if (element.businessObject) {
                      element.businessObject.scriptValue = undefined;
                    }
                  }}
                  color="primary"
                  className={classes.save}
                  autoFocus
                >
                  Ok
                </Button>
                <Button
                  onClick={() => {
                    setAlert(false);
                  }}
                  color="primary"
                  className={classes.save}
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </div>
      { openMapper && <ExpressionBuilder setProperty={(val) => {
        if(val.value != null) element.businessObject[name] = {...val}
      }
      }
        getExpression={() => {
          let values;
          if (element.businessObject[name]?.value !== undefined) {
            try {
              values = JSON.parse(element.businessObject[name].value);
            } catch (errror) { }
          }
          return { values: values, combinator: element.businessObject[name]?.combinator } ;
        }} open={openMapper} handleClose={() => setMapper(false)} fetchModels={getMetaModels} /> }
      </div>
    </React.Fragment>
  );
}
