import React, { useState, useRef, useEffect, useCallback } from "react";
import { translate } from "../../utils";
import { Box, InputLabel, Select } from "@axelor/ui";

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

export default function SelectComponent({
  optionLabel = "name",
  optionKey = "name",
  multiple = false,
  index,
  value,
  update,
  criteriaIds,
  type,
  options: propOptions,
  entry,
  isLabel = true,
  error = false,
  defaultValue,
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
  const [selectedValue, setSelectedValue] = useState(null);
  const { name, label, fetchMethod } = entry;

  const setProperty = (value, valueObj) => {
    if (!bpmnModeler) return;
    const modeling = bpmnModeler.get("modeling");
    modeling.updateProperties(element, {
      [name]: value,
    });
    if (onChange) {
      onChange(valueObj);
    }
  };

  const getProperty = () => {
    return element.businessObject[name];
  };

  const fetchOptions = useCallback(
    (searchText = "") => {
      setLoading(true);
      const criteria = [];
      if (searchText) {
        criteria.push({
          fieldName: optionLabel,
          operator: "like",
          value: searchText,
        });
      }
      if (!fetchMethod || !open) {
        setLoading(false);
        return;
      }
      return fetchMethod(criteria).then((res) => {
        if (res) {
          setOptions(res);
          setLoading(false);
        }
      });
    },
    [optionLabel, fetchMethod, open]
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
      ((value === null || value === undefined) && name === "id")
    ) {
      setErrorMessage(null);
      return false;
    }
    let valid = validate({
      [name]: value === "" ? undefined : value,
    });
    if (valid && valid[name]) {
      setErrorMessage(valid[name]);
      return true;
    } else {
      setErrorMessage(null);
      return false;
    }
  }, [validate, value, name]);

  function handleKeyDown(event) {
    if (event.keyCode === 8) {
      setSelectedValue(null);
    }
  }

  const getLabel = (option) => {
    let optionName = "";
    optionName = option[optionLabel]
      ? option[optionLabel]
      : option["title"]
      ? option["title"]
      : typeof option === "object"
      ? ""
      : option;
    return optionName;
  };

  const customOptions = React.useMemo(() => {
    const key = searchText?.toLowerCase() || "";
    const filteredOptions = options.filter((option) =>
      getLabel(option)?.toLowerCase()?.includes(key)
    );
    if (loading && !filteredOptions?.length) {
      return [
        {
          key: "loading",
          id: `${translate("Loading...")}`,
          title: <span> {translate("Loading...")}</span>,
          disabled: true,
        },
      ];
    } else if (!filteredOptions || filteredOptions.length === 0) {
      return [
        {
          key: "no-options",
          id: "no_data_found",
          title: <span> {translate("No options")}</span>,
          disabled: true,
        },
      ];
    } else {
      return [];
    }
  }, [options, loading, searchText]);

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

  useEffect(() => {
    setSelectedValue(defaultValue ?? getProperty() ?? null);
  }, [getProperty, defaultValue]);

  return (
    <Box mt={2} onKeyDown={handleKeyDown}>
      {isLabel && <InputLabel color="body">{translate(label)}</InputLabel>}
      <Select
        openOnFocus
        customOptions={customOptions}
        removeOnBackspace
        clearIcon={true}
        options={options || []}
        optionKey={(op) => `${op.packageName || ""}.${op[optionKey]}`}
        optionMatch={(option, text = "") => {
          if (option?.key === "loading" || option?.key === "no-options") {
            return true;
          }
          const key = text?.toLowerCase() || "";
          const label = getLabel(option).toLowerCase() || "";
          return label.includes(key);
        }}
        key={index}
        invalid={error || isError}
        value={selectedValue}
        clearOnEscape
        autoComplete
        multiple={multiple}
        onOpen={() => {
          !open && setOpen(true);
        }}
        onClose={() => {
          open && setOpen(false);
        }}
        onInputChange={(val) => setsearchText(val)}
        onChange={(value) => {
          let values = value;
          if (type === "multiple") {
            values =
              value &&
              value.filter(
                (val, i, self) =>
                  i ===
                  self.findIndex((t) => t[optionLabel] === val[optionLabel])
              );
          }
          if (update) {
            update(values, value && value[optionLabel]);
          } else {
            setProperty(value && value[optionLabel], value);
          }
        }}
        optionValue={getLabel}
        optionLabel={getLabel}
      />
      {errorMessage && <Box color="danger">{translate(errorMessage)}</Box>}
    </Box>
  );
}
