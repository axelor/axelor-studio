import React from 'react';
import classnames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';

import { translate } from '../utils';
import { Button } from '@axelor/ui';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';

const useStyles = makeStyles(theme => ({
  button: {
    textTransform: 'none',
    minWidth: 64,
    maxWidth: 'fit-content',
  },
  buttonLabel: {
    maxHeight: 30,
  },
}));

function ButtonComp({
  title,
  icon = '',
  onClick,
  className,
  disabled = false,
  variant = 'primary',
}) {
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
  } else if (!icon) {
    return (
      <Button
        className={classnames(classes.button, classes.buttonLabel, className)}
        onClick={onClick}
        disabled={disabled}
        variant={variant}
      >
        {translate(title)}
      </Button>
    );
  } else
    return (
      <Button
        className={classnames(classes.button, classes.buttonLabel, className)}
        onClick={onClick}
        disabled={disabled}
        variant={variant}
        d="flex"
        alignItems="center"
        gap={4}
        outline
      >
        {translate(title)} <MaterialIcon icon={icon} fontSize={18} />
      </Button>
    );
}

export default ButtonComp;
