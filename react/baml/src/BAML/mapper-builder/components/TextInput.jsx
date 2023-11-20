import React from "react";
import PropTypes from "prop-types";
import Input from "@material-ui/core/Input";
import { TextField } from "@material-ui/core";

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
  ...other
}) {
  const [text, setText] = React.useState();

  React.useEffect(() => {
    setText(value);
  }, [value]);

  if (inline) {
    return (
      <Input
        style={{ width: "100%", ...style }}
        placeholder={title}
        inputProps={{ "aria-label": title }}
        name={name}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        autoComplete="off"
        readOnly={readOnly}
        disabled={readOnly}
        value={text || ""}
        {...other}
      />
    );
  }
  return (
    <TextField
      label={title || autoTitle}
      name={name}
      style={{ width: "100%", ...style }}
      onChange={(e) => setText(e.target.value)}
      onBlur={onBlur}
      autoComplete="off"
      InputProps={{ readOnly, ...InputProps }}
      value={text || ""}
      className={other.className}
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
