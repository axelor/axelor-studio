import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/core/styles';
import {getBool} from '../../utils';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 5,
  },
  label: {
    fontWeight: "bolder",
    color: "#666",
  },
  checkbox: {
    margin: '3px 3px 3px 0px',
  },
});

export default function Checkbox({entry, element, className, onChange}) {
  const classes = useStyles();
  const {
    id,
    name,
    label,
    modelProperty,
    get,
    set,
    defaultValue = false,
  } = entry || {};
  const [value, setValue] = useState(defaultValue);

  const setProperty = React.useCallback(
      (value) => {
          element.businessObject[name] = value;
      },
      [element.businessObject, name],
  );

  const getProperty = React.useCallback(() => {
    return getBool(
        element.businessObject[name] || element.businessObject.$attrs[name],
    );
  }, [element, name]);

  const updateValue = (e) => {
    onChange(e.target.checked);
    element.businessObject[name] = e.target.checked;
    setValue((value) => !value);
    if (set) {
      set(element, {
        [modelProperty]: e.target.checked,
      });
    } else {
      setProperty(e.target.checked);
    }
  };

  useEffect(() => {
    if (!element) return;
    let value;
    if (get) {
      const values = get(element);
      value = values && values[modelProperty];
    } else {
      value = getProperty();
      setProperty(value);
    }
    setValue(value);
  }, [element, modelProperty, get, getProperty, setProperty]);

  return (
    <div className={classnames(classes.root, className)}>
      <input
        id={`camunda-${id}`}
        type="checkbox"
        name={modelProperty}
        checked={value}
        onChange={updateValue}
        className={classes.checkbox}
      />
      {label && (
        <label htmlFor={`camunda-${id}`} className={classes.label}>
          {label}
        </label>
      )}
    </div>
  );
}
