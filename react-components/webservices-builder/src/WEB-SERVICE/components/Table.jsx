import React, {useEffect, useState} from 'react';
import {withStyles, makeStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import {useSelector} from 'react-redux';
import {getGroovyBasicPayload, groovy} from '../../utils';
import {Button} from '@material-ui/core';
import JsonViewer from '../views/JsonView';
import { COLUMNS } from '../constants';

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: '#A3A3A3',
    color: theme.palette.common.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 10,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

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
    'color': 'white',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  paper: {
    margin: 10,
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
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
  tableBody: {
    minWidth: '100%',
    // backgroundColor:"black !important"
  },
});

export default function CustomizedTables({type}) {
  const modelParameters = useSelector(
      (state) => state.requestReducer.modelParameters,
  );
  const modelPayloads = useSelector(
      (state) => state.payloadReducer.modelPayloads,
  );
  const headers = useSelector((state) => state.headerReducer.headers);
  const [models, setModels] = useState([]);
  const [showJson, setShowJson] = useState(false);
  const classes = useStyles();
  useEffect(() => {
    if (type === 'parameters') {
      setModels(modelParameters);
    } else if (type === 'payloads') {
      setModels(modelPayloads);
    } else {
      if (type === 'headers') {
        setModels(headers);
      }
    }
  }, [headers, modelParameters, modelPayloads, type]);

  return (
    <>
      {models?.length !== 0 && (
        <TableContainer className={classes.table} component={Paper}>
          <Table aria-label="customized table">
            <TableHead>
              <TableRow>
                {COLUMNS?.map((column, id) => {
                  return (
                    <StyledTableCell width="50%" key={id}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <span>{column.title}</span>
                        {id === 1 && type !== "headers"  && (
                          <Button
                            className={classes.save}
                            onClick={() => setShowJson(true)}
                            style={{marginLeft: 'auto'}}
                          >
                            Json
                          </Button>
                        )}
                      </div>
                    </StyledTableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody className={classes.tableBody}>
              {type !== 'headers' ?
                type === 'payloads' ?
                  models?.map((model) =>
                    model[type]?.map((element) => {
                      return (
                        <StyledTableRow key={element.id}>
                          <StyledTableCell component="th" scope="row">
                            {element.wsKey}
                          </StyledTableCell>
                          <StyledTableCell>
                            {JSON.stringify(groovy(element, model.model))}
                          </StyledTableCell>
                        </StyledTableRow>
                      );
                    }),
                  ) :
                  models?.map((model) =>
                    model[type]?.map((element) => {
                      return (
                        <StyledTableRow key={element?.id}>
                          <StyledTableCell component="th" scope="row">
                            {element?.wsKey}
                          </StyledTableCell>
                          <StyledTableCell>
                          {JSON.stringify(groovy(element, model.model))}
                          </StyledTableCell>
                        </StyledTableRow>
                      );
                    }),
                  ) :
                headers?.map((header) => (
                  <StyledTableRow key={header.id}>
                    <StyledTableCell component="th" scope="row">
                      {header.wsKey}
                    </StyledTableCell>
                    <StyledTableCell>{header.wsValue}</StyledTableCell>
                  </StyledTableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {showJson && (
        <JsonViewer
          type={type}
          models={models}
          showJson={showJson}
          setShowJson={setShowJson}
        />
      )}
    </>
  );
}
