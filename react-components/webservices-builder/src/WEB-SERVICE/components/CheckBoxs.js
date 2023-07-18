import React, {useEffect} from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/core/styles';
import Checkbox from './Checkbox';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 5,
  },
  label: {
    fontWeight: "bolder",
    color: "#666",
  },
  checkbox: {
    margin: '3px 3px 3px 0px',
  },
});

export default function Checkboxs({entry, element, className, onChange}) {
  const classes = useStyles();
  const {boxs, label} = entry || {};

  useEffect(() => {}, [element.businessObject]);

  return (
    <div className={classnames(classes.root, className)}>
      <label className={classnames(classes.label)}>{label}</label>
      {boxs &&
        boxs.map((option, index) => {
          return (
            <Checkbox
              key={index}
              entry={option}
              element={element}
              onChange={onChange}
            />
          );
        })}
    </div>
  );
}
