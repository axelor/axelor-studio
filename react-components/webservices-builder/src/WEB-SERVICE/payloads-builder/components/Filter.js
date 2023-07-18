import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Delete} from '@material-ui/icons';
import {Selection} from '../../expression-builder/components';

const useStyles = makeStyles({
  modelParams: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  textField: {
    justifyContent: 'center',
    alignItems: 'center',
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
  fieldSelect: {
    width: '30%',
    marginRight: '2%',
  },
  delete: {
    color: '#0274d7',
    fontSize: 25,
    marginTop: 'auto',
  },
  paper: {
    margin: 10,
    width: `calc(100% - 16px)`,
    display: 'flex',
    height: 'calc(100% - 50px)',
    overflow: 'hidden',
  },
  paperParams: {
    maxHeight: '70%',
    resize: 'both',
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
    maxWidth: '70%',
    maxHeight: '80%',
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

export default function Filter({
  id,
  deleteFilter,
  handleTransformation,
  dataTransformation,
}) {
  const classes = useStyles();
  const [data, setData] = useState(
    dataTransformation?.filter?.library?.length !== 0 ?
      dataTransformation :
      {id: id, filter: {library: '', operation: ''}},
  );

  useEffect(() => {
    handleTransformation(data);
  }, [data, handleTransformation]);

  const optionsLibrary = [{name: 'Math', title: 'math'}];
  const optionsOperation = [
    {name: 'addition', title: 'addition'},
    {name: 'division', title: 'division'},
  ];
  return (
    <div className={classes.modelParams}>
      <Selection
        name="library"
        title="Library"
        placeholder="Libary"
        optionLabelKey="name"
        value={data.filter.library}
        className={classes.fieldSelect}
        onChange={(change) => {
          setData({...data, filter: {...data.filter, library: change}});
        }}
        options={optionsLibrary}
      />
      <Selection
        name="operation"
        title="Operation"
        placeholder="Operation"
        optionLabelKey="name"
        value={data.filter.operation}
        className={classes.fieldSelect}
        onChange={(change) => {
          setData({...data, filter: {...data.filter, operation: change}});
        }}
        options={optionsOperation}
      />
      <Delete onClick={() => deleteFilter(id)} className={classes.delete} />
    </div>
  );
}
