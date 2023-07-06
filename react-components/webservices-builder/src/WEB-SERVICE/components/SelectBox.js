import React, {useState, useEffect} from 'react';
import {makeStyles} from '@material-ui/styles';

import Description from './Description';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    
    marginTop: 5,
  },
  label: {
    display: 'inline-block',
    verticalAlign: 'middle',
    fontWeight: "bolder",
    color: "#666",
    marginBottom: 3,
  },
  select: {
    pointerEvents: 'none',
  },
});

export default function SelectBox({entry, element, onChange,disabled}) {
  const classes = useStyles();
  const {
    id,
    name,
    emptyParameter,
    selectOptions,
    canBeDisabled = disabled,
    canBeHidden,
    label,
    modelProperty,
    description,
    set,
    get,
  } = entry || {};
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const setProperty = (value) => {
    element.businessObject[name] = value;
  };
  const getProperty = React.useCallback(() => {
    return element.businessObject[name];
  }, [element, name]);

  const handleChange = (e) => {
    setSelectedOption(e.target.value);
    if (!set && !setProperty) return;
    if (set) {
      set(element, {
        [modelProperty]: e.target.value,
      });
    } else {
      setProperty(e.target.value);
      onChange();
    }
  };

  useEffect(() => {
    if (!element) return;
    const values = get && get(element);
    const value = getProperty ?
      getProperty(element) :
      values && values[modelProperty];
    setSelectedOption(value);
  }, [element, modelProperty, get, getProperty]);

  useEffect(() => {
    if (typeof selectOptions === 'object') {
      setOptions(selectOptions);
    } else {
      const dynamicOptions = selectOptions(element);
      if (dynamicOptions) {
        setOptions(dynamicOptions);
      }
    }
  }, [selectOptions, element]);

  return (
    <div className={classes.root}>
      <label htmlFor={`camunda-${id}`} className={classes.label}>
        {label}
      </label>
      <select
        id={`camunda-${id}-select`}
        name={modelProperty}
        data-disable={canBeDisabled ? 'isDisabled' : ''}
        data-show={canBeHidden ? 'isHidden' : ''}
        value={selectedOption || ''}
        onChange={handleChange}
        className={canBeDisabled ? classes.select : ''}
      >
        {options &&
          options.map((option, index) => (
            <option value={option.value} key={index}>
              {option.name ? option.name : ''}{' '}
            </option>
          ))}
        {emptyParameter && <option value=""></option>}
      </select>
      {description && <Description desciption={description} />}
    </div>
  );
}
