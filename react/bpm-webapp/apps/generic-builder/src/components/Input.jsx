import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@axelor/ui';
import { translate } from '../utils';

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
  ...other
}) {
  if (inline) {
    return (
      <Input
        type="text"
        style={{ width: '100%', ...style }}
        placeholder={translate(title)}
        inputProps={{ 'aria-label': title }}
        name={name}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={readOnly}
        disabled={readOnly}
        value={value || ''}
        {...other}
      />
    );
  }
  return (
    <Input
      id={`filled-${name}`}
      type="text"
      label={translate(title || autoTitle)}
      name={name}
      style={{ width: '100%', ...style }}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      value={value || ''}
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
};

InputField.defaultProps = {
  readOnly: false,
};
export default InputField;
