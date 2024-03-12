import React, { useEffect, useState } from 'react';
import { ClickAwayListener, Select } from '@axelor/ui';
import _uniqueId from 'lodash/uniqueId';

import { useDebounce } from '../utils';
import { translate } from '../../utils';

const getKey = (key) => (key === '_selectId' ? 'id' : key);

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
    title = '',
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
    renderValue,
    disableClearable,
    placeholder = '',
    ...other
  } = props;

  const showError =
    (!value && !value?.name) || (Array.isArray(value) && value?.length === 0);

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

  function handleChange(item, reason) {
    if (typeof value === 'string') {
      isMulti
        ? onChange(
            item.map((i) => i && i[getKey(optionValueKey)]).join(',') || [],
            reason
          )
        : onChange(item && item[getKey(optionValueKey)], reason);
    } else {
      onChange(
        item?.length ? item.map((i, ind) => ({ ...i, trackKey: ind })) : item,
        reason
      );
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

  const customOptions = React.useMemo(() => {
    if (loading) {
      return [
        {
          key: 'loading',
          title: translate('Loading...'),
        },
      ];
    }
    if (!options?.length) {
      return [
        {
          key: 'no-options',
          title: translate('No options'),
        },
      ];
    }
    return [];
  }, [options, loading]);

  return (
    <React.Fragment>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Select
          optionEqual={(option, val) => {
            return isMulti
              ? value?.map((v) => v[getKey(optionValueKey)])?.join('.') ===
                  [...(value || []), val]
                    ?.map((v) => v[getKey(optionValueKey)])
                    ?.join('.')
              : checkValue(option) === checkValue(val);
          }}
          optionLabel={(option) => checkValue(option)}
          optionKey={(option) => option.name}
          customOptions={customOptions}
          id={_uniqueId('select-widget')}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          disabled={readOnly}
          invalid={error && showError}
          clearOnEscape
          removeOnBackspace
          autoComplete
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
          onChange={(newValue, reason) => handleChange(newValue, reason)}
          options={loading ? [] : options ?? []}
          multiple={isMulti}
          renderValue={renderValue}
          onInputChange={(value) => delayChange(value)}
          removeOnDelete
          placeholder={translate(placeholder || title)}
          clearIcon={!disableClearable}
          {...(isMulti ? { closeOnSelect: false } : {})}
          {...other}
        />
      </ClickAwayListener>
    </React.Fragment>
  );
}
