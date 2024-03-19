import React from 'react';
import { Select, Box } from '@axelor/ui';

import { translate } from '../utils';
import classNames from 'classnames';
import styles from './Select.module.css';

export default function Selection({
  name,
  value = '',
  onChange,
  options,
  title,
  className,
  disableUnderline = false,
  placeholder,
  ...rest
}) {
  const selectedValue = React.useMemo(() => {
    return (options || []).find(op => op.name === value) || null;
  }, [options, value]);

  return (
    <Box d="flex" flexDirection="column">
      <Select
        value={selectedValue}
        onChange={value => onChange(value?.name)}
        name={name}
        options={options}
        customOptions={
          options?.length === 0
            ? [{ title: translate('No options'), key: 'no options' }]
            : []
        }
        placeholder={translate(placeholder || title) || ''}
        optionLabel={option => translate(option.title)}
        optionKey={option => option.name}
        optionName={option => option.name}
        style={{ marginRight: 8, minWidth: 150 }}
        className={classNames(className, styles.select)}
        clearIcon={false}
        {...rest}
      />
    </Box>
  );
}
