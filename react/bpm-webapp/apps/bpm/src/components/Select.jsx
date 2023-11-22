import React, { useState, useRef, useEffect, useCallback } from "react";
import classnames from "classnames";
import AutoComplete from "@material-ui/lab/Autocomplete";
import { TextField, CircularProgress } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

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

const useStyles = makeStyles((theme) => ({
  option: {
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    display: "list-item !important",
  },
  autoComplete: {
    "& > div > label": {
      fontSize: 14,
    },
    "& > div > div": {
      paddingRight: "15px !important",
    },
    margin: "8px 0px",
    background: "white",
    border: "1px solid #ccc",
    padding: "0px 5px",
  },
  input: {
    fontSize: 14,
    color: theme.palette.common.black,
    padding: "3px 0 3px !important",
  },
  label: {
    fontSize: 14,
  },
  endAdornment: {
    top: 0,
  },
  circularProgress: {
    color: "#0A73FA",
  },
  error: {
    borderColor: "#cc3333 !important",
    background: "#f0c2c2",
    "&:focus": {
      boxShadow: "rgba(204,58,51, 0.2) 0px 0px 1px 2px !important",
      outline: "none",
      borderColor: "#cc3333 !important",
    },
  },
  errorDescription: {
    marginTop: 5,
    color: "#CC3333",
  },
  disabled: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.38)",
    padding: "3px 0 3px !important",
  },
  disableAutoComplete: {
    background: "#dddddd",
  },
}));

export default function SelectComponent({
  name,
  optionLabel = "title",
  optionLabelSecondary = "name",
  multiple = false,
  index,
  value: oldValue,
  update,
  type,
  options: propOptions,
  label,
  fetchMethod,
  isLabel = true,
  error = false,
  className,
  defaultValue,
  isTranslated = true,
  skipFilter = false,
  placeholder,
  validate,
  disabled = false,
  disableUnderline = true,
  disableClearable = false,
  isOptionEllipsis = false,
  description,
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [searchText, setsearchText] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isError, setError] = useState(false);
  const classes = useStyles();

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
  }, [fetchOptions, searchText]);

  useDebounceEffect(optionDebounceHandler, 500);

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
      <AutoComplete
        classes={{
          inputFocused: disabled ? classes.disabled : classes.input,
          clearIndicator: disabled ? classes.disabled : classes.input,
          popupIndicator: disabled ? classes.disabled : classes.input,
          endAdornment: classes.endAdornment,
          option: isOptionEllipsis ? classes.option : "",
        }}
        size="small"
        key={index}
        open={open}
        onOpen={(e) => {
          e && e.stopPropagation();
          setOpen(true);
        }}
        onClose={(e) => {
          e && e.stopPropagation();
          setOpen(false);
        }}
        onClick={(e) => {
          e && e.stopPropagation();
          setOpen(true);
        }}
        loading={loading}
        defaultValue={defaultValue}
        clearOnEscape
        autoComplete
        className={classnames(
          classes.autoComplete,
          className,
          isError && classes.error,
          disabled && classes.disableAutoComplete
        )}
        disableClearable={disableClearable}
        options={options}
        multiple={multiple}
        value={open ? (multiple ? oldValue || [] : "") : oldValue}
        disabled={disabled}
        getOptionSelected={(option, val) => {
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
            optionName = `${
              option["wkfModel"] && option["wkfModel"]["name"]
            } (${option["name"]})`;
          } else if (name === "multiSelect") {
            return option === val;
          } else {
            optionName = option[optionLabel]
              ? optionLabel
              : option["title"]
              ? "title"
              : "name";
          }
          if (!val[optionName] && val) return `"${option[optionName]}"` === val;
          return option[optionName] === val[optionName];
        }}
        onChange={(e, value) => {
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
        onInputChange={(e, val) => setsearchText(val)}
        renderInput={(params) => (
          <TextField
            error={error}
            disabled={disabled}
            helperText={error ? translate("Required") : ""}
            className={isError ? classes.error : ""}
            fullWidth
            {...params}
            InputProps={{
              ...(params.InputProps || {}),
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
              onClick: (e) => e && e.stopPropagation(),
              disableUnderline,
            }}
            inputProps={{
              ...(params.inputProps || {}),
              onClick: (e) => {
                e && e.stopPropagation();
                params.inputProps &&
                  params.inputProps.onClick &&
                  params.inputProps.onClick(e);
              },
            }}
            placeholder={translate(placeholder) || ""}
            InputLabelProps={{
              className: classes && classes.label,
            }}
            label={isLabel ? translate(label) : undefined}
          />
        )}
        getOptionLabel={(option) => {
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
            optionName = `${option["name"]} (${option["decisionId"]})`;
          } else if (name === "wkfModel") {
            optionName = `${
              option["wkfModel"] && option["wkfModel"]["name"]
            } (${option["name"]})`;
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
        }}
      />
      {errorMessage && (
        <div className={classes.errorDescription}>
          {translate(errorMessage)}
        </div>
      )}
      {description && <Description desciption={description} />}
    </React.Fragment>
  );
}
