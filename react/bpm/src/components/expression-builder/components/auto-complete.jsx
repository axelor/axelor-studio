import React, { useEffect, useState } from "react";
import _uniqueId from "lodash/uniqueId";

import { Badge, Select, ClickAwayListener } from "@axelor/ui";

import { translate } from "../../../utils";
import { useDebounce } from "../extra/util";

export default function AutoComplete(props) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState(props.isMulti ? [] : null);
  const [inputValue, setInputValue] = useState("");
  const {
    name,
    value,
    onChange,
    options: flatOptions,
    optionLabelKey = "title",
    optionValueKey = "id",
    isMulti = false,
    title,
    fetchAPI,
    inline,
    InputProps,
    error,
    filterSelectedOptions = false,
    disableCloseOnSelect = false,
    readOnly = false,
    disabled = false,
    disableClearable = false,
    placeholder = "",
    ...other
  } = props;

  const [loading, setLoading] = useState(false);

  const findOption = React.useCallback(
    (option) => {
      return (
        flatOptions &&
        flatOptions.find((i) => i && i[optionValueKey] === option.trim())
      );
    },
    [flatOptions, optionValueKey]
  );

  async function onInputChange(value = "") {
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
            setLoading(props.isLoading || false);
          }
        })();
      } else {
        setOptions(flatOptions);
        setLoading(props.isLoading || false);
      }
    }
    return () => {
      active = false;
      setLoading(false);
    };
  }, [fetchAPI, flatOptions, inputValue, open, props.isLoading]);

  useEffect(() => {
    if (typeof value === "string") {
      const values = value.split(",");
      setSelectedValue(
        isMulti ? values.map((v) => findOption(v)) : findOption(values[0])
      );
    } else {
      setSelectedValue(value ? value : isMulti ? [] : null);
    }
  }, [value, isMulti, findOption]);

  function handleChange(item) {
    if (typeof value === "string") {
      isMulti
        ? onChange(item.map((i) => i && i[optionValueKey]).join(",") || [])
        : onChange(item && item[optionValueKey]);
    } else {
      onChange(item);
    }
  }

  const checkValue = (option) => {
    return (option && option.type) === "metaJsonModel"
      ? `${option && option.title} (${
          option && option[optionLabelKey] ? option[optionLabelKey] : ""
        }) (Custom model)` || ""
      : name === "fieldName"
      ? `${translate(option && option["title"] ? option["title"] : "")} (${
          option && option[optionLabelKey]
        })`
      : (option && option.type) === "metaModel"
      ? `${option && option["title"] ? option["title"] : ""} (${
          option && option[optionLabelKey] ? option[optionLabelKey] : ""
        })` || ""
      : (option && option.type) === "dmnModel"
      ? `${option && option["dmnNodeNameId"] ? option["dmnNodeNameId"] : ""} (${
          option && option["resultVariable"] ? option["resultVariable"] : ""
        })` || ""
      : option
      ? option[optionLabelKey]
        ? option[optionLabelKey]
        : option["id"]
        ? option["id"].toString()
        : ""
      : "";
  };

  const customOptions = React.useMemo(() => {
    if (loading) {
      return [
        {
          key: "loading",
          title: translate("Loading..."),
        },
      ];
    }
    if (!options.length) {
      return [
        {
          key: "no-options",
          title: translate("No options"),
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
        optionLabel={(option) => checkValue(option)}
        autoComplete={true}
        clearOnEscape
        removeOnBackspace
        disabled={disabled}
        readOnly={readOnly}
        id={_uniqueId("select-widget")}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        placeholder={translate(placeholder || title)}
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
        optionMatch={(option, text = "") => {
          if (text === "") return true;
          const key = text.toLowerCase();
          const name = option?.name?.toLowerCase() || "";
          const title = option?.title?.toLowerCase() || "";
          if (name.includes(key) || title.includes(key)) {
            return true;
          }
          return false;
        }}
        onChange={(newValue) => handleChange(newValue)}
        options={loading ? [] : options || []}
        customOptions={customOptions}
        multiple={isMulti}
        onInputChange={(value) => delayChange(value)}
        clearIcon={!disableClearable}
        renderValue={(value, getTagProps) => {
          return value.map((option, index) => (
            <Badge
              variant="primary"
              label={option[optionLabelKey]}
              size="small"
            >
              {option[optionLabelKey]}
            </Badge>
          ));
        }}
        optionKey={(option) => option.id || option.name}
        {...(isMulti ? { disableCloseOnSelect } : {})}
        {...other}
      />
    </ClickAwayListener>
  );
}
