import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { PlayArrow, RotateLeft } from '@material-ui/icons';
import { runTestConnector } from '../../services/api';
import { useSelector } from 'react-redux';
import {Audio} from "react-loader-spinner";
//import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";


const useStyles = makeStyles({
  desciption: {
    marginTop: 5,
    minHeight: '400px',
    backgroundColor: '#656565',
    borderRadius: '15px',
    display: "grid",
    gridTemplateColumns :'1fr',
    gridAutoRows:'25px 1fr'
  },
  title: {
    backgroundColor: '#424242',
    color: 'white',
    padding: '7px',
    borderTopRightRadius: '10px',
    borderTopLeftRadius: '10px',
  },
  testArea: {
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
  console: {
    'color': 'white',
    'borderRadius': 20,
    'margin': 15,
    'minHeight': '40%',
    'fontWeight': 'bold !important',
    '& .json-formatter-key': {
      color: '#EBC456 !important',
      marginRight: 5,
    },
    '& .json-formatter-string': {
      color: 'white !important',
      width: '100%',
      display: 'block',
    },
    '& .json-formatter-boolean': {
      color: 'white !important',
    },
    '& .json-formatter-number': {
      color: 'white !important',
    },
    '& .json-formatter-function': {
      color: 'white !important',
    },
    '& .json-formatter-row': {
      marginBottom: 8,
    },
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    'display': 'flex',
    'flexDirection': 'column',
    'margin': 10,
    'backgroundColor': '#0275d8',
    'borderColor': '#0267bf',
    'color': 'white',
    'alignItems': 'center',
    'lineHeight': 0,
    'justifyContent': 'center',
    'textTransform': 'none',
    'textDecoration': 'none',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
      color: 'white',
    },
  },
  result: {
    padding: 10,
    color: 'white',
  },
});
const Sucess = () => {
  const classes = useStyles();
  return (
    <div className={classes.success}>Success, Your query run Successfully</div>
  );
};
const Error = () => {
  const classes = useStyles();
  return <div className={classes.error}>Error, Your query is incorrect</div>;
};

export default function TestConnector({ type, connector, element }) {
  const classes = useStyles();
  const [result, setResult] = useState({ status: null, data: 'no data' });
  const targets = useSelector((state) => state.contextReducer.targets);
  const [loading, setLoading] = useState(false);
  const runTest = async () => {
    const actionRequest = {
      model: 'com.axelor.studio.db.WsConnector',
      action: 'action-ws-connector-method-call-connector',
      data: {
        context: {
          connector: connector,
          authenticator: element.parent.businessObject.defaultWsAuthenticator,
          _recordId: targets[0]?.target?.id,
          _recordModel: targets[0]?.model?.fullName,
        },
      },
    };
    const res = await runTestConnector(actionRequest);
    setLoading(false);
    if (res?.status === 0 && res?.data) {
      setResult({ status: true, data: res?.data[0]?.values ? res?.data[0].values : res?.data[0] });
    } else {
      setResult({ status: false, data: res?.data instanceof Array ? res?.data[0] : res?.data });
    }
  };
  const runQueryTest = () => {
    if (targets?.length === 0) {
      setResult({
        status: false,
        data: 'please provide a context to be executed !',
      });
    } else {
      setLoading(true);
      runTest();
    }
  };
  useEffect(() => {
    if (document.getElementById('result') != null) {
      document.getElementById('result').innerHTML = '';
    }
    document.getElementById('result').innerHTML = JSON.stringify(
      result?.data ? result?.data : "Error while parsing result ! make sure you made the right request's specifications", undefined, 2
    ).replace(/\\n/g, '<br/>');
  }, [result?.data]);

  return (
    <>
      <div className={classnames(classes.desciption, type && classes.error)}>
        <div className={classes.title}>Query Trace</div>
        <div className={classes.testArea}>
          {result?.status && result?.status !== null && !loading && (
            <>
              <Sucess />
            </>
          )}
          {!result?.status && result?.status !== null && !loading  && <Error />}
          {
            loading ? (
            //  <div style={{display:"flex",justifyContent:'center',alignContent:'center'}}>
              <Audio
                type="TailSpin"
                color="#00BFFF"
                height={40}
                width={40}
                timeout={3000} // Set timeout in milliseconds
              />
            //  </div>
            ) : (
              <div className={classes.console} id="result"></div>)
          }
        </div>
      </div>
      <div>
        <div className={classes.buttons}>
          {result?.status != null && !loading && (
            <Button
              onClick={() => {
                setResult({ status: null, data: 'no data' });
              }}
              className={classes.btn}
            >
              <RotateLeft />
              <div>Reset</div>
            </Button>
          )}
          <Button onClick={() => { runQueryTest() }} disabled={loading} className={classes.btn}>
             <PlayArrow />
            <div style={{color:'white'}}>Run query test</div>
          </Button>
        </div>
      </div>
    </>
  );
}
