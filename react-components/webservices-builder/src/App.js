import React from 'react';
import {Provider} from 'react-redux';
import WebServiceEditor from './WEB-SERVICE';
import {store} from './WEB-SERVICE/store';

function App() {
  return (
    <div className="App">
      <Provider store={store}>
        <WebServiceEditor />
      </Provider>
    </div>
  );
}

export default App;
