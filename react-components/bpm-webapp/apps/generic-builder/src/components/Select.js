import React from 'react';
import classnames from 'classnames';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';

import { makeStyles } from '@material-ui/core/styles';
import { translate } from '../utils';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  select: {
    width: '150px',
  },
}));

export default function Selection({
  name,
  value = '',
  onChange,
  options,
  title,
  className,
  disableUnderline = false,
  ...rest
}) {
  const classes = useStyles();
  return (
    <FormControl className={classnames(classes.formControl, className)}>
      <InputLabel>{translate(title)}</InputLabel>
      <Select
        disableUnderline={disableUnderline}
        value={value}
        onChange={e => onChange(e.target.value)}
        name={name}
        style={{ marginRight: 8 }}
        classes={{ select: classnames(classes.select, className) }}
        {...rest}
      >
        {options &&
          Array.isArray(options) &&
          options.map(({ name, title }, index) => (
            <MenuItem value={name} key={index}>
              {title}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
