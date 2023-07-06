import React from 'react';
import {makeStyles} from '@material-ui/styles';
import {ArrowRightAlt, Delete} from '@material-ui/icons';
import {HEADERS_KEYS, HEADERS_VALUES} from '../../constants';
import {SelectionField} from '../../components'
const useStyles = makeStyles({
  headers: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'self-end',
    justifyContent: 'space-between',
    maxWidth: '70%',
    marginBottom: '2%',
  },
  delete: {
    color: '#0274d7',
    fontSize: 25,
    marginTop: 'auto',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: '100%',
    overflow: 'hidden',
  },
  icon:{
   color: '#0274d7',
   fontSize:24
  },
  inputSelect: {
    marginLeft: '2%',
    marginRight: '2%',
    width: '96%'
  },
});

export default function Header({handleChange, handleDelete, header, id}) {
  const classes = useStyles();
  return (
    <div className={classes.headers}>
      <SelectionField
        name="name"
        title="Header name"
        placeholder="Header name"
        optionLabelKey="name"
        value={{name: header.wsKey}}
        onChange={(e) => {
          handleChange({...header, wsKey: e?.name ? e.name : e}, id);
        }}
        classes={{root: classes.inputSelect}}
        options={HEADERS_KEYS}
      />
      <ArrowRightAlt className={classes.icon} />
      <SelectionField
        name="name"
        title="Value"
        placeholder="Value"
        optionLabelKey="name"
        value={{name: header.wsValue}}
        onChange={(e) =>
          handleChange({...header, wsValue: e?.name ? e.name : e}, id)
        }
        classes={{root: classes.inputSelect}}
        options={HEADERS_VALUES}
      />
      <Delete onClick={() => handleDelete(id)} className={classes.delete} />
    </div>
  );
}
