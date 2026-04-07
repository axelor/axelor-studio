import React, { useState, useRef, useEffect, useCallback } from "react";
import { ClickAwayListener, InputFeedback, Select, Badge, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

import { translate } from "../i18n/index";

import { Description } from "./Description";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOption = any;

function useDebounceEffect(handler: () => void, interval: number) {
  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current) {
      const timer = setTimeout(() => handler(), interval);
      return () => clearTimeout(timer);
    }
    isMounted.current = true;
  }, [handler, interval]);
}

interface SelectComponentProps {
  name: string;
  optionLabel: string;
  optionLabelSecondary?: string;
  multiple?: boolean;
  value?: AnyOption;
  update: (value: AnyOption, label?: string, oldValue?: AnyOption) => void;
  type?: string;
  options?: AnyOption[];
  fetchMethod?: (params: { criteria: AnyOption[] }) => Promise<AnyOption[]>;
  className?: string;
  defaultValue?: AnyOption;
  isTranslated?: boolean;
  skipFilter?: boolean;
  placeholder?: string;
  validate?: (data: Record<string, unknown>) => Record<string, string> | null;
  disabled?: boolean;
  disableClearable?: boolean;
  description?: string;
  handleRemove?: (option: AnyOption) => void;
  title?: string;
  customOptionLabel?: (option: AnyOption, isTranslated: boolean) => string;
  customOptionEqual?: (option: AnyOption, val: AnyOption, optionName: string) => boolean;
  customOnChange?: (value: AnyOption) => void;
  [key: string]: unknown;
}

export default function SelectComponent({
  name,
  optionLabel,
  optionLabelSecondary,
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
  customOptionLabel,
  customOptionEqual,
  customOnChange,
  ...rest
}: SelectComponentProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AnyOption[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    (searchText: string | null = "") => {
      if (!open) return;
      setLoading(true);
      const criteria: AnyOption[] = [];
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
      return fetchMethod({ criteria }).then((options: AnyOption[]) => {
        setLoading(false);
        if (options && Array.isArray(options)) {
          const filterOptions = skipFilter
            ? options
            : options.filter((option: AnyOption) => option[optionLabel] !== null);
          setOptions(filterOptions || []);
        }
      });
    },
    [open, fetchMethod, optionLabel, skipFilter],
  );

  const optionDebounceHandler = React.useCallback(() => {
    fetchOptions(searchText);
  }, [searchText]);

  useDebounceEffect(optionDebounceHandler, 500);

  const getOptionLabel = (option: AnyOption): string => {
    let optionName = "";
    // if option is not type of object then simply return it
    if (typeof option !== "object") return option;

    const primaryLabel =
      optionLabel &&
      optionLabel.split(".").reduce((acc: AnyOption, item: string) => acc[item] || "", option);
    const secondayLabel =
      optionLabelSecondary &&
      optionLabelSecondary
        .split(".")
        .reduce((acc: AnyOption, item: string) => acc[item] || "", option);

    if (primaryLabel && secondayLabel) {
      optionName = `${primaryLabel} (${secondayLabel})`;
    } else if (primaryLabel) {
      optionName = `${primaryLabel}`;
    } else if (secondayLabel) {
      optionName = `${secondayLabel}`;
    }
    return isTranslated ? translate(optionName) : optionName;
  };

  const getValidation = React.useCallback(() => {
    if (!validate || ((oldValue === null || oldValue === undefined) && name === "id")) {
      setErrorMessage(null);
      return false;
    }
    const valid = validate({
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
          clearIcon={!disableClearable as false | undefined}
          {...({ style: { margin: "8px 0 " } } as AnyOption)}
          invalid={isError}
          className={className}
          options={loading ? [] : options}
          customOptions={customOptions}
          placeholder={translate(placeholder || title)}
          multiple={multiple}
          value={open ? (multiple ? (oldValue ?? []) : "") : (oldValue ?? null)}
          disabled={disabled}
          renderValue={({ option }: { option: AnyOption }) => {
            return multiple ? (
              <Badge bg="primary">
                <Box d="flex" alignItems="center" g={1}>
                  <Box as="span">
                    {customOptionLabel
                      ? customOptionLabel(option, isTranslated)
                      : getOptionLabel(option)}
                  </Box>
                  <Box as="span" style={{ cursor: "pointer" }}>
                    <MaterialIcon
                      icon="close"
                      fontSize="1rem"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleRemove?.(option);
                      }}
                    />
                  </Box>
                </Box>
              </Badge>
            ) : (
              oldValue
            );
          }}
          optionMatch={(option: AnyOption, text = "") => {
            if (text === "") return true;
            const key = text.toLowerCase();
            const optName = option?.name?.toLowerCase() || "";
            const optTitle = option?.title?.toLowerCase() || "";
            if (optName.includes(key) || optTitle.includes(key)) {
              return true;
            }
            return false;
          }}
          optionEqual={(option: AnyOption, val: AnyOption): boolean => {
            if (!val) return false;
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
              optionName = `${option?.wkfModel?.name || ""} (${option["name"]})`;
            } else if (name === "multiSelect") {
              return option === val;
            } else {
              optionName = option[optionLabel] ? optionLabel : option["title"] ? "title" : "name";
            }
            if (!val[optionName] && val) return `"${option[optionName]}"` === val;
            if (customOptionEqual) {
              return customOptionEqual(option, val, optionName);
            } else {
              return option[optionName] === val[optionName];
            }
          }}
          onChange={(value: AnyOption) => {
            if (customOnChange) {
              customOnChange(value);
            } else {
              let values = value;
              if (type === "multiple") {
                values =
                  value &&
                  value.filter(
                    (val: AnyOption, i: number, self: AnyOption[]) =>
                      i === self.findIndex((t: AnyOption) => t[optionLabel] === val[optionLabel]),
                  );
                const titles = value?.map((v: AnyOption) => v["lable"] || v["title"]).join(",");
                const secondaryOptionLabels = value
                  ?.map((v: AnyOption) => v[optionLabelSecondary!])
                  .join(",");
                const optionLabels = value?.map((v: AnyOption) => v[optionLabel]).join(",");
                update(
                  values,
                  name === "itemName" && value
                    ? titles
                    : optionLabelSecondary === "title"
                      ? secondaryOptionLabels
                      : optionLabels,
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
                oldValue,
              );
            }
          }}
          name={name}
          onInputChange={(val: string) => setSearchText(val)}
          optionLabel={(option: AnyOption) =>
            customOptionLabel ? customOptionLabel(option, isTranslated) : getOptionLabel(option)
          }
          optionKey={(x: AnyOption) => x.id || x.name}
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
