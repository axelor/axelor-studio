import React from 'react';
import classnames from 'classnames';
import IconButton from '../iconButton/iconButton';

import { translate } from '../../common/utils';
import { Button } from '@axelor/ui';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';
import styles from './Button.module.css';

function ButtonComp({
  title,
  icon = '',
  onClick,
  className,
  disabled = false,
  variant = 'primary',
}) {
  if (!title) {
    return (
      <IconButton
        size="medium"
        onClick={onClick}
        className={classnames(styles.button, className)}
        style={{ padding: '0px 12px' }}
        disabled={disabled}
      >
        <MaterialIcon icon={icon} fontSize="small" />
      </IconButton>
    );
  } else if (!icon) {
    return (
      <Button
        className={classnames(styles.button, styles.buttonLabel, className)}
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
        className={classnames(styles.button, styles.buttonLabel, className)}
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
