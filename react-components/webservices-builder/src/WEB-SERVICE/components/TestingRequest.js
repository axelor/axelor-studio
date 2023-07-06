import React from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/styles';

const useStyles = makeStyles({
  desciption: {
    marginTop: 5,
    minHeight: '400px',
    backgroundColor: '#656565',
    borderRadius: '15px',
  },
  title: {
    backgroundColor: '#424242',
    color: 'white',
    padding: '7px',
    borderTopRightRadius: '10px',
    borderTopLeftRadius: '10px',
  },
  checkbox: {
    'color': 'white',
    'fontSize': 50,
    '&.Mui-checked': {
      color: '#0275d8',
    },
    '& .MuiSvgIcon-root': {fontSize: 22},
  },
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  success: {
    backgroundColor: 'white',
    color: 'green',
    padding: 5,
    margin: 15,
  },
  error: {
    backgroundColor: 'white',
    color: 'red',
    padding: 5,
    margin: 15,
  },
  btn: {
    'display': 'flex',
    'flexDirection': 'column',
    'margin': 10,
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'color': 'white',
    'alignItems': 'center',
    'justifyContent': 'center',
    'textDecoration': 'none',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  formControlLabel: {
    'marginLeft': '1%',
    '&.MuiFormControlLabel-root': {
      color: 'white',
    },
  },
  label: {
    fontWeight: 'bolder',
    display: 'inline-block',
    verticalAlign: 'middle',
    color: 'white',
    marginBottom: 3,
  },
  notAuth: {
    color: 'red',
  },
});

export default function TestingRequest({
  label,
  element,
  bpmnModeler,
  entry,
  action,
}) {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {label && <label className={classnames(classes.label)}>{label}</label>}
    </div>
  );
}
