import React, { useState } from "react";
import { Select, ClickAwayListener } from "@axelor/ui";
import { translate } from "../utils";
import { useEffect } from "react";
import { useCallback } from "react";

function Selection({
  value,
  label,
  onChange = () => {},
  options,
  onSearch,
  getOptionSelected = (option, value) => option.name === value.name,
  open: showDropDown,
  autoFocus,
  disableClearable,
  autoComplete = true,
  ...props
}) {
  const [open, setOpen] = useState(showDropDown ?? false);
  const [searchText, setSearchText] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = React.useRef(null);

  const search = React.useCallback(
    async (searchText = "") => {
      setLoading(true);
      await onSearch(searchText);
      setLoading(false);
    },
    [onSearch]
  );

  const handleChange = React.useCallback(
    (value) => {
      onChange(value);
    },
    [onChange]
  );

  const handleTextChange = React.useCallback((value) => {
    setSearchText(value);
  }, []);

  const findOptionLabel = useCallback(
    (option) =>
      typeof option === "string"
        ? option
        : props.getOptionLabel
        ? props.getOptionLabel(option)
        : option.name,
    [props]
  );

  const customOptions = React.useMemo(() => {
    const optionList = options?.filter((op) =>
      findOptionLabel(op)?.toLowerCase()?.includes(searchText?.toLowerCase())
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
    const handleMouseDownOutside = (event) => {
      // Check if the mouse down is outside the listbox and combobox
      const option = document.querySelector('[role="listbox"]');
      const selection = document.querySelector('[role="combobox"]');
      if (
        option &&
        !option.contains(event.target) &&
        selection &&
        !selection.contains(event.target)
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
    search(searchText);
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
          size="small"
          onInputChange={(value) => {
            handleTextChange(value);
          }}
          onOpen={() => {
            if (!open) {
              setOpen(true);
              search(searchText);
            }
          }}
          placeholder={label}
          onClose={() => open && setOpen(false)}
          noOptionsMessage={"No options"}
          removeOnBackspace={false}
          clearOnEscape={false}
          clearIcon={!disableClearable}
          multiple={false}
          customOptions={customOptions}
          optionKey={(option) => option.id ?? findOptionLabel(option)}
          optionLabel={(option) => findOptionLabel(option)}
          optionValue={(option) => findOptionLabel(option)}
          options={loading ? [] : options}
          onChange={handleChange}
          value={open ? null : value}
          optionEqual={getOptionSelected}
          optionMatch={(option, text) => {
            const currentOption = findOptionLabel(option);
            return currentOption
              ?.toString()
              ?.toLowerCase()
              ?.includes(text?.toLowerCase());
          }}
          {...props}
        />
      </ClickAwayListener>
    </React.Fragment>
  );
}

export default Selection;
