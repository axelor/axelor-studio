import React from 'react';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

import Popover from '../Popover';

const useStyles = makeStyles({
  input: {
    width: '100%',
    display: 'flex',
    position: 'relative',
    '& > div:before': {
      border: 0,
    },
  },
  fieldNameColumn: {
    width: 'unset',
  },
});

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
  const classes = useStyles();
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
    <div className={classNames(classes.input)}>
      <Grid container direction="column" className={classes.fieldNameColumn}>
        <Typography title={item['name']}>
          {item['title'] || item['autoTitle'] || item['name']}
        </Typography>
      </Grid>
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
    </div>
  );
}

export default React.memo(ModelFieldComponent);
