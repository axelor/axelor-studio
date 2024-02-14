import React, { useEffect, useState } from "react";
import { Badge, Box, InputLabel, Select } from "@axelor/ui";
import _uniqueId from "lodash/uniqueId";
import { translate } from "../../../utils";
import { useDebounce } from "../extra/util";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

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
    error,
    filterSelectedOptions = false,
    disableCloseOnSelect = true,
    disableClearable,
    readOnly,
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
    const key = inputValue.toLowerCase();
    const filteredOptions = options.filter(
      (option) =>
        checkValue(option)?.toLowerCase()?.includes(key) ||
        option?.name?.toLowerCase()?.includes(key)
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
  }, [options, loading, setLoading, inputValue]);

  const handleRemove = (option) => {
    const newOptions = selectedValue.filter(
      (op) => checkValue(op) !== checkValue(option)
    );
    onChange(newOptions);
  };

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
        if (inputValue || !flatOptions?.length) {
          setLoading(false);
        }
      }
    }
    return () => {
      setLoading(false);
      active = false;
    };
  }, [fetchAPI, flatOptions, inputValue, open]);

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

  return (
    <Box d="flex" flexDirection="column" me={2} style={{ width: "initial" }}>
      <Select
        optionEqual={(option, value) => {
          return isMulti
            ? option[optionValueKey] === value[optionValueKey]
            : checkValue(option) === checkValue(value);
        }}
        optionLabel={(option) => {
          return checkValue(option);
        }}
        optionKey={(option) => checkValue(option)}
        optionMatch={(option, text = "") => {
          if (option?.key === "loading" || option?.key === "no-options") {
            return true;
          }
          const key = text.toLowerCase();
          const name = option?.name?.toLowerCase() || "";
          const title = option?.title?.toLowerCase() || "";
          if (name.includes(key) || title.includes(key)) {
            return true;
          }
          return false;
        }}
        disabled={readOnly}
        placeholder={translate(title)}
        openOnFocus
        clearIcon={!disableClearable}
        customOptions={customOptions}
        id={_uniqueId("select-widget")}
        onOpen={() => !open && setOpen(true)}
        onClose={() => open && setOpen(false)}
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
        onChange={(newValue) => handleChange(newValue)}
        options={options || []}
        multiple={isMulti}
        removeOnBackspace
        filterSelectedOptions={filterSelectedOptions}
        onInputChange={(value) => delayChange(value)}
        renderValue={({ option = {} }) => {
          if (!isMulti) return;
          return (
            <>
              <Badge bg="primary" rounded="pill">
                <Box d="flex" alignItems="center" g={1}>
                  <Box
                    as="span"
                    style={{
                      maxWidth: "150px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {checkValue(option)}
                  </Box>
                  <Box as="span" style={{ cursor: "pointer" }}>
                    <MaterialIcon
                      icon="close"
                      fontSize="1rem"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(option);
                      }}
                    />
                  </Box>
                </Box>
              </Badge>
            </>
          );
        }}
        error={error}
        {...other}
      />
    </Box>
  );
}
