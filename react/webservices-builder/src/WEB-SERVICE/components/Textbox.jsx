import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import {makeStyles} from '@material-ui/core/styles';

import Description from './Description';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 5,
  },
  label: {
    fontWeight: 'bolder',
    display: 'inline-block',
    verticalAlign: 'middle',
    color: "#666",
    marginBottom: 3,
  },
  textarea: {
    'fontFamily': 'Helvetica Neue, Helvetica, Arial, sans-serif',
    'resize': 'vertical',
    'borderColor': '#ccc',
    '&:focus': {
      boxShadow: 'rgba(82, 180, 21, 0.2) 0px 0px 1px 2px',
      outline: 'none',
      borderColor: 'rgb(82, 180, 21)',
    },
  },
  error: {
    'borderColor': '#cc3333 !important',
    'background': '#f0c2c2',
    '&:focus': {
      boxShadow: 'rgba(204,58,51, 0.2) 0px 0px 1px 2px !important',
      outline: 'none',
      borderColor: '#cc3333 !important',
    },
  },
  readOnly: {
    'borderColor': '#ccc !important',
    'background': '#E3E3E3',
    'color': '#7E7E7E',
    '&:focus': {
      boxShadow: 'none !important',
      outline: 'none',
      borderColor: '#ccc !important',
    },
  },
});

export default function Textbox({
  entry,
  element,
  rows = 1,
  bpmnModeler,
  className,
  readOnly,
}) {
  const classes = useStyles();
  const {label, description, name, validate, get, set} = entry || {};
  const [value, setValue] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);

  const setProperty = (value) => {
    if (set) {
      set(element, {
        [name]: value,
      });
      setValue(value);
    } else {
      const modeling = bpmnModeler.get('modeling');
      modeling.updateProperties(element, {
        [name]: value,
      });
      element.businessObject[name].expression = value
      element.businessObject[name].value = null
    }
  };

  const getProperty = React.useCallback(() => {
    if (get) {
      const values = get(element);
      return values[name];
    }
    return element.businessObject[name]?.expression;
  }, [element, get, name]);

  const updateProperty = (value) => {
    setProperty(value);
    setValue(value);
    const isError = getValidation();
    setError(isError);
  };

  const getValidation = React.useCallback(() => {
    if (
      !validate ||
      ((value === null || value === undefined) && name === 'id')
    ) {
      setErrorMessage(null);
      return false;
    }
    const valid = validate(element, {
      [name]: value === '' ? undefined : value,
    });
    if (valid && valid[name]) {
      setErrorMessage(valid[name]);
      return true;
    } else {
      setErrorMessage(null);
      return false;
    }
  }, [validate, element, value, name]);

  useEffect(() => {
    const isError = getValidation();
    setError(isError);
  }, [getValidation]);

  useEffect(() => {
    if (!element) return;
    const value = getProperty(element);
    setValue(value);
  }, [element, getProperty, entry]);

  return (
    <div className={classnames(classes.root, className)}>
      <label className={classes.label}>{label}</label>
      <TextareaAutosize
        id={`camunda_${name}_${Date()}`}
        value={value || ''}
        className={classnames(
            classes.textarea,
            isError && classes.error,
            readOnly && classes.readOnly,
        )}
        minRows={rows}
        onBlur={(e) => {
          if (!readOnly) {
            updateProperty(e.target.value);
          }
        }}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        readOnly={typeof readOnly === 'function' ? readOnly() : readOnly}
      />
      {errorMessage && <Description desciption={errorMessage} type="error" />}
      {description && <Description desciption={description} />}
    </div>
  );
}
