import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/core/styles';
import {Check, Close, Delete, Edit} from '@material-ui/icons';
import Description from './Description';
import {useDispatch, useSelector} from 'react-redux';
import {updateModelPayload} from '../payloads-builder/features/payloadReducer';

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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
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
  newIcon: {
    color: '#58B423',
    marginLeft: 5,
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

export default function TextFieldMapper({
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
  const {label, description, name, modelProperty, set, get} = entry || {};
  const [value, setValue] = useState(null);
  const [readOnlyEdit, setReadOnly] = useState(readOnly);
  const dispatch = useDispatch();
  const modelPayloadsStore = useSelector(
      (state) => state.payloadReducer.modelPayloads,
  );

  const setProperty = (value) => {
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get('modeling');
    modeling.updateProperties(element, {
      [name]: value,
    });

    element[name] = value;
    const newPayloads = [...modelPayloadsStore];
    if (element.businessObject.name === 'Username') {
      newPayloads[0] = {id: null, wsKey: 'username', wsValue: value};
      dispatch(updateModelPayload(newPayloads));
    } else if (element.businessObject.name === 'Password') {
      newPayloads[1] = {id: null, wsKey: 'password', wsValue: value};
      dispatch(updateModelPayload(newPayloads));
    }
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
    <div className={classnames(classes.root, rootClass)}>
      {isLabel && (
        <label className={classnames(classes.label, labelClass)}>{label}</label>
      )}
      <div className={classes.fieldWrapper}>
        <input
          id={`camunda-${name}_${Date()}`}
          type={
            element.businessObject.name === 'Password' ? 'password' : 'text'
          }
          readOnly={readOnlyEdit}
          name={name}
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          className={classnames(classes.input, readOnly && classes.readOnly)}
          onBlur={(e) => updateProperty(e.target.value)}
        />
        {canRemove && value && (
          <button onClick={handleClear} className={classes.clearButton}>
            <Close className={classes.clear} />
          </button>
        )}
        {readOnlyEdit && (
          <Edit
            className={classes.newIcon}
            onClick={() => setReadOnly(!readOnlyEdit)}
          />
        )}
        {!readOnlyEdit && (
          <Check
            className={classes.newIcon}
            onClick={() => {
              setReadOnly(!readOnlyEdit);
            }}
          />
        )}
        <Delete className={classes.newIcon} />
      </div>
      {description && <Description desciption={description} />}
    </div>
  );
}
