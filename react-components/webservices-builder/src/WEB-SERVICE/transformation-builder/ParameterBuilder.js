import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/styles';
import {
  Button,
  Dialog,
  DialogTitle,
  Paper,
  TextField,
} from '@material-ui/core';
const useStyles = makeStyles({
  filter: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  fieldSelect: {
    width: '25%',
  },
  param: {
    width: '70%',
    marginRight: '2%',
    justifyContent: 'center',
    '& .MuiInputBase-input': {
      padding: 0,
    },
  },
  delete: {
    color: '#0274d7',
    fontSize: 25,
    marginTop: 'auto',
  },
  icon: {
    color: '#0274d7',
    marginRight: '2%',
    marginLeft: '2%',
    marginTop: 'auto',
    fontSize: '1.5em',
  },
  dialogTitle: {
    'color': '#0274d7',
    'paddingLeft': 0,
    'paddingRight': 3,
    'paddingTop': 0,
    'paddingBottom': 0,
    'display': 'flex',
    'marginTop': 'auto',
    'flexDirection': 'row',
    'alignItems': 'center',
    '& #simple-dialog-title': {
      cursor: 'pointer',
      padding: 0,
    },
  },
  dialogPaper: {
    maxWidth: '25%',
    maxHeight: '35%',
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
  paper: {
    margin: 10,
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
  },
  baseModelParams: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems:'end',
    width: '100%',
  },
  addBaseModelParams: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    margin: 10,
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
  scrollDiv: {
    display: 'flex',
    flexDirection: 'column',
  },
});

export function ParameterBuilder({id,multiArg,parametersTrans,open,onClose,handleChange
}) {
  const classes = useStyles();
  const [parameters, setParemeters] = useState();

  useEffect(()=>{
    setParemeters(parametersTrans)
  },[parametersTrans])
  const renderComponent = (e, id) => {
    switch (e?.type) {
      case 'Decimal':
        return (
          <TextField
            placeholder={e?.name}
            value={parameters[id].value}
            type={e?.type}
            className={classes.param}
            onChange={(e) => {
              const p = Object.assign([],[...parameters]);
              p[id].value = e.target.value;
            }}
          />
        );
      default:
        return (
          <TextField
            placeholder={e?.name}
            value={parameters[id].value}
            type={e?.type}
            className={classes.param}
            onChange={(e) => {
              let newP = null;
                const p = Object.assign([],[...parameters]);
              newP = {...p[id]};
              newP.value = e.target.value;
              p[id] = newP
              setParemeters(p);
            }}
          />
        );
    }
  };

  return (
      <Dialog
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
        aria-labelledby="simple-dialog-title"
        open={open}
        classes={{
          paper: classes.dialogPaper,
        }}
      >
        <div style={{display:'flex',flexDirection:'row'}}>
        <DialogTitle id="simple-dialog-title">Parameters</DialogTitle>
        {multiArg && <DialogTitle id="simple-dialog-title" style={{marginLeft:'auto',color:'#0274d7',cursor:'pointer'}} onClick={()=>setParemeters([...parameters,{value:null,name:null}])}>Add parameter</DialogTitle>}
        </div>
        <div className={classes.root}>
          <Paper variant="outlined" className={classes.paper}>
            <div className={classes.baseModelParams}>
              <div className={classes.addBaseModelParams}>
                <div className={classes.scrollDiv}>
                  {parameters?.map((param, index) => {
                    return (
                      <div className={classes.baseModelParams} key={index}>
                        <p style={{fontSize: 14,width:'30%'}}>Parameter {index + 1} : {param.isOptional ? "(optional)" : ""}</p>
                        {renderComponent(param, index)}
                      </div>
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
                handleChange(parameters,id)
                onClose();
              }}
            >
              OK
            </Button>
            <Button
              className={classes.save}
              style={{textTransform: 'none'}}
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
  );
}
