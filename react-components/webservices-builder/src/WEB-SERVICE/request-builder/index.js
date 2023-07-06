import React from 'react';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import './App.css';
import RequestBuilder from './request-builder';
import StoreProvider from './store/context';
import BuilderProvider from './store/context';

function AppContent({params, onSave, handleClose, open, bpmnModeler}) {
  return (
    <div className="App">
      <RequestBuilder
        onSave={onSave}
        handleClose={handleClose}
        open={open}
        bpmnModeler={bpmnModeler}
      />
    </div>
  );
}

export default function App({
  handleClose,
  open,
  onSave,
  params,
  bpmnModeler,
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <StoreProvider>
        <BuilderProvider>
          <AppContent
            onSave={onSave}
            handleClose={handleClose}
            open={open}
            params={params}
            bpmnModeler={bpmnModeler}
          />
        </BuilderProvider>
      </StoreProvider>
    </DndProvider>
  );
}
