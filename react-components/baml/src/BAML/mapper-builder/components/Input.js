import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { TextField } from "@material-ui/core";

const useStyles = makeStyles({
  input: {
    width: "100%",
  },
});

function ModelFieldComponent(props) {
  const classes = useStyles();
  const { value, onChange, onClearError } = props;
  const [text, setText] = React.useState("");

  const handleChange = React.useCallback(
    (e) => {
      setText(e.target.value);
      onClearError && e.target.value && onClearError();
    },
    [onClearError]
  );

  const handleBlur = React.useCallback(
    (e) => {
      onChange(e);
    },
    [onChange]
  );

  React.useEffect(() => {
    setText(value || "");
  }, [value]);

  return (
    <React.Fragment>
      <TextField
        className={classes.input}
        name="value"
        value={text}
        onBlur={handleBlur}
        onChange={handleChange}
      />
    </React.Fragment>
  );
}

const ModelField = React.memo(ModelFieldComponent);
export default ModelField;
