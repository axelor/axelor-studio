import React, {useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, Checkbox, FormControlLabel} from '@material-ui/core';

const useStyles = makeStyles({
  desciption: {
    marginTop: 5,
    minHeight: '400px',
    backgroundColor: '#656565',
    borderRadius: '15px',
  },
  title: {
    backgroundColor: '#424242',
    color: '#676767',
    padding: '7px',
    borderTopRightRadius: '10px',
    borderTopLeftRadius: '10px',
  },
  checkbox: {
    'color': '#676767',
    'fontSize': 50,
    '&.Mui-checked': {
      color: '#0275d8',
    },
    '& .MuiSvgIcon-root': {fontSize: 22},
  },
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  success: {
    backgroundColor: 'white',
    color: 'green',
    padding: 5,
    margin: 15,
  },
  error: {
    backgroundColor: 'white',
    color: 'red',
    padding: 5,
    margin: 15,
  },
  btn: {
    'display': 'flex',
    'flexDirection': 'column',
    'margin': 10,
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'color': 'white',
    'alignItems': 'center',
    'justifyContent': 'center',
    'textDecoration': 'none',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  formControlLabel: {
    'marginLeft': '1%',
    '&.MuiFormControlLabel-root': {
      color: '#676767',
    },
  },
  notAuth: {
    color: 'red',
  },
});

export default function AuthentificationAction({
  label,
  element,
  bpmnModeler,
  entry,
  action,
  render
}) {
  const classes = useStyles();
  const [error, setError] = useState(false);
  const [isAuth, setAuth] = useState(element.businessObject.isAuthenticated);
  const {name} = entry || {};


  return (
    <div className={classes.root}>
      {!isAuth && (
        <Button
        className={classes.btn}
        onClick={async () => {
          const res = await action();
          if (res === false) {
            setError(true);
            setTimeout(() => {
              setError(false);
            }, 3000);
          } else {
            const modeling = bpmnModeler.get('modeling');
            modeling.updateProperties(element, {
              [name]: true,
            });
            element.businessObject[name] = true;
            setAuth(true);
          }
        }}

        >
          Authentificate
        </Button>
      )}
      <FormControlLabel
        className={classes.formControlLabel}
        control={
          <Checkbox
            onClick={() => {
              if (isAuth === true) {
                setAuth(false);
                element.businessObject[name] = false;
              }
            }}
            className={classes.checkbox}
            checked={isAuth}
          />
        }
        checked={isAuth}
        label={label}
      />
      {error && <p className={classes.notAuth}>Not authorized</p>}
    </div>
  );
}
