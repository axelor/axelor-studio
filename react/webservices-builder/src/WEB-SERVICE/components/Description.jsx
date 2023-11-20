import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/core/styles';

const useStyles = makeStyles({
  desciption: {
    height: '200px',
  },
  error: {
    color: '#CC3333',
  },
  input: {
    outline: 0,
    width: '99%',
    height: '100%',
  },
});

export default function Description({type, element}) {
  const classes = useStyles();
  const [desc, setDesc] = useState('');
  const updateProperty = (value) => {
    element.businessObject.description = value;
  };
  useEffect(() => {
    setDesc(element.businessObject.description);
  }, [element.businessObject.description]);
  return (
    <div className={classnames(classes.desciption, type && classes.error)}>
      <textarea
        value={desc}
        className={classes.input}
        onChange={(e) => setDesc(e.target.value)}
        onBlur={(e) => updateProperty(e.target.value)}
      />
    </div>
  );
}
