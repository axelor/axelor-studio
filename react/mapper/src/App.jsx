import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider } from '@axelor/ui';
import { useAppTheme } from './custom-hooks/useAppTheme';

import Builder from './Builder';
import './App.css';

function AppContent({
                      isBPMN,
                      open,
                      handleClose,
                      isDialog,
                      onSave,
                      param,
                      getProcesses,
                      getProcessElement,
                      isDMNAllow,
                      getDMNValues
                    }) {
  const [values, setValues] = React.useState(null);

  React.useEffect(() => {
    const value = param && param();
    setValues(value);
  }, [param]);

  const params = React.useMemo(() => {
    const _params = {
      id: null,
      model: 'com.axelor.studio.db.ValueMapper',
      resultField: 'script',
      resultMetaField: 'scriptMeta',
      targetField: 'targetField',
      sourceField: 'sourceField',
    };
    const regex = /[?&]([^=#]+)=([^&#]*)/g;
    const url = window.location.href;
    let match = regex.exec(url);
    while (match) {
      _params[match[1]] = match[2];
      match = regex.exec(url);
    }
    return _params;
  }, []);

  return (
    <div className="App">
      <Builder
        params={param ? values : params}
        isBPMN={isBPMN}
        open={open}
        handleClose={handleClose}
        isDialog={isDialog}
        onSave={onSave}
        getProcesses={getProcesses}
        getProcessElement={getProcessElement}
        isDMNAllow={isDMNAllow}
        getDMNValues={getDMNValues}
      />
    </div>
  );
}

export default function App({
                              isBPMN,
                              open,
                              handleClose,
                              isDialog,
                              onSave,
                              param,
                              getProcesses,
                              getProcessElement,
                              isDMNAllow,
                              getDMNValues
                            }) {
  const data = useAppTheme();
  const { theme, options } = data;

  return (
    <ThemeProvider options={options} theme={theme}>
      <DndProvider backend={HTML5Backend}>
        <AppContent
          isBPMN={isBPMN}
          open={open}
          handleClose={handleClose}
          isDialog={isDialog || isBPMN}
          onSave={onSave}
          param={param}
          getProcesses={getProcesses}
          getProcessElement={getProcessElement}
          isDMNAllow={isDMNAllow}
          getDMNValues={getDMNValues}
        />
      </DndProvider>
    </ThemeProvider>
  );
}