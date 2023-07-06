import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  makeStyles,
  Paper,
} from '@material-ui/core';
import {Add} from '@material-ui/icons';
import {useEffect, useState} from 'react';
import Line from '../components/Line';
import {Filter} from './transformation-builder';

const useStyles = makeStyles({
  modelParams: {
    display: 'flex',
    flexDirection: 'row',
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
  delete: {
    color: '#0274d7',
    margin: 'auto',
    fontSize: 25,
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

export const TransformationBuilder = ({
  initialData,
  open,
  handleClose,
  onSave,
}) => {
  const classes = useStyles();
  const [transformation, setTransformation] = useState([]);

  useEffect(() => {
    if (initialData == null || initialData?.length === 0) {
      setTransformation([
        {
          library: {},
          operation: {name: '', value: '', parameters: null},
        },
      ]);
    } else setTransformation(initialData);
  }, [initialData]);

  const addFilter = () => {
    setTransformation([
      ...transformation,
      {
        library: {},
        operation: {name: '', value: '', parameters: null},
      },
    ]);
  };
  const deleteFilter = (id) => {
    const newTrans = transformation.filter((value, index) => index !== id);
    setTransformation([...newTrans]);
  };
  const handleTransformation = (newTrans, id) => {
    const trans = [...transformation];
    trans[id] = newTrans;
    setTransformation(trans);
  };

  return (
    <Dialog
      onClose={(_e, reason) => {
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
      <DialogTitle id="simple-dialog-title">Data transformation</DialogTitle>
      <div className={classes.root}>
        <Paper variant="outlined" className={classes.paper}>
          <div className={classes.baseModelParams}>
            <Line className={classes.line}></Line>
            <div className={classes.addBaseModelParams}>
              <div className={classes.dialogTitle}>
                <DialogTitle
                  id="simple-dialog-title"
                  className={classes.dialogTitle}
                  onClick={() => addFilter()}
                >
                  Add filter
                </DialogTitle>
                <Add />
              </div>
              <div>
                {transformation?.map((filter, index) => {
                  return (
                    <Filter
                      trans={filter}
                      handleChange={(trans, id) =>
                        handleTransformation(trans, id)
                      }
                      key={index}
                      id={index}
                      deleteTransformation={(id) => deleteFilter(id)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </Paper>
        <div>
          <Button
            className={classes.save}
            onClick={() => {
              onSave(transformation);
              handleClose();
            }}
          >
            OK
          </Button>
          <Button
            className={classes.save}
            style={{textTransform: 'none'}}
            onClick={() => {
              handleClose();
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
