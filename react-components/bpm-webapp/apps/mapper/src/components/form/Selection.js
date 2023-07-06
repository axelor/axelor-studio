import React, { useEffect, useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Popper from '@material-ui/core/Popper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/styles';
import _uniqueId from 'lodash/uniqueId';

import { useDebounce } from '../utils';
import { translate } from '../../utils';

const getKey = (key) => (key === '_selectId' ? 'id' : key);

const useStyles = makeStyles((theme) => ({
  listbox: {
    maxHeight: '300px !important',
  },
  popper: {
    width: 'auto !important',
  },
  tag: {
    height: 24,
  },
  input: {
    width: '100% !important',
  },
  inputSelected: {
    width: '100% !important',
    margin: 4,
    color: 'rgba(0, 0, 0, 0.87)',
    border: '1px solid #e0e0e0',
    padding: '3px 24px !important',
    borderRadius: 25,
    background: '#e0e0e0',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    textAlign: 'center',
    fontSize: '0.8125rem',
    height: 18,
  },
}));

export default function AutoComplete(props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState(props.isMulti ? [] : null);
  const [inputValue, setInputValue] = useState('');
  const {
    name,
    value,
    onChange,
    options: flatOptions,
    optionLabelKey = 'title',
    optionValueKey = 'id',
    isMulti = false,
    title,
    fetchAPI,
    inline,
    InputProps,
    error,
    filterSelectedOptions = false,
    disableCloseOnSelect = true,
    readOnly = false,
    concatValue,
    inputRootClass,
    isProcessContext = false,
    ...other
  } = props;

  const showError =
    (!value && !value?.name) || (Array.isArray(value) && value?.length === 0);

  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  const findOption = React.useCallback(
    (option) => {
      return (
        flatOptions &&
        flatOptions.find(
          (i) => i && i[getKey(optionValueKey)] === option.trim()
        )
      );
    },
    [flatOptions, optionValueKey]
  );

  async function onInputChange(value = '') {
    setInputValue(value);
  }

  const delayChange = useDebounce(onInputChange, 400);

  useEffect(() => {
    let active = true;
    if (open) {
      setOptions([]);
      setLoading(true);
      if (fetchAPI) {
        (async () => {
          const data = await fetchAPI({ search: inputValue });
          if (active) {
            setOptions(data);
            setLoading(false);
          }
        })();
      } else {
        setOptions(flatOptions);
        setLoading(false);
      }
    }
    return () => {
      active = false;
      setLoading(false);
    };
  }, [fetchAPI, flatOptions, inputValue, open]);

  useEffect(() => {
    if (typeof value === 'string') {
      const values = value.split(',');
      setSelectedValue(
        isMulti ? values.map((v) => findOption(v)) : findOption(values[0])
      );
    } else {
      setSelectedValue(value ? value : isMulti ? [] : null);
    }
  }, [value, isMulti, findOption]);

  function onKeyDown(e) {
    if (e.key === 'Backspace') {
      if (
        selectedValue &&
        selectedValue[getKey(optionLabelKey)] === inputValue
      ) {
        onChange(null, 'backspace');
      }
    }
  }

  function handleChange(item, reason) {
    if (typeof value === 'string') {
      isMulti
        ? onChange(
            item.map((i) => i && i[getKey(optionValueKey)]).join(',') || [],
            reason
          )
        : onChange(item && item[getKey(optionValueKey)], reason);
    } else {
      onChange(item, reason);
    }
  }

  const checkValue = (option) => {
    return (option && option.type) === 'metaJsonModel'
      ? `${option && option.title}  (${
          option && option[getKey(optionValueKey)]
            ? option[getKey(optionValueKey)]
            : ''
        }) (Custom model)` || ''
      : name === 'fieldName'
      ? `${translate(option && option['title'] ? option['title'] : '')} (${
          option && option[getKey(optionLabelKey)]
        })`
      : option
      ? option[getKey(optionLabelKey)] &&
        concatValue &&
        option[getKey(optionValueKey)]
        ? `${option[getKey(optionLabelKey)]} (${
            option[getKey(optionValueKey)]
          })`
        : option[getKey(optionLabelKey)]
        ? option[getKey(optionLabelKey)]
        : option['name']
        ? option['name']
        : option['id']
        ? option['id'].toString()
        : ''
      : '';
  };
  return (
    <Autocomplete
      getOptionSelected={(option, value) => {
        return isMulti
          ? option[getKey(optionValueKey)] === value[getKey(optionValueKey)]
          : checkValue(option) === checkValue(value);
      }}
      getOptionLabel={(option) => {
        return checkValue(option);
      }}
      loading={loading}
      id={_uniqueId('select-widget')}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disabled={readOnly}
      value={
        selectedValue
          ? isMulti
            ? Array.isArray(selectedValue)
              ? selectedValue
              : []
            : selectedValue
          : isMulti
          ? []
          : null
      }
      onChange={(event, newValue, reason) => handleChange(newValue, reason)}
      options={options || []}
      multiple={isMulti}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(e, value) => delayChange(value)}
      classes={{
        option: 'menu-item',
        inputRoot: inputRootClass,
        input: isProcessContext
          ? selectedValue
            ? classes.inputSelected
            : classes.input
          : '',
        popper: (options || []).length > 0 && classes.popper,
        tag: classes.tag,
      }}
      PopperComponent={CustomPopper}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            error={error && showError}
            label={inline ? '' : translate(title)}
            fullWidth
            onClick={() => {
              if (readOnly) return;
              setOpen(true);
            }}
            InputProps={{
              ...InputProps,
              ...params.InputProps,
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
            }}
            {...(isMulti ? {} : { onKeyDown: onKeyDown })}
          />
        );
      }}
      {...(isMulti ? { disableCloseOnSelect } : {})}
      {...other}
    />
  );
}

function CustomPopper(props) {
  const { style = {} } = props;
  return (
    <Popper
      {...props}
      style={{ style, ...(style.width ? { minWidth: style.width } : {}) }}
      placement="bottom-start"
    />
  );
}
