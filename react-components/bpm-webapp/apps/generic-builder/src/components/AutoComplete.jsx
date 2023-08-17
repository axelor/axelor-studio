import React, { useEffect, useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Popper from '@material-ui/core/Popper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Chip from '@material-ui/core/Chip';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/styles';
import { translate, useDebounce } from '../utils';
import { uniqueId } from 'lodash';

const useStyles = makeStyles(theme => ({
  listbox: {
    maxHeight: '300px !important',
  },
  chip: {
    '&.MuiChip-outlined .MuiChip-deleteIconSmall': {
      color: '#0275d8',
    },
    border: '1px solid #0275d8',
    color: '#0275d8',
  },
  popper: {
    width: 'auto !important',
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
    className,
    classes: $classes,
    ...other
  } = props;

  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  const findOption = React.useCallback(
    option => {
      return (
        flatOptions &&
        flatOptions.find(i => i && i[optionValueKey] === option.trim())
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
        isMulti ? values.map(v => findOption(v)) : findOption(values[0])
      );
    } else {
      setSelectedValue(value ? value : isMulti ? [] : null);
    }
  }, [value, isMulti, findOption]);

  function onKeyDown(e) {
    if (e.key === 'Backspace') {
      if (selectedValue && selectedValue[optionLabelKey] === inputValue) {
        onChange(null);
      }
    }
  }

  function handleChange(item) {
    if (typeof value === 'string') {
      isMulti
        ? onChange(item.map(i => i && i[optionValueKey]).join(',') || [])
        : onChange(item && item[optionValueKey]);
    } else {
      onChange(item);
    }
  }

  const checkValue = option => {
    return (option && option.type) === 'metaJsonModel'
      ? `${option && option.title} (${
          option && option[optionLabelKey] ? option[optionLabelKey] : ''
        }) (Custom model)` || ''
      : name === 'fieldName'
      ? `${translate(option && option['title'] ? option['title'] : '')} (${
          option && option[optionLabelKey]
        })`
      : (option && option.type) === 'metaModel'
      ? `${option && option.title ? option.title : ''} (${
          option && option[optionLabelKey] ? option[optionLabelKey] : ''
        })` || ''
      : option
      ? option[optionLabelKey]
        ? option[optionLabelKey]
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
          ? option[optionValueKey] === value[optionValueKey]
          : checkValue(option) === checkValue(value);
      }}
      getOptionLabel={option => {
        return checkValue(option);
      }}
      className={className}
      loading={loading}
      id={uniqueId('select-widget')}
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
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option[optionLabelKey] || option['name'] || option['id']}
            size="small"
            classes={{
              root: classes.chip,
            }}
            {...getTagProps({ index })}
          />
        ))
      }
      onChange={(event, newValue) => handleChange(newValue)}
      options={options || []}
      multiple={isMulti}
      filterSelectedOptions={filterSelectedOptions}
      onInputChange={(e, value) => delayChange(value)}
      classes={{
        ...$classes,
        option: 'menu-item',
        listbox: classes.listbox,
        popper: options && options.length > 0 && classes.popper,
      }}
      PopperComponent={CustomPopper}
      renderInput={params => {
        return (
          <TextField
            {...params}
            error={error}
            label={inline ? '' : translate(title)}
            fullWidth
            onClick={() => {
              if (readOnly) return;
              setOpen(true);
            }}
            InputProps={{
              ...InputProps,
              ...params.InputProps,
              // disableUnderline: true,
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
  return <Popper {...props} placement="bottom-start" />;
}
