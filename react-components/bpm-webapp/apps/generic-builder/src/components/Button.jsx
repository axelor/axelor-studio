import React from 'react';
import classnames from 'classnames';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';

import { translate } from '../utils';

const useStyles = makeStyles(theme => ({
  button: {
    textTransform: 'none',
    color: '#0275d8',
  },
  buttonLabel: {
    maxHeight: 30,
  },
}));

function ButtonComp({ title, Icon, onClick, className, disabled = false }) {
  const classes = useStyles();
  if (!title) {
    return (
      <IconButton
        size="medium"
        onClick={onClick}
        className={classnames(classes.button, className)}
        style={{ padding: '0px 12px' }}
        disabled={disabled}
      >
        <Icon fontSize="small" />
      </IconButton>
    );
  }

  if (!Icon) {
    return (
      <Button
        className={classnames(classes.button, classes.buttonLabel, className)}
        onClick={onClick}
        disabled={disabled}
      >
        {translate(title)}
      </Button>
    );
  }

  return (
    <Button
      className={classnames(classes.button, classes.buttonLabel, className)}
      endIcon={<Icon />}
      onClick={onClick}
      disabled={disabled}
    >
      {title}
    </Button>
  );
}

export default ButtonComp;
