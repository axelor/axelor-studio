import React from "react";
import PropTypes from "prop-types";
import { translate } from "../../../utils";
import { Input, TextField } from "@axelor/ui";

function InputField({
  name,
  title,
  autoTitle,
  value = "",
  onChange,
  onBlur,
  readOnly,
  inline,
  InputProps,
  style,
  disableUnderline = false,
  className,
  ...other
}) {
  if (inline) {
    return (
      <Input
        style={{ width: "100%", ...style }}
        placeholder={translate(title)}
        name={name}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete="off"
        readOnly={readOnly}
        disabled={readOnly}
        value={value || ""}
        {...other}
      />
    );
  }
  return (
    <TextField
      id={`filled-${name}`}
      label={translate(title || autoTitle)}
      name={name}
      style={{ width: "100%", ...style }}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      autoComplete="off"
      InputProps={{ readOnly, ...InputProps, disableUnderline }}
      value={value || ""}
      {...other}
    />
  );
}

InputField.propTypes = {
  name: PropTypes.string,
  title: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
};

InputField.defaultProps = {
  rows: 3,
  readOnly: false,
};
export default InputField;
