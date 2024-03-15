import React from "react";
import { Input } from "@axelor/ui";

function ModelFieldComponent(props) {
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
      <Input
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
