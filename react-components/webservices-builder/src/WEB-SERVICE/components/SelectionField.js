import React, {useEffect, useState} from 'react';
import {TextField, CircularProgress} from '@material-ui/core';
import {makeStyles} from '@material-ui/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import _uniqueId from 'lodash/uniqueId';

const useStyles = makeStyles((theme) => ({
  listbox: {
    maxHeight: '300px !important',
  },
  input: {
    width: '100%',
  },
  inputSelected: {
    width: '100% ',
  },
}));
export default function AutoComplete(props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const {
    name,
    value,
    onChange,
    options: flatOptions,
    optionLabelKey = 'title',
    isMulti = false,
    title,
    fetchAPI,
    inline,
    InputProps,
    error,
    disableCloseOnSelect = true,
    readOnly = false,
    concatValue,
    inputRootClass = {},
    ...other
  } = props;

  const classes = useStyles();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (open) {
      setOptions([]);
      setLoading(true);
      if (fetchAPI) {
        (async () => {
          const data = await fetchAPI({search: inputValue});
          if (active) {
            setOptions(data);
            setLoading(false);
          }
        })();
      } else {
        if(inputValue){
        let newOptions;
        if(typeof inputValue === "object") newOptions = flatOptions.filter( (value) => {return value?.name?.toLowerCase().includes(inputValue?.name?.toLowerCase())});
        else newOptions = flatOptions.filter( (value) => {return value?.name?.toLowerCase().includes(inputValue?.toLowerCase())});
        setOptions(newOptions)
        }
        else{
          setOptions(flatOptions);
        }
        setLoading(false);
      }
    }
    return () => {
      active = false;
      setLoading(false);
    };
  }, [fetchAPI, flatOptions, inputValue, open]);

  return (
    <Autocomplete
      loading={loading}
      id={_uniqueId('select-widget')}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      freeSolo
      getOptionLabel={(option) => (option[optionLabelKey] ? option[optionLabelKey] : option)}
      disabled={readOnly}
      onChange={(event, newValue, reason) => {setInputValue(newValue);onChange(newValue, reason)}}
      onInputChange={(value)=>setInputValue(value?.target?.value)}
      options={options || []}
      value={value}
      classes={{
        option: 'menu-item',
        inputRoot: inputRootClass,
      }}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            error={error}
            label={inline ? '' : title}
            fullWidth
            onClick={() => {
              if (readOnly) return;
              setOpen(true);
            }}
            onChange={(e)=>onChange(e.target.value)}
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
          />
        );
      }}
      {...(isMulti ? {disableCloseOnSelect} : {})}
      {...other}
    />
  );
}
