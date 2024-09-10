import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Input from '../input/Input';
import { translate } from '../../common/utils';

function NumberField({
  type = 'integer',
  title,
  onChange,
  value = 0,
  readOnly,
  scale = 2,
  customeFormat,
  onBlur: blur,
  ...other
}) {
  let [val, setVal] = useState(value);

  const formatValue = useCallback(
    value => Number(Number(value).toFixed(type === 'integer' ? 0 : scale)),
    [type, scale]
  );

  React.useEffect(() => {
    setVal(formatValue(value));
  }, [value, setVal, formatValue]);

  function onBlur(e) {
    onChange(formatValue(val));
    setVal(formatValue(val));
    blur && blur(e);
  }
  return (
    <Input
      onChange={setVal}
      title={translate(title)}
      type={'number'}
      value={`${val}`}
      onBlur={onBlur}
      {...other}
    />
  );
}
NumberField.propTypes = {
  name: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  scale: PropTypes.number,
  customeFormat: PropTypes.object,
};

NumberField.defaultProps = {
  readOnly: false,
};
export default NumberField;
