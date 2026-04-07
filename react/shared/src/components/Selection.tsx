import React, { useEffect, useState } from "react";
import { Badge, Select, ClickAwayListener, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import _uniqueId from "lodash/uniqueId";

import { translate } from "../i18n/index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOption = any;

function useDebounce<T extends (...args: string[]) => void>(cb: T, duration: number) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const setTimer = (fn: () => void) => (timer.current = setTimeout(fn, duration));

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  return (...args: string[]) => {
    clearTimer();
    setTimer(() => cb(...args));
  };
}

const defaultGetOptionLabel = (option: AnyOption, { optionLabelKey = "title" } = {}): string => {
  if (!option) return "";
  if (option[optionLabelKey]) return option[optionLabelKey];
  if (option["name"]) return option["name"];
  if (option["id"]) return option["id"].toString();
  return "";
};

interface SelectionProps {
  name?: string;
  value?: AnyOption;
  onChange: (value: AnyOption, reason?: string) => void;
  options?: AnyOption[];
  optionLabelKey?: string;
  optionValueKey?: string;
  isMulti?: boolean;
  title?: string;
  fetchAPI?: (params: { search: string }) => Promise<AnyOption[]>;
  inline?: boolean;
  InputProps?: Record<string, unknown>;
  error?: boolean;
  filterSelectedOptions?: boolean;
  disableCloseOnSelect?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  disableClearable?: boolean;
  placeholder?: string;
  className?: string;
  handleRemove?: (option: AnyOption) => void;
  isLoading?: boolean;
  getOptionLabel?: (option: AnyOption, context: Record<string, unknown>) => string;
  renderValue?: (props: { option: AnyOption }) => React.ReactNode;
  concatValue?: boolean;
  isProcessContext?: boolean;
  inputRootClass?: string;
  [key: string]: unknown;
}

export function Selection(props: SelectionProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AnyOption[]>([]);
  const [selectedValue, setSelectedValue] = useState<AnyOption>(props.isMulti ? [] : null);
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
    inline: _inline,
    InputProps: _InputProps,
    error,
    filterSelectedOptions: _filterSelectedOptions,
    disableCloseOnSelect: _disableCloseOnSelect,
    readOnly = false,
    disabled = false,
    disableClearable = false,
    placeholder = "",
    className,
    handleRemove,
    isLoading: externalLoading,
    getOptionLabel: getOptionLabelProp,
    renderValue: renderValueProp,
    concatValue,
    isProcessContext: _isProcessContext,
    inputRootClass: _inputRootClass,
    ...other
  } = props;

  const [loading, setLoading] = useState(false);

  const getKey = React.useCallback((key: string) => (key === "_selectId" ? "id" : key), []);

  const findOption = React.useCallback(
    (option: string) => {
      return (
        flatOptions &&
        flatOptions.find((i: AnyOption) => i && i[getKey(optionValueKey)] === option.trim())
      );
    },
    [flatOptions, optionValueKey, getKey],
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
            setLoading(externalLoading || false);
          }
        })();
      } else {
        setOptions(flatOptions ?? []);
        setLoading(externalLoading || false);
      }
    }
    return () => {
      active = false;
      setLoading(false);
    };
  }, [fetchAPI, flatOptions, inputValue, open, externalLoading]);

  useEffect(() => {
    if (typeof value === "string") {
      const values = value.split(",");
      setSelectedValue(isMulti ? values.map((v: string) => findOption(v)) : findOption(values[0]));
    } else {
      setSelectedValue(value ? value : isMulti ? [] : null);
    }
  }, [value, isMulti, findOption]);

  function handleChange(item: AnyOption, reason?: string) {
    if (typeof value === "string") {
      isMulti
        ? onChange(
            item.map((i: AnyOption) => i && i[getKey(optionValueKey)]).join(",") || [],
            reason,
          )
        : onChange(item && item[getKey(optionValueKey)], reason);
    } else {
      if (isMulti && item?.length) {
        onChange(
          item.map((i: AnyOption, ind: number) => ({ ...i, trackKey: ind })),
          reason,
        );
      } else {
        onChange(item, reason);
      }
    }
  }

  const checkValue = React.useCallback(
    (option: AnyOption) => {
      if (getOptionLabelProp) {
        return getOptionLabelProp(option, {
          optionLabelKey: getKey(optionLabelKey),
          optionValueKey: getKey(optionValueKey),
          name,
          concatValue,
        });
      }
      return defaultGetOptionLabel(option, {
        optionLabelKey: getKey(optionLabelKey),
      });
    },
    [getOptionLabelProp, optionLabelKey, optionValueKey, name, concatValue, getKey],
  );

  const customOptions = React.useMemo(() => {
    if (loading) {
      return [
        {
          key: "loading",
          title: translate("Loading..."),
        },
      ];
    }
    if (!options?.length) {
      return [
        {
          key: "no-options",
          title: translate("No options"),
        },
      ];
    }
    return [];
  }, [loading, options]);

  const defaultMultiRenderValue = React.useCallback(
    ({ option }: { option: AnyOption }) => {
      if (!isMulti) return null;
      return (
        <Badge bg="primary">
          <Box d="flex" alignItems="center" g={1}>
            <Box as="span">{checkValue(option)}</Box>
            <Box as="span" style={{ cursor: "pointer" }}>
              <MaterialIcon
                icon="close"
                fontSize="1rem"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (handleRemove) {
                    handleRemove(option);
                  }
                }}
              />
            </Box>
          </Box>
        </Badge>
      );
    },
    [isMulti, checkValue, handleRemove],
  );

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Select
        optionEqual={(option: AnyOption, val: AnyOption) => {
          return isMulti
            ? option[getKey(optionValueKey)] === val[getKey(optionValueKey)]
            : checkValue(option) === checkValue(val);
        }}
        optionLabel={(option: AnyOption) => checkValue(option)}
        autoComplete
        clearOnEscape
        removeOnBackspace
        removeOnDelete
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        id={_uniqueId("select-widget")}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        placeholder={translate(placeholder || title || "")}
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
        optionMatch={(option: AnyOption, text = "") => {
          if (text === "") return true;
          const key = text.toLowerCase();
          const optionName = option?.name?.toLowerCase() || "";
          const optionTitle = option?.title?.toLowerCase() || "";
          if (optionName.includes(key) || optionTitle.includes(key)) {
            return true;
          }
          return false;
        }}
        onChange={(newValue: AnyOption) => handleChange(newValue)}
        options={loading ? [] : (options ?? [])}
        customOptions={customOptions}
        multiple={isMulti}
        onInputChange={(value: string) => delayChange(value)}
        clearIcon={!disableClearable as false | undefined}
        renderValue={(renderValueProp || defaultMultiRenderValue) as AnyOption}
        optionKey={(option: AnyOption) => option.id || option.name}
        invalid={error}
        {...(isMulti ? { closeOnSelect: false } : {})}
        {...other}
      />
    </ClickAwayListener>
  );
}
