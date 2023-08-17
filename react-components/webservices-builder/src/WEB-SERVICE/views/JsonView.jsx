import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import {groovy} from '../../utils';
import {Button, Dialog, DialogTitle} from '@material-ui/core';
import {prettyPrintJson} from 'pretty-print-json';  
import classNames from 'classnames';
const useStyles = makeStyles({
  table: {
    'height': '199px !important',
    'borderRadius': '0px !important',
    '& .MuiTableCell-root': {
      padding: '10px',
      paddingLeft: '40px',
    },
  },
  save: {
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'margin': 12,
    'color': 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  console: {
    margin: 0,
    padding: 10,
    fontSize: '1.1em',
  },
  box: {
    '& > div > div > div': {
      borderBottom: '1px solid black',
    },
  },
  paper: {
    margin: 10,
    width: `calc(100% - 16px)`,
    height: 'calc(100% - 50px)',
    overflow: 'scroll',
    backgroundColor:'black'
  },
  dialogTitle: {
    'color': '#0274d7',
    'paddingLeft': 0,
    'paddingRight': 3,
    'display': 'flex',
    'flexDirection': 'row',
    'fontSize': 15,
    'alignItems': 'center',
    'width': '20%',
    '& #simple-dialog-title': {
      cursor: 'pointer',
      width: 'auto',
    },
    '& .MuiTypography-h6': {
      fontSize: '1em',
    },
  },
  dialogPaper: {
    maxWidth: '50%',
    height: '60%',
    resize: 'both',
    width: '50%',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: '100%',
    overflow: 'hidden',
  },
  tableBody: {
    minWidth: '100%',
    // backgroundColor:"black !important"
  },
});

export default function JsonViewer({showJson, models, type, setShowJson}) {
  const classes = useStyles();

  function effect() {
    const json = {};
    models.forEach((model) => {
      model[type]?.forEach((element) => {
        json[element.wsKey] = groovy(element, model.model);
      });
    });
    const options = {linkUrls: true, quoteKeys: true};
    if (document.getElementById('result') != null) {
      document.getElementById('result').innerHTML = '';
    }
    document.getElementById('result').innerHTML = prettyPrintJson.toHtml(
        json,
        options,
    );
  }

  return (
    <>
      <Dialog
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
          }
        }}
        onEntered={effect}
        aria-labelledby="simple-dialog-title"
        open={showJson}
        classes={{
          paper: classes.dialogPaper,
        }}
      >
        <DialogTitle id="simple-dialog-title">Payloads json</DialogTitle>
        <div className={classes.root}>
          <Paper variant="outlined" className={classes.paper}>
            <pre
              id="result"
              className={classNames(['json-container', classes.console])}
            ></pre>
          </Paper>
          <div>
            <Button
              className={classes.save}
              onClick={() => {
                setShowJson(false);
              }}
            >
              OK
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
