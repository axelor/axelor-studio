import React from 'react';
import { TextField } from '@axelor/ui';

function Input(props) {
  const { value, onChange, onClearError, error } = props;
  const [text, setText] = React.useState('');

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
    setText(value || '');
  }, [value]);

  return (
    <TextField
      w={100}
      name="value"
      value={text}
      onBlur={handleBlur}
      onChange={handleChange}
      invalid={error && (!text || text.trim() === '')}
    />
  );
}

export default React.memo(Input);
