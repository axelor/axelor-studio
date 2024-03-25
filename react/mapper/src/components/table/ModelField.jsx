import React from 'react';

import Popover from '../Popover';
import { Box, InputLabel } from '@axelor/ui';

const RelationalFieldList = [
  'one_to_one',
  'many_to_one',
  'many_to_many',
  'one_to_many',
  'json_one_to_one',
  'json_many_to_one',
  'json_many_to_many',
  'json_one_to_many',
];

export const isRelationalField = (row) => {
  const type = row.type.replace(/-/g, '_').toLowerCase();
  return RelationalFieldList.indexOf(type) !== -1;
};

const getFields = (item) => {
  if (isRelationalField(item)) {
    const { value } = item;
    return value?.fields || null;
  }
  return null;
};

function ModelFieldComponent(props) {
  const { item, handleAdd } = props;
  const [showSubField, setShowSubField] = React.useState(false);
  const fields = getFields(item);

  React.useEffect(() => {
    if (item && isRelationalField(item) && item['subFieldName']) {
      setShowSubField(true);
    }
  }, [item]);

  if (!item) {
    return null;
  }
  return (
    <Box d="flex" w={100}>
      <InputLabel mb={0}>
        {item['title'] || item['autoTitle'] || item['name']}
      </InputLabel>
      <div>
        {fields && showSubField && (
          <Popover
            open
            data={fields}
            onClose={() => setShowSubField(false)}
            onSubmit={(data) => handleAdd(data)}
          />
        )}
      </div>
    </Box>
  );
}

export default React.memo(ModelFieldComponent);
