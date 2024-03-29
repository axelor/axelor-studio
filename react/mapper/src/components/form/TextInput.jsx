import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@axelor/ui';
import { translate } from '../../utils';

function InputField({
  name,
  title,
  autoTitle,
  value = '',
  onChange,
  onBlur,
  readOnly,
  inline,
  InputProps,
  style,
  error,
  ...other
}) {
  const [text, setText] = React.useState();
  const { field } = other || {};
  const showError = !text || text === field?.defaultValue || text.trim() === '';

  React.useEffect(() => {
    setText(value);
  }, [value]);

  if (inline) {
    return (
      <Input
        style={{ width: '100%', ...style }}
        placeholder={translate(title)}
        name={name}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => onBlur(e.target.value)}
        autoComplete="off"
        readOnly={readOnly}
        disabled={readOnly}
        value={text || ''}
        {...other}
        invalid={error && showError}
      />
    );
  }
  return (
    <Input
      placeholder={translate(title || autoTitle)}
      name={name}
      style={{ width: '100%', ...style }}
      onChange={(e) => setText(e.target.value)}
      onBlur={onBlur}
      autoComplete="off"
      readOnly={readOnly}
      value={text || ''}
      className={other.className}
      {...other}
      invalid={error && showError}
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
  minRows: PropTypes.number,
};

InputField.defaultProps = {
  minRows: 3,
  readOnly: false,
};
export default InputField;
