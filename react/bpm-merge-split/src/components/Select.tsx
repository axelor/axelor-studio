/**
 * BPM-merge-split fork of @studio/shared Select.
 * Diverges from shared/Select.tsx: simplified for merge/split workflow.
 * See Phase 42 / Select deduplication for planned consolidation.
 */
import React, { useState, useEffect , useCallback  } from "react";
import { Select, ClickAwayListener } from "@axelor/ui";
import { translate } from "@studio/shared/i18n";

interface SelectOption {
  id?: number | string;
  name?: string;
  key?: string;
  title?: React.ReactNode;
  disabled?: boolean;
  [key: string]: unknown;
}

interface SelectionProps {
  value?: SelectOption | string | null;
  label?: string;
  onChange?: (value: SelectOption | null) => void;
  options?: SelectOption[];
  onSearch?: (text: string) => Promise<void>;
  getOptionSelected?: (option: SelectOption, value: SelectOption) => boolean;
  open?: boolean;
  autoFocus?: boolean;
  disableClearable?: boolean;
  autoComplete?: boolean;
  placeholder?: string;
  getOptionLabel?: (option: SelectOption) => string;
  openOnFocus?: boolean;
  [key: string]: unknown;
}

function Selection({
  value,
  _label,
  onChange = () => {},
  options,
  onSearch,
  getOptionSelected = (option: SelectOption, value: SelectOption) => option.name === value.name,
  open: showDropDown,
  autoFocus,
  disableClearable,
  autoComplete = true,
  placeholder = "",
  ...props
}: SelectionProps) {
  const [open, setOpen] = useState(showDropDown ?? false);
  const [searchText, setSearchText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const search = React.useCallback(
    async (searchText: string | null = "") => {
      setLoading(true);
      if (onSearch) await onSearch(searchText ?? "");
      setLoading(false);
    },
    [onSearch],
  );

  const handleChange = React.useCallback(
    (value: SelectOption | null) => {
      onChange(value);
    },
    [onChange],
  );

  const handleTextChange = React.useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const findOptionLabel = useCallback(
    (option: SelectOption | string): string =>
      typeof option === "string"
        ? option
        : props.getOptionLabel
          ? props.getOptionLabel(option)
          : (option.name ?? ""),
    [props],
  );

  const customOptions = React.useMemo(() => {
    const optionList = options?.filter((op: SelectOption) =>
      findOptionLabel(op)
        ?.toLowerCase()
        ?.includes(searchText?.toLowerCase() ?? ""),
    );
    if (loading) {
      return [
        {
          key: "loading",
          title: <span>{translate("Loading...")}</span>,
          disabled: true,
        },
      ];
    }

    if (!optionList?.length) {
      return [
        {
          key: "no-options",
          title: <span>{translate("No options")}</span>,
          disabled: true,
        },
      ];
    }
    return [];
  }, [options, loading, findOptionLabel, searchText]);

  //Temporary way to solve onBlur problem
  React.useEffect(() => {
    const handleMouseDownOutside = (event: MouseEvent) => {
      // Check if the mouse down is outside the listbox and combobox
      const option = document.querySelector('[role="listbox"]');
      const selection = document.querySelector('[role="combobox"]');
      if (
        option &&
        !option.contains(event.target as Node) &&
        selection &&
        !selection.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleMouseDownOutside);
      return () => {
        document.removeEventListener("mousedown", handleMouseDownOutside);
      };
    }
  }, [open]);

  useEffect(() => {
    void search(searchText);
  }, [search, searchText]);

  return (
    <React.Fragment>
      <ClickAwayListener
        onClickAway={() => {
          if (open) {
            setSearchText("");
            setOpen(false);
          }
        }}
      >
        <Select
          ref={inputRef}
          openOnFocus={true}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          open={open}
          onInputChange={(value: string) => {
            handleTextChange(value);
          }}
          onOpen={() => {
            if (!open) {
              setOpen(true);
              void search(searchText);
            }
          }}
          placeholder={translate(placeholder)}
          onClose={() => open && setOpen(false)}
          removeOnBackspace={false}
          clearOnEscape={false}
          clearIcon={!disableClearable ? undefined : false}
          multiple={false}
          customOptions={customOptions}
          optionKey={(option: SelectOption) => String(option.id ?? findOptionLabel(option))}
          optionLabel={(option: SelectOption) => findOptionLabel(option)}
          options={loading ? [] : (options ?? [])}
          onChange={handleChange as (value: unknown) => void}
          value={open ? undefined : (value as SelectOption | undefined)}
          optionEqual={getOptionSelected}
          optionMatch={(option: SelectOption, text: string) => {
            const currentOption = findOptionLabel(option);
            return !!currentOption?.toString()?.toLowerCase()?.includes(text?.toLowerCase());
          }}
        />
      </ClickAwayListener>
    </React.Fragment>
  );
}

export default Selection;
