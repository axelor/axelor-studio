import React, { useState, useEffect } from 'react';
import ExpressionBuilder from './views';

const getParams = () => {
  const params = new URL(document.location).searchParams;
  const isCondition = params.get('isCondition') === 'true';
  const queryModel = params.get('queryModel') || '';
  //for param queries
  //?type=query&model=com.axelor.auth.db.Permission&id=1&queryModel=com.axelor.apps.account.db.Account
  return {
    type: params.get('type') === 'query' ? 'bpmQuery' : 'expressionBuilder',
    id: params.get('id'),
    model: params.get('model'),
    resultField: params.get('resultField'),
    resultMetaField: params.get('resultMetaField'),
    modelFilter: params.get('modelFilter'),
    withParam: params.get('withParam') === 'true',
    queryModel,
    isCondition,
    isPackage: isCondition && queryModel.includes('*'),
  };
};

function App() {
  const [parameters, setParameters] = useState({});

  useEffect(() => {
    const parentElement =
      window &&
      window.top &&
      window.top.document &&
      window.top.document.getElementsByClassName('html-view ng-scope');
    const element = parentElement && parentElement[0];
    if (element && element.style) {
      element.style.height = '100%';
      element.style.minHeight = '450px';
    }
  }, []);

  useEffect(() => {
    setParameters(getParams());
  }, []);

  return <ExpressionBuilder parameters={parameters} />;
}

export default App;
