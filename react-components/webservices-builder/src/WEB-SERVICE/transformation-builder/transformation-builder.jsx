import React, {useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Selection} from '../components';
import classNames from 'classnames';
import {
  getLabraries,
  getParams,
  getTransformations,
} from '../../services/api';
import {
  DialogTitle,
} from '@material-ui/core';
import {ArrowRightAlt, Delete, Edit} from '@material-ui/icons';
import { ParameterBuilder } from './ParameterBuilder';

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
    'width': '70%',
    'marginRight': '2%',
    'justifyContent': 'center',
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

export function Filter({
  id,
  trans,
  handleChange,
  className,
  deleteTransformation,
}) {
  const classes = useStyles();
  const [transformation, setTransformation] = useState(trans);
  const [showParam, setShowParam] = useState(false);

  const fetchParams = async (e) => {
    const res = await getParams(e?.id);
    return res;
  };

  return (
    <div className={classNames(classes.filter, className)}>
      <Selection
        name="library"
        title="Library"
        placeholder="Libary"
        optionLabelKey="name"
        className={classes.fieldSelect}
        fetchAPI={getLabraries}
        onChange={(e) => {
          setTransformation({...transformation, library: e});
          handleChange({...trans, library: e}, id);
        }}
        value={transformation?.library}
      />
      <ArrowRightAlt className={classes.icon} style={{fontSize: 24}} />
      <Selection
        name="operation"
        title="Operation"
        placeholder="Operation"
        optionLabelKey="name"
        className={classes.fieldSelect}
        value={transformation?.operation}
        fetchAPI={() => getTransformations(transformation?.library?.id)}
        onChange={async(e) => {
          setTransformation({...transformation, operation: e});
          let params = await fetchParams(e);
          setTransformation({...trans, operation: {...e,parameters:params}})
          handleChange({...trans, operation: {...e,parameters:params}}, id);
          if (e?.parameters?.length !== 0) setShowParam(true);
        }}
      />
      {transformation?.operation?.parameters && transformation?.operation?.parameters?.length !== 0 && (
        <>
          <DialogTitle
            id="simple-dialog-title"
            className={classes.dialogTitle}
            style={{cursor: 'pointer', marginLeft: '2%', height: '1.5em'}}
            onClick={() => {setShowParam(true);}}
          >
            Parameters
          </DialogTitle>
          <Edit className={classes.icon} style={{marginLeft: 0}} />
        </>
      )}
      <Delete
        className={classes.icon}
        style={{marginLeft: 'auto', marginRight: '15%', fontSize: 25}}
        onClick={() => deleteTransformation(id)}
      />
    {showParam && <ParameterBuilder id={id} open={showParam} parametersTrans={transformation?.operation?.parameters} handleChange={(params,id)=>{setTransformation({...trans, operation: {...transformation.operation,parameters:params}}, id);handleChange({...trans, operation: {...transformation.operation,parameters:params}}, id)}} multiArg={transformation?.operation?.multiArg} onClose={()=>{setShowParam(false)}}/> }
    </div>
  );
}
