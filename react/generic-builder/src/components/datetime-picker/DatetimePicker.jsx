import React from 'react';
import { translate } from '../../common/utils';
import { Input, InputFeedback } from '@axelor/ui';
import moment from 'moment';

function DateTimePicker({ inline, type = 'date', ...props }) {
  const { name, title, format, error, onChange, value, ...other } = props;
  const momentFormat = type === 'datetime' ? 'YYYY-MM-DDTHH:mm' : 'YYYY-MM-DD';
  return (
    <>
      <Input
        name={name}
        type={type === 'datetime' ? 'datetime-local' : type}
        onChange={e => onChange(moment(e?.target?.value))}
        value={value ? moment(value).format(momentFormat) : ''}
        invalid={error}
        style={{
          width: '100%',
          padding: '0.375rem 0.75rem',
          ...(inline ? { margin: 0 } : {}),
        }}
        format={format}
        placeholder={inline ? '' : translate(title)}
        rounded
        {...other}
      />
      {error && !inline && <InputFeedback invalid>Invalid date</InputFeedback>}
    </>
  );
}

export default DateTimePicker;
