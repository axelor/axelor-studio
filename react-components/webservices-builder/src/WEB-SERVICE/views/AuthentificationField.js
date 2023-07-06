import React from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/styles';
import {Add, Edit} from '@material-ui/icons';
import {TextField} from '../components';

const useStyles = makeStyles({
  root: {
    marginTop: 5,
    width: '100%',
  },
  error: {
    color: '#CC3333',
  },
  label: {
    fontWeight: 'bolder',
    display: 'inline-block',
    verticalAlign: 'middle',
    color: 'white',
    marginBottom: 3,
  },
  containerTable: {
    display: 'flex',
    flexDirection: 'row',
  },
  newIcon: {
    color: '#58B423',
    marginLeft: 5,
  },
});

export default function AuthentificationField({element, entry}) {
  const {label} = entry || {};
  const classes = useStyles();

  return (
    <div className={classnames(classes.root, false && classes.error)}>
      {label && <label className={classnames(classes.label)}>{label}</label>}
      <div className={classnames(classes.containerTable)}>
        <TextField />
        <Edit className={classes.newIcon} />
        <Add className={classes.newIcon} />
      </div>
    </div>
  );
}
