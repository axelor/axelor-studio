import React, {useCallback, useEffect, useState} from 'react';
import {
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import {Add} from '@material-ui/icons';
import Line from '../components/Line';
import ModelParameter from './components/ModelParameter';
import {useDispatch, useSelector} from 'react-redux';
import {updateModelParam} from './features/requestReducer';

const useStyles = makeStyles((theme) => ({
  saveButtonText: {
    marginLeft: 10,
  },
  saveMessageAlert: {
    width: '100%',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
  },
  paper: {
    margin: theme.spacing(1),
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
  },
  dialog:{
    width:'20%'
  },
  dialogPaper: {
    maxWidth: '70%',
    maxHeight: '700px',
    minWidth:'950px',
    resize: 'both',
    width: '70%',
    height: '90%',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: '100%',
    overflow: 'hidden',
  },
  save: {
    'margin': theme.spacing(1),
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'color': 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  baseModelParams: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
  },
  modelParams: {
    display: 'flex',
    flexDirection: 'row',
    width: '90%',
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
  scrollDiv: {
    overflow: 'auto',
    height: 550,
  },
}));

function RequestBuilder({
  handleClose,
  open,
  action,
}) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const modelParametersStore = useSelector(
      (state) => state.requestReducer.modelParameters,
  );
  const [modelParameters, setModelParameters] = useState([]);
  const [alertConfig, setAlertConfig] = React.useState({
    openAlert:false,
    alertMessage: 'Add all values',
    alertTitle: 'Error',
  });
  useEffect(() => {
    if (modelParametersStore.length === 0) {
      setModelParameters([
        {
          model: {},
          parameters: [{wsKey: '', wsValue: null, transformations: []}],
        },
      ]);
    } else {
      if (action === 'ADD') {
        setModelParameters([
          {
            model: {},
            parameters: [{wsKey: '', wsValue: null, transformations: []}],
          },
        ]);
      } else {
        setModelParameters(modelParametersStore);
      }
    }
  }, [action, modelParametersStore]);

  const handleSave = () => {
    if (!isAllFields()) setAlertConfig({...alertConfig,openAlert:true});
    else {
      dispatch(
          updateModelParam(
          action === 'EDIT' ?
            modelParameters :
            [...modelParametersStore, ...modelParameters],
          ),
      );
      handleClose();
    }
  };
  useEffect(() => {}, [modelParameters]);

  const isAllFields = () => {
    let empty = true;
    modelParameters.forEach((model) => {
      model.parameters.forEach((param) => {
        if (param.wsKey.length === 0 || param.wsValue === null) {
          empty = false;
          return;
        }
      });
    });
    return empty;
  };

  const onCancel = () => {
    handleClose();
  };

  const handelAddModelParameter = () => {
    setModelParameters([
      ...modelParameters,
      {
        model: {},
        parameters: [{wsKey: '', wsValue: null, transformations: []}],
      },
    ]);
  };

  const handelDeleteModelParam = (id) => {
    const newModelParam = modelParameters.filter(
        (modelParam, index) => index !== id,
    );
    setModelParameters(newModelParam);
  };
  const addParameter = (id, param) => {
    const newModelParameter = Object.assign([], modelParameters);
    const b = Object.assign([], newModelParameter[id].parameters);
    b.push(param);
    newModelParameter[id] = {...newModelParameter[id], parameters: b};
    setModelParameters(newModelParameter);
  };
  const handleChangeModelParam = useCallback(
      (modelParam, id) => {
        const newModelParam = [...modelParameters];
        newModelParam[id] = modelParam;
        setModelParameters(newModelParam);
      },
      [modelParameters],
  );

  return (
    <Dialog
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      aria-labelledby="simple-dialog-title"
      open={open}
      classes={{
        paper: classes.dialogPaper,
      }}
    >
      <DialogTitle id="simple-dialog-title">Build Parametres</DialogTitle>
      <div className={classes.root}>
        <Paper variant="outlined" className={classes.paper}>
          <div className={classes.baseModelParams}>
            <Line className={classes.line}></Line>
            <div className={classes.addBaseModelParams}>
              <div className={classes.dialogTitle}>
                <DialogTitle
                  id="simple-dialog-title"
                  className={classes.dialogTitle}
                  onClick={handelAddModelParameter}
                >
                  Add base model parameters
                </DialogTitle>
                <Add />
              </div>
              <div className={classes.scrollDiv}>
                {modelParameters?.map((modelParam, index) => {
                  return (
                    <ModelParameter
                      handleChangeParam={handleChangeModelParam}
                      key={index}
                      addParameter={addParameter}
                      modelParameter={modelParam}
                      deleteModelParam={handelDeleteModelParam}
                      id={index}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Paper>
        <div>
          <Button className={classes.save} onClick={handleSave}>
            OK
          </Button>
          <Button
            className={classes.save}
            onClick={onCancel}
            style={{textTransform: 'none'}}
          >
            Cancel
          </Button>
        </div>
      </div>
      {alertConfig.openAlert && (
        <Dialog
          open={alertConfig.openAlert}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setAlertConfig({...alertConfig,openAlert:false});
            }
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          classes={{
            paper: classes.dialog,
          }}
        >
          <DialogTitle id="alert-dialog-title">
            {alertConfig.alertTitle}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {alertConfig.alertMessage}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setAlertConfig({...alertConfig,openAlert:false});
                if (alertConfig.openAlert) {
                  setAlertConfig({...alertConfig,openAlert:false});
                }
              }}
              color="primary"
              autoFocus
              className={classes.save}
            >
              Ok
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

export default RequestBuilder;
