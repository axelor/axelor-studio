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
import {useDispatch, useSelector} from 'react-redux';
import {updateTarget} from './features/contextReducer';
import ModelTarget from './components/ModelTarget';

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: theme.spacing(1),
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
  },

  dialogPaper: {
    maxWidth: '70%',
    maxHeight: '80%',
    resize: 'both',
    width: '70%',
    height: '60%',
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
    overflow:"auto",
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
    marginBottom:20
  },
}));

function ContextBuilder({handleClose, open}) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const targetsFromStore = useSelector((state) => state.contextReducer.targets);
  const [openAlert, setAlert] = React.useState(false);
  const [alertConfig] = React.useState({
    alertMessage: 'Add all values',
    alertTitle: 'Error',
  });
  // const [isClose, setClose] = React.useState(false);
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    if (targetsFromStore?.length === 0) {
      setTargets([{model: null, target: null}]);
    } else {
      setTargets(targetsFromStore);
    }
  }, [targetsFromStore]);
  const handleSave = () => {
    if (!isAllFields()) {
      setAlert(true);
    } else {
      dispatch(updateTarget(targets));
      handleClose();
    }
  };
  const isAllFields = () => {
    let empty = true;
    targets.forEach((target) => {
      if (target.model == null || target.target == null) {
        empty = false;
        return;
      }
    });
    return empty;
  };

  const onCancel = () => {
    handleClose();
  };

  const handelAddModelParameter = () => {
    setTargets([...targets, {model: null, target: null}]);
  };

  const deleteModelTarget = (id) => {
    const targetsModel = targets.filter((modelTarget, index) => index !== id);
    setTargets(targetsModel);
  };

  const handleChange = useCallback(
      (target, id) => {
        const modelTargets = [...targets];
        modelTargets[id] = target;
        setTargets(modelTargets);
      },
      [targets],
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
      <DialogTitle id="simple-dialog-title">Build Contexts</DialogTitle>
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
                  Add model context
                </DialogTitle>
                <Add />
              </div>
              <div className={classes.scrollDiv}>
                {targets?.map((modelTarget, index) => {
                  return (
                    <ModelTarget
                      key={index}
                      deleteModelTarget={deleteModelTarget}
                      handleChange={handleChange}
                      id={index}
                      modelTarget={modelTarget}
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
                setAlert(false);
              }}
              color="primary"
              autoFocus
              className={classes.save}
            >
              Ok
            </Button>
            <Button
              onClick={() => {
                setAlert(false);
              }}
              color="primary"
              autoFocus
              style={{textTransform: 'none'}}
              className={classes.save}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

export default ContextBuilder;
