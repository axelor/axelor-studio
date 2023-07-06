import React, {useState, useRef, useEffect, useCallback} from 'react';
import classnames from 'classnames';
import AutoComplete from '@material-ui/lab/Autocomplete';
import {TextField, CircularProgress} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';

function useDebounceEffect(handler, interval) {
  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current) {
      const timer = setTimeout(() => handler(), interval);
      return () => clearTimeout(timer);
    }
    isMounted.current = true;
  }, [handler, interval]);
}

const useStyles = makeStyles((theme) => ({
  autoComplete: {
    '& > div > label': {
      fontSize: 14,
    },
    '& > div > div': {
      paddingRight: '15px !important',
    },
    'background': 'white',
    'border': '1px solid #ccc',
    'padding': '0px 5px',
  },
  input: {
    fontSize: 14,
    color: theme.palette.common.black,
    padding: '3px 0 3px !important',
  },
  label: {
    fontSize: 14,
  },
  endAdornment: {
    top: 0,
  },
  circularProgress: {
    color: '#0A73FA',
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
  errorDescription: {
    marginTop: 5,
    color: '#CC3333',
  },
  labelTitle: {
    fontWeight: 'bolder',
    display: 'inline-block',
    verticalAlign: 'middle',
    color: '#676767',
    marginBottom: 3,
  },
  container: {
    marginTop: 10,
    width: '100%',
  },
}));

export default function SelectComponent({
  optionLabel = 'name',
  multiple = false,
  index,
  update,
  criteriaIds,
  type,
  options: propOptions,
  entry,
  isLabel = false,
  error = false,
  className,
  validate,
  bpmnModeler,
  element,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchText, setsearchText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);
  const [value,setValue] = useState(element.businessObject[entry.name])
  const classes = useStyles();
  const {name, label, fetchMethod} = entry;

  useEffect(()=>{
    setValue(element.businessObject[name]);
  },[element.businessObject, name])

  const setProperty = (value, valueObj) => {
    setValue(valueObj)
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get('modeling');
    modeling.updateProperties(element, {
      [name]: value,
    });
    element.businessObject[name] = valueObj;
    if (onChange) {
      onChange(valueObj);
    }
  };

  const fetchOptions = useCallback(
      (searchText = '') => {
        setLoading(true);
        const criteria = [];
        if (searchText) {
          criteria.push({
            fieldName: optionLabel,
            operator: 'like',
            value: searchText,
          });
        }
        if (!fetchMethod || !open) {
          setLoading(false);
          return;
        }
        return fetchMethod(criteria).then((res) => {
          if (res) {
            setOptions(res || []);
          }
          setLoading(false)
        });
      },
      [optionLabel, fetchMethod, open],
  );

  const optionDebounceHandler = React.useCallback(() => {
    if (searchText) {
      fetchOptions(searchText, criteriaIds);
    }
  }, [fetchOptions, searchText, criteriaIds]);

  useDebounceEffect(optionDebounceHandler, 500);

  const getValidation = React.useCallback(() => {
    if (
      !validate ||
      ((value === null || value === undefined) && name === 'id')
    ) {
      setErrorMessage(null);
      return false;
    }
    const valid = validate({
      [name]: value === '' ? undefined : value,
    });
    if (valid && valid[name]) {
      setErrorMessage(valid[name]);
      return true;
    } else {
      setErrorMessage(null);
      return false;
    }
  }, [validate, value, name]);

  useEffect(() => {
    const isError = getValidation();
    setError(isError);
  }, [getValidation]);

  useEffect(() => {
    if (!open || (propOptions && propOptions.length < 1)) {
      setOptions([]);
    }
  }, [open, propOptions]);

  useEffect(() => {
    if (open) {
      if (propOptions && propOptions.length > 0) {
        setOptions([...propOptions]);
      } else {
        fetchOptions(null, criteriaIds);
      }
    }
  }, [fetchOptions, open, criteriaIds, propOptions]);

  useEffect(() => {
    if (propOptions) {
      setLoading(true);
      setOptions(propOptions);
      setLoading(false);
    }
  }, [propOptions]);

  return (
    <div className={classes.container}>
      <label className={classes.labelTitle}>{label}</label>
      <AutoComplete
        classes={{
          inputFocused: classes.input,
          clearIndicator: classes.input,
          popupIndicator: classes.input,
          endAdornment: classes.endAdornment,
        }}
        size="small"
        key={index}
        open={open}
        onOpen={(e) => {
          e && e.stopPropagation();
          setOpen(true);
        }}
        onClose={(e) => {
          e && e.stopPropagation();
          setOpen(false);
        }}
        onClick={(e) => {
          e && e.stopPropagation();
          setOpen(true);
        }}
        loading={loading}
        clearOnEscape
        autoComplete
        className={classnames(
            classes.autoComplete,
            className,
            isError && classes.error,
        )}
        options={options}
        multiple={multiple}
        value={value || null}
        getOptionSelected={(option, val) => {
          if (!val) return;
          let optionName = '';
          optionName = option[optionLabel] ?
            optionLabel :
            option['title'] ?
            'title' :
            'name';
          return option[optionName] === (val.id ? val[optionName] : val);
        }}
        onChange={(e, value) => {
          let values = value;
          if (type === 'multiple') {
            values =
              value &&
              value.filter(
                  (val, i, self) =>
                    i ===
                  self.findIndex((t) => t[optionLabel] === val[optionLabel]),
              );
          }
          if (update) {
            update(values, value && value[optionLabel]);
          } else {
            setProperty(value && value[optionLabel], value);
          }
        }}
        name={name}
        onInputChange={(e, val) => setsearchText(val)}
        renderInput={(params) => (
          <TextField
            error={error}
            helperText={error ? 'Required' : ''}
            className={isError ? classes.error : ''}
            fullWidth
            {...params}
            InputProps={{
              ...(params.InputProps || {}),
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress
                      className={classes.circularProgress}
                      size={15}
                    />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
              onClick: (e) => e && e.stopPropagation(),
              disableUnderline: true,
            }}
            inputProps={{
              ...(params.inputProps || {}),
              onClick: (e) => {
                e && e.stopPropagation();
                params.inputProps &&
                  params.inputProps.onClick &&
                  params.inputProps.onClick(e);
              },
            }}
            InputLabelProps={{
              className: classes && classes.label,
            }}
            label={isLabel ? label : undefined}
          />
        )}
        getOptionLabel={(option) => {
          let optionName = '';
          optionName = option[optionLabel] ?
            option[optionLabel] :
            option['title'] ?
            option['title'] :
            typeof option === 'object' ?
            '' :
            option;
          return optionName;
        }}
      />
      {errorMessage && (
        <div className={classes.errorDescription}>{errorMessage}</div>
      )}
    </div>
  );
}
