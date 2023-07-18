import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/core/styles';
import {Close} from '@material-ui/icons';

import Description from './Description';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 5,
    width: '100%',
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
  label: {
    fontWeight: 'bolder',
    display: 'inline-block',
    verticalAlign: 'middle',
    color: "#666",
    marginBottom: 3,
  },
  fieldWrapper: {
    position: 'relative',
  },
  input: {
    'width': 'calc(100% - 35px)',
    'padding': '3px 28px 3px 6px ',
    'border': '1px solid #ccc',
    '&:focus': {
      boxShadow: 'rgba(82, 180, 21, 0.2) 0px 0px 1px 2px',
      outline: 'none',
      borderColor: 'rgb(82, 180, 21)',
    },
  },
  clearButton: {
    background: 'transparent',
    border: 'none',
    top: 0,
    right: 0,
    position: 'absolute',
    height: 23,
    width: 24,
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  clear: {
    fontSize: '1rem',
  },
  readOnly: {
    'borderColor': '#ccc !important',
    'background': '#E3E3E3',
    '&:focus': {
      boxShadow: 'none !important',
      outline: 'none',
      borderColor: '#ccc !important',
    },
  },
});

export default function TextField({
  entry,
  element,
  canRemove = false,
  rootClass,
  labelClass,
  type = 'text',
  isLabel = true,
  readOnly = false,
  bpmnModeler,
}) {
  const classes = useStyles();
  const {label, description, name, modelProperty,hidden = false, set, get} = entry || {};
  const [value, setValue] = useState(null);
  const setProperty = (value) => {
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get('modeling');
    modeling.updateProperties(element, {
      [name]: value,
    });
    element.businessObject[name] = value;
  };

  const getProperty = React.useCallback(() => {
    return element.businessObject[name];
  }, [element, name]);

  const updateProperty = (value) => {
    if (set) {
      set(element, {
        [modelProperty]: value,
      });
    } else {
      setProperty(value);
    }
  };

  const handleClear = () => {
    setValue('');
    updateProperty(undefined);
  };

  useEffect(() => {
    if (!element) return;
    let value;
    if (get) {
      const property = get();
      value = property && property[modelProperty];
    } else {
      value = getProperty();
    }
    setValue(value);
  }, [element, get, getProperty, modelProperty]);

  return (
    !hidden &&
    <div className={classnames(classes.root, rootClass)}>
      {isLabel && (
        <label className={classnames(classes.label, labelClass)}>{label}</label>
      )}
      <div className={classes.fieldWrapper}>
        <input
          id={`camunda-${name}_${Date()}`}
          type={type}
          readOnly={readOnly}
          name={name}
          value={value || ''}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          className={classnames(classes.input, readOnly && classes.readOnly)}
          onBlur={(e) => updateProperty(e.target.value)}
        />
        {canRemove && value && (
          <button onClick={handleClear} className={classes.clearButton}>
            <Close className={classes.clear} />
          </button>
        )}
      </div>
      {description && <Description desciption={description} />}
    </div>
  );
}
