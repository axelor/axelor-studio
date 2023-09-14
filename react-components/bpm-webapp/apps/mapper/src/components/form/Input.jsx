import React from 'react';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  input: {
    width: '100%',
  },
});


function Input(props) {
  const classes = useStyles();
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
    <React.Fragment>
      <TextField
        className={classes.input}
        name="value"
        value={text}
        onBlur={handleBlur}
        onChange={handleChange}
        error={error && (!text || text.trim() === '')}
      />
    </React.Fragment>
  );
}

export default React.memo(Input);
