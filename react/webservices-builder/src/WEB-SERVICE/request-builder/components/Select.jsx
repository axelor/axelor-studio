import React from 'react';
import classnames from 'classnames';
import MenuItem from '@material-ui/core/MenuItem';
import {Select, FormControl, InputLabel} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  formControl: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  select: {
    width: '100%',
  },
}));

export default function Selection({
  name,
  value = '',
  onChange,
  options,
  title,
  className,
  ...rest
}) {
  const classes = useStyles();
  return (
    <FormControl className={classnames(classes.formControl, className)}>
      <InputLabel>{title}</InputLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        name={name}
        style={{marginRight: 8}}
        classes={{select: classes.select}}
        {...rest}
      >
        {options &&
          Array.isArray(options) &&
          options.map(({name, title}, index) => (
            <MenuItem value={name} key={index}>
              {name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
