import React from 'react';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import './App.css';
import PayloadBuilder from './payload-builder';
import BuilderProvider from './store/context';

function AppContent({params, onSave, handleClose, open, bpmnModeler}) {
  return (
    <div className="App">
      <PayloadBuilder
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
      <BuilderProvider>
        <AppContent
          onSave={onSave}
          handleClose={handleClose}
          open={open}
          params={params}
          bpmnModeler={bpmnModeler}
        />
      </BuilderProvider>
    </DndProvider>
  );
}
