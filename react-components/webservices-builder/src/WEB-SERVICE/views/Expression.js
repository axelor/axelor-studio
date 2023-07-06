import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import {makeStyles} from '@material-ui/styles';
import {Add, Edit} from '@material-ui/icons';
import CustomizedTables from '../components/Table';
import RequestBuilder from '../request-builder/request-builder';
import HeaderBuilder from '../header-builder/header-builder';
import PayloadBuilder from '../payloads-builder/payload-builder';
import {useDispatch, useSelector} from 'react-redux';
import {updateModelPayload} from '../payloads-builder/features/payloadReducer';

const useStyles = makeStyles({
  root: {
    marginTop: 5,
    width: '100%',
  },
  error: {
    color: '#CC3333',
  },
  label: {
    fontWeight: 'bolder',
    display: 'inline-block',
    verticalAlign: 'middle',
    color: '#666',
    marginBottom: 3,
  },
  containerTable: {
    display: 'flex',
    flexDirection: 'row',
  },
  newIcon: {
    color: '#58B423',
    marginLeft: 5,
  },
  empty: {
    backgroundColor: 'white',
    border: '1px solid #CCCCCC',
    height: '200px',
    width: '100%',
  },
});

export default function Expression({element, entry}) {
  const {label} = entry || {};
  const classes = useStyles();
  const modelParameters = useSelector(
      (state) => state.requestReducer.modelParameters,
  );
  const modelPayloads = useSelector(
      (state) => state.payloadReducer.modelPayloads,
  );
  const headers = useSelector((state) => state.headerReducer.headers);
  const [models, setModels] = useState([]);
  const [builder, setBuilder] = useState('');
  const [openMapper, setMapper] = useState(false);
  const [action, setAction] = useState();
  const dispatch = useDispatch();
  const handleCloseMapper = () => {
    setMapper(false);
  };

  const handleSave = (models) => {
    dispatch(
        updateModelPayload(
        action === 'EDIT' ? models : [...modelPayloads, ...models],
        ),
    );
  };
  useEffect(() => {
    if (element?.parent?.children[0].id === element?.id) {
      setBuilder('REQUEST');
      setModels(modelParameters);
    } else if (element?.parent?.children[1].id === element?.id) {
      setBuilder('HEADER');
      setModels(headers);
    } else if (element?.parent?.children[2].id === element?.id) {
      setBuilder('PAYLOAD');
      setModels(modelPayloads);
    }
  }, [element, builder, modelParameters, modelPayloads, headers]);

  const requestType = () => {
    if (builder === 'REQUEST') {
      return (
        <RequestBuilder
          open={openMapper}
          handleClose={handleCloseMapper}
          action={action}
        />
      );
    } else if (builder === 'HEADER') {
      return (
        <HeaderBuilder
          open={openMapper}
          handleClose={handleCloseMapper}
          action={action}
        />
      );
    } else if (builder === 'PAYLOAD') {
      return (
        <PayloadBuilder
          open={openMapper}
          handleClose={handleCloseMapper}
          action={action}
          onSave={handleSave}
          initialData={modelPayloads}
        />
      );
    } else return '';
  };
  return (
    <div className={classnames(classes.root, false && classes.error)}>
      {label && <label className={classnames(classes.label)}>{label}</label>}
      <div className={classnames(classes.containerTable)}>
        {models.length === 0 ? (
          <div className={classes.empty}></div>
        ) : (
          <CustomizedTables
            type={
              builder === 'REQUEST' ?
                'parameters' :
                builder === 'PAYLOAD' ?
                'payloads' :
                'headers'
            }
          />
        )}
        <Edit
          className={classes.newIcon}
          onClick={() => {
            setMapper(true);
            setAction('EDIT');
          }}
        />
        <Add
          className={classes.newIcon}
          onClick={() => {
            setMapper(true);
            setAction('ADD');
          }}
        />
        {openMapper && requestType()}
      </div>
    </div>
  );
}
