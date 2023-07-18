import React from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: 5,
  },
  cercle: {
    width: 12,
    height: 12,
    borderRadius: 50,
    border: '1px solid #0274d7',
  },
  line: {
    marginTop: 3,
    width: 3,
    height: '95%',
    backgroundColor: '#0274d7',
  },
});

export default function Line({className}) {
  const classes = useStyles();

  return (
    <div className={classnames(classes.root, className)}>
      <div className={classes.cercle}></div>
      <div className={classes.line}></div>
    </div>
  );
}
