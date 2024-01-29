import React from 'react';
import { translate } from '../../utils';
import moment from 'moment';
import { Input, InputFeedback } from '@axelor/ui';

export default function DateTimePicker({ inline, type = 'date', ...props }) {
  const { name, title, format, value, error, onChange, row, ...other } = props;
  const { selected } = row?.value;
  const momentFormat = type === 'datetime' ? 'YYYY-MM-DDTHH:mm' : 'YYYY-MM-DD';

  return (
    <>
      <Input
        name={name}
        type={type === 'datetime' ? 'datetime-local' : type}
        onChange={(e) => onChange(moment(e?.target?.value))}
        value={value ? moment(value).format(momentFormat) : ''}
        invalid={error && !selected?.value}
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
      {error && !inline && !selected?.value && (
        <InputFeedback invalid>Invalid date</InputFeedback>
      )}
    </>
  );
}
