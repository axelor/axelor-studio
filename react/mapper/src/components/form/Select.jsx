import classnames from 'classnames';

import { Select, Box } from '@axelor/ui';

import { translate } from '../../utils';
import styles from './Select.module.css';

export default function Selection({
  name,
  value = '',
  onChange,
  options,
  title,
  className,
  error,
  ...rest
}) {
  const selectedValue = React.useMemo(() => {
    return (options || []).find((op) => op.name === value) || null;
  }, [value, options]);

  return (
    <Box
      d="flex"
      flexDirection="column"
      className={classnames(styles.formControl, className)}
    >
      <Select
        value={selectedValue}
        onChange={(value) => onChange(value?.name)}
        name={name}
        className={styles.select}
        flex="1"
        placeholder={translate(title) || ''}
        invalid={error && !value}
        options={options}
        optionKey={(option) => option.id || option.name}
        optionLabel={(option) => translate(option.title)}
        {...rest}
      />
    </Box>
  );
}
