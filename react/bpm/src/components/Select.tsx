/**
 * BPM-specific fork of @studio/shared Select.
 * Diverges from shared/Select.tsx: adds BPM-specific option rendering
 * and field binding logic. See Phase 42 / Select deduplication for
 * planned consolidation.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ClickAwayListener, InputFeedback, Select as BaseSelect, Badge, Box } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";
import { Description } from "@studio/shared/components";
import { translate } from "@studio/shared/i18n";

type SelectOption = Record<string, unknown>;

// Cast Select to accept SelectOption with dynamic multiple (boolean, not literal true/false)
// The @axelor/ui Select requires Multiple extends boolean, but with a variable boolean
// TS can't narrow the value type. This cast preserves structural safety while allowing dynamic multiple.
const Select = BaseSelect as unknown as React.FC< // safety: @axelor/ui Select generic props differ from local SelectOption shape
  Record<string, unknown> & {
    options: SelectOption[];
    multiple?: boolean;
    value?: unknown;
    defaultValue?: unknown;
    open?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    className?: string;
    placeholder?: string;
    clearOnEscape?: boolean;
    removeOnBackspace?: boolean;
    autoComplete?: boolean;
    clearIcon?: unknown;
    customOptions?: { key: string; title: string; disabled?: boolean }[];
    onChange?: (value: unknown) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onInputChange?: (value: string) => void;
    optionKey?: (option: SelectOption) => string | number;
    optionLabel?: (option: SelectOption) => string;
    optionEqual?: (option: SelectOption, value: SelectOption) => boolean;
    optionMatch?: (option: SelectOption, text: string) => boolean;
    renderOption?: (props: { option: SelectOption }) => React.JSX.Element | null;
    renderValue?: (props: { option: SelectOption }) => React.JSX.Element | null;
    name?: string;
    style?: React.CSSProperties;
  }
>;

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
  optionLabel?: string;
  optionLabelSecondary?: string;
  multiple?: boolean;
  value?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update?: (...args: any[]) => void;
  type?: string;
  options?: SelectOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchMethod?: (...args: any[]) => any;
  className?: string;
  defaultValue?: unknown;
  isTranslated?: boolean;
  skipFilter?: boolean;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate?: (...args: any[]) => any;
  disabled?: boolean;
  disableClearable?: boolean;
  description?: string;
  handleRemove?: (option: unknown) => void;
  title?: string;
  customOptionLabel?: (option: unknown, isTranslated: boolean) => string;
  customOptionEqual?: (option: unknown, val: unknown, optionName: string) => boolean;
  customOnChange?: (value: unknown) => void;
  isLabel?: boolean;
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
  const [options, setOptions] = useState<SelectOption[]>([]);
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
    (searchText = "") => {
      if (!open) return;
      setLoading(true);
      const criteria: SelectOption[] = [];
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fetchMethod({ criteria }).then((fetchedOptions: any) => {
        setLoading(false);
        if (fetchedOptions && Array.isArray(fetchedOptions)) {
          const filterOptions = skipFilter
            ? fetchedOptions
            : fetchedOptions.filter(
                (option: SelectOption) => optionLabel && option[optionLabel] !== null,
              );
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

  const getOptionLabel = (option: unknown): string => {
    let optionName = "";
    // if option is not type of object then simply return it
    if (typeof option !== "object") return String(option ?? "");

    const record = option as SelectOption;
    const primaryLabel =
      optionLabel &&
      (optionLabel
        .split(".")
        .reduce(
          (acc: unknown, item: string) =>
            (acc as Record<string, unknown>)?.[item] ?? "",
          record,
        ) as unknown as string); // safety: Axelor REST response value is dynamic
    const secondayLabel =
      optionLabelSecondary &&
      (optionLabelSecondary
        .split(".")
        .reduce(
          (acc: unknown, item: string) =>
            (acc as Record<string, unknown>)?.[item] ?? "",
          record,
        ) as unknown as string); // safety: Axelor REST response value is dynamic

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
        fetchOptions("");
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
          defaultValue={defaultValue as SelectOption | SelectOption[] | null | undefined}
          clearOnEscape
          removeOnBackspace
          autoComplete
          clearIcon={disableClearable ? false : undefined}
          style={{ margin: "8px 0 " }}
          invalid={isError}
          className={className}
          options={loading ? [] : options}
          customOptions={customOptions}
          placeholder={translate(placeholder || title)}
          multiple={multiple}
          value={
            open
              ? multiple
                ? ((oldValue ?? []) as SelectOption[])
                : ("" as unknown as SelectOption) // safety: empty string as fallback for unselected state
              : ((oldValue ?? null) as SelectOption | SelectOption[] | null)
          }
          disabled={disabled}
          renderValue={({ option }) => {
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
            ) : null;
          }}
          optionMatch={(option, text = "") => {
            if (text === "") return true;
            const key = text.toLowerCase();
            const optName = String(option?.name ?? "").toLowerCase();
            const optTitle = String(option?.title ?? "").toLowerCase();
            if (optName.includes(key) || optTitle.includes(key)) {
              return true;
            }
            return false;
          }}
          optionEqual={(option, val) => {
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
              const wkfModel = option?.wkfModel as SelectOption | undefined;
              optionName = `${wkfModel?.name || ""} (${option["name"]})`;
            } else if (name === "multiSelect") {
              return option === val;
            } else {
              optionName =
                (optionLabel && option[optionLabel]) ? optionLabel : option["title"] ? "title" : "name";
            }
            if (!val[optionName] && val)
              return `"${option[optionName]}"` === String(val);
            if (customOptionEqual) {
              return customOptionEqual(option, val, optionName);
            } else {
              return option[optionName] === val[optionName];
            }
          }}
          onChange={(value) => {
            if (customOnChange) {
              customOnChange(value);
            } else {
              const valueArr = value as SelectOption[] | null;
              const valueSingle = value as SelectOption | null;
              if (type === "multiple" && valueArr) {
                const dedupValues = valueArr.filter(
                  (val: SelectOption, i: number, self: SelectOption[]) =>
                    i ===
                    self.findIndex(
                      (t: SelectOption) =>
                        optionLabel && t[optionLabel] === val[optionLabel],
                    ),
                );
                const titles = valueArr
                  .map((v: SelectOption) => v["lable"] || v["title"])
                  .join(",");
                const secondaryOptionLabels = optionLabelSecondary
                  ? valueArr.map((v: SelectOption) => v[optionLabelSecondary]).join(",")
                  : "";
                const optionLabels = optionLabel
                  ? valueArr.map((v: SelectOption) => v[optionLabel]).join(",")
                  : "";
                update?.(
                  dedupValues,
                  name === "itemName" && valueArr
                    ? titles
                    : optionLabelSecondary === "title"
                      ? secondaryOptionLabels
                      : optionLabels,
                );
                return;
              }
              update?.(
                value,
                name === "itemName" && valueSingle
                  ? valueSingle["label"] || valueSingle["title"]
                  : optionLabelSecondary === "title"
                    ? valueSingle && valueSingle[optionLabelSecondary ?? ""]
                    : valueSingle && optionLabel ? valueSingle[optionLabel] : undefined,
                oldValue,
              );
            }
          }}
          name={name}
          onInputChange={(val: string) => setSearchText(val)}
          optionLabel={(option) =>
            customOptionLabel ? customOptionLabel(option, isTranslated) : getOptionLabel(option)
          }
          optionKey={(x) => (x.id as string | number) ?? (x.name as string) ?? ""}
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
