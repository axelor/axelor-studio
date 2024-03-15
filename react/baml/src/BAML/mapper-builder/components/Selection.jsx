import React, { useEffect, useState } from "react";
import _uniqueId from "lodash/uniqueId";
import { translate, useDebounce } from "../utils";
import { Badge, Box, InputLabel, Select } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const getKey = (key) => (key === "_selectId" ? "id" : key);

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
    error,
    filterSelectedOptions = false,
    readOnly = false,
    concatValue,
    disableClearable,
  } = props;

  const [loading, setLoading] = useState(true);

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

  async function onInputChange(value = "") {
    setInputValue(value);
  }

  const delayChange = useDebounce(onInputChange, 400);

  function handleChange(item) {
    if (typeof value === "string") {
      isMulti
        ? onChange(
            item.map((i) => i && i[getKey(optionValueKey)]).join(",") || []
          )
        : onChange(item && item[getKey(optionValueKey)]);
    } else {
      onChange(item ?? []);
    }
  }

  const checkValue = (option) => {
    return (option && option.type) === "metaJsonModel"
      ? `${
          option && option[getKey(optionLabelKey)]
            ? option[getKey(optionLabelKey)]
            : ""
        } (Custom model)` || ""
      : name === "fieldName"
      ? `${translate(option && option["title"] ? option["title"] : "")} (${
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
        : option["name"]
        ? option["name"]
        : option["id"]
        ? option["id"].toString()
        : ""
      : "";
  };

  const customOptions = React.useMemo(() => {
    const key = inputValue.toLowerCase();
    const filteredOptions = options.filter((option) =>
      checkValue(option)?.includes(key)
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
    const indexToRemove = selectedValue.findIndex(
      (op) => checkValue(op) === checkValue(option)
    );
    if (indexToRemove !== -1) {
      const newOptions = selectedValue.slice(0, indexToRemove);
      onChange(newOptions);
    }
  };

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
    <Box
      d="flex"
      flex={1}
      flexDirection="column"
      gap={8}
      style={{
        width: "initial",
        minWidth: isMulti && "400px",
      }}
    >
      <Select
        style={{ maxHeight: "100px", overflow: "scroll" }}
        optionEqual={(option, value) => {
          return isMulti
            ? option[optionValueKey] === value[optionValueKey]
            : checkValue(option) === checkValue(value);
        }}
        optionLabel={(option) => {
          return checkValue(option);
        }}
        optionMatch={(option, text = "") => {
          if (text === "") return true;
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
        clearOnEscape
        optionKey={(op) => checkValue(op)}
        customOptions={customOptions}
        id={_uniqueId("select-widget")}
        clearIcon={!disableClearable}
        openOnFocus
        closeOnSelect={!isMulti}
        onOpen={() => !open && setOpen(true)}
        onClose={() => !isMulti && open && setOpen(false)}
        disabled={readOnly}
        placeholder={translate(title)}
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
        onInputChange={(value) => delayChange(value)}
        error={error}
        removeOnBackspace
        filterSelectedOptions={filterSelectedOptions}
        renderValue={({ option = {} }) => {
          if (!isMulti) return;
          const lastIndex = selectedValue?.length - 1;
          const currentIndex = selectedValue.findIndex(
            (op) => checkValue(op) === checkValue(option)
          );
          const showArrow = lastIndex !== currentIndex;
          return (
            <>
              <Badge bg="primary" px={2} py={1} rounded="pill">
                <Box d="flex" alignItems="center" g={1}>
                  <Box
                    as="span"
                    style={{
                      maxWidth: "150px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: "0.6rem",
                    }}
                  >
                    {checkValue(option)}
                  </Box>
                  <Box as="span" style={{ cursor: "pointer" }}>
                    <MaterialIcon
                      icon="close"
                      fontSize={14}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(option);
                      }}
                    />
                  </Box>
                </Box>
              </Badge>
              {showArrow && (
                <MaterialIcon icon="arrow_right_alt" fontSize={13} />
              )}
            </>
          );
        }}
      />
    </Box>
  );
}
