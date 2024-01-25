import React, { useEffect, useState } from 'react';
import { Select, ClickAwayListener, Badge, Box } from '@axelor/ui';
import { translate, useDebounce } from '../utils';
import { uniqueId } from 'lodash';
import { MaterialIcon } from '@axelor/ui/icons/material-icon';

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
    handleRemove = () => {},
    disableClearable = false,
    ...other
  } = props;

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
        isMulti ? values?.map(v => findOption(v)) : findOption(values[0])
      );
    } else {
      setSelectedValue(value ? value : isMulti ? [] : null);
    }
  }, [value, isMulti, findOption]);

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

  const customOptions = React.useMemo(() => {
    if (loading) {
      return [
        {
          key: 'loading',
          title: 'Loading...',
        },
      ];
    }
    if (!options?.length) {
      return [
        {
          key: 'no-options',
          title: 'No options',
        },
      ];
    }
    return [];
  }, [loading, options]);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Select
        optionEqual={(option, value) => {
          return isMulti
            ? option[optionValueKey] === value[optionValueKey]
            : checkValue(option) === checkValue(value);
        }}
        optionLabel={option => checkValue(option)}
        className={className}
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
        onChange={newValue => handleChange(newValue)}
        optionKey={option => option.id}
        options={loading ? [] : options ?? []}
        customOptions={customOptions}
        multiple={isMulti}
        clearIcon={!disableClearable}
        optionMatch={(option, text = '') => {
          if (text === '') return true;
          const key = text.toLowerCase();
          const name = option?.name?.toLowerCase() || '';
          const title = option?.title?.toLowerCase() || '';
          if (name.includes(key) || title.includes(key)) {
            return true;
          }
          return false;
        }}
        renderValue={({ option }) => {
          return isMulti ? (
            <Badge bg="primary">
              <Box d="flex" alignItems="center" g={1}>
                <Box as="span">{checkValue(option)}</Box>
                <Box as="span" style={{ cursor: 'pointer' }}>
                  <MaterialIcon
                    icon="close"
                    fontSize="1rem"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemove(option);
                    }}
                  />
                </Box>
              </Box>
            </Badge>
          ) : null;
        }}
        filterSelectedOptions={filterSelectedOptions}
        onInputChange={value => delayChange(value)}
        removeOnBackspace
        {...(isMulti ? { disableCloseOnSelect } : {})}
        {...other}
      />
    </ClickAwayListener>
  );
}
