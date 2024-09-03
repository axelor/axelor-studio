import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ClickAwayListener,
  InputFeedback,
  Select,
  Badge,
  Box,
} from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import Description from "../components/properties/components/Description";
import { translate } from "../utils";

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
  name,
  optionLabel = "title",
  optionLabelSecondary = "name",
  multiple = false,
  value: oldValue,
  update,
  type,
  options: propOptions,
  fetchMethod,
  className,
  defaultValue,
  isTranslated = true,
  skipFilter = false,
  placeholder = "",
  validate,
  disabled = false,
  disableClearable = false,
  description,
  handleRemove,
  title = "",
  ...rest
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);

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
  }, [options, loading]);

  const fetchOptions = useCallback(
    (searchText = "") => {
      if (!open) return;
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
      return fetchMethod({ criteria }).then((options) => {
        setLoading(false);
        if (options && Array.isArray(options)) {
          const filterOptions = skipFilter
            ? options
            : options.filter((option) => option[optionLabel] !== null);
          setOptions(filterOptions || []);
        }
      });
    },
    [open, fetchMethod, optionLabel, skipFilter]
  );

  const optionDebounceHandler = React.useCallback(() => {
        fetchOptions(searchText);
  }, [searchText]);

  useDebounceEffect(optionDebounceHandler, 500);

  const getOptionLabel = (option) => {
    let optionName = "";
    if (name === "itemName" || name === "userFieldPath") {
      optionName =
        option["label"] || option["title"]
          ? `${option["label"] || option["title"]}${
              option["name"] ? ` (${option["name"]})` : ""
            }`
          : typeof option === "object"
          ? option["name"]
            ? `(${option["name"]})`
            : ""
          : option;
    } else if (name === "dmnModel") {
      optionName = `${option["name"]} ${
        option["decisionId"] ? `(${option["decisionId"]})` : ""
      }`;
    } else if (name === "wkfModel") {
      optionName = `${option?.wkfModel?.name || ""} (${option["name"]})`;
    } else {
      optionName =
        option[optionLabel] && option[optionLabelSecondary]
          ? `${option[optionLabel]} (${option[optionLabelSecondary]})`
          : option[optionLabel]
          ? `${option[optionLabel]}`
          : option[optionLabelSecondary]
          ? `${option[optionLabelSecondary]}`
          : option["title"]
          ? option["title"]
          : option["id"]
          ? `${option["id"]}`
          : typeof option === "object"
          ? ""
          : option;
    }
    return isTranslated ? translate(optionName) : optionName;
  };

  const getValidation = React.useCallback(() => {
    if (
      !validate ||
      ((oldValue === null || oldValue === undefined) && name === "id")
    ) {
      setErrorMessage(null);
      return false;
    }
    let valid = validate({
      [name]: oldValue === "" ? undefined : oldValue,
    });
    if (valid && valid[name]) {
      setErrorMessage(valid[name]);
      return true;
    } else {
      setErrorMessage(null);
      return false;
    }
  }, [validate, oldValue, name]);

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
        fetchOptions(null);
      }
    }
  }, [fetchOptions, open, propOptions]);

  useEffect(() => {
    if (propOptions) {
      setLoading(true);
      setOptions(propOptions);
      setLoading(false);
    }
  }, [propOptions]);

  return (
    <React.Fragment>
      <ClickAwayListener onClickAway={() => setOpen(false)}>
        <Select
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => {
            setSearchText("");
            setOpen(false);
          }}
          defaultValue={defaultValue}
          clearOnEscape
          removeOnBackspace
          autoComplete
          clearIcon={!disableClearable}
          style={{ margin: "8px 0 " }}
          invalid={isError}
          className={className}
          options={loading ? [] : options}
          customOptions={customOptions}
          placeholder={translate(placeholder || title)}
          multiple={multiple}
          value={open ? (multiple ? oldValue ?? [] : "") : oldValue ?? null}
          disabled={disabled}
          renderValue={({ option }) => {
            return multiple ? (
              <Badge bg="primary">
                <Box d="flex" alignItems="center" g={1}>
                  <Box as="span">{getOptionLabel(option)}</Box>
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
            ) : (
              oldValue
            );
          }}
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
          optionEqual={(option, val) => {
            if (!val) return;
            let optionName = "";
            if (name === "itemName" || name === "userFieldPath") {
              optionName = option["label"]
                ? "label"
                : option["title"]
                ? "title"
                : option["name"]
                ? "name"
                : "name";
            } else if (name === "wkfModel") {
              optionName = `${option?.wkfModel?.name || ""} (${
                option["name"]
              })`;
            } else if (name === "multiSelect") {
              return option === val;
            } else {
              optionName = option[optionLabel]
                ? optionLabel
                : option["title"]
                ? "title"
                : "name";
            }
            if (!val[optionName] && val)
              return `"${option[optionName]}"` === val;
            return option[optionName] === val[optionName];
          }}
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
              const titles = value
                ?.map((v) => v["lable"] || v["title"])
                .join(",");
              const secondaryOptionLabels = value
                ?.map((v) => v[optionLabelSecondary])
                .join(",");
              const optionLabels = value?.map((v) => v[optionLabel]).join(",");
              update(
                values,
                name === "itemName" && value
                  ? titles
                  : optionLabelSecondary === "title"
                  ? secondaryOptionLabels
                  : optionLabels
              );
              return;
            }
            update(
              values,
              name === "itemName" && value
                ? value["label"] || value["title"]
                : optionLabelSecondary === "title"
                ? value && value[optionLabelSecondary]
                : value && value[optionLabel],
              oldValue
            );
          }}
          name={name}
          onInputChange={(val) => setsearchText(val)}
          //TODO add dynamic support for optionLabel
          optionLabel={(option) => getOptionLabel(option)}
          optionKey={(x) => x.id}
          {...rest}
        />
      </ClickAwayListener>
      {errorMessage && (
        <InputFeedback invalid fontSize={6}>
          {translate(errorMessage)}
        </InputFeedback>
      )}
      {description && <Description desciption={description} />}
    </React.Fragment>
  );
}
